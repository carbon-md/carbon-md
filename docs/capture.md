# Capture recipes

How to get your agents' token usage into the carbon-md ledger. Ordered from zero-config to fully custom.

**The principle:** if an agent tracks its own usage (most serious ones do), it should *push* carbon.md usage reports — one interface, many emitters. Transcript scraping (`sync`) is the zero-config fallback for tools that don't emit yet.

## Which agents work today?

| Agent / tool | Self-tracks usage? | Capture path | Status |
|---|---|---|---|
| **Claude Code** | ✅ transcripts + OpenTelemetry | `carbon-md sync claude-code` (zero-config) or OTel → ingest (push) | ✅ works today |
| **Codex CLI** (OpenAI) | ✅ `token_count` events in `~/.codex/sessions/*.jsonl` (cumulative — needs delta math) | `sync codex` adapter | 🔜 planned; meanwhile [ccusage](https://ccusage.com/guide/codex/)-style exports can feed `ingest` |
| **Antigravity CLI / agy** (Google) | Gemini CLI lineage shipped OTel telemetry with token metrics; agy expected to expose the same — verify per install | OTel collector → `ingest` (auto-detected) | ⚠️ should work via OTel; unconfirmed |
| **LiteLLM / OpenRouter** | ✅ usage in every response | callback/log → `ingest` | ✅ works today (recipe below) |
| **LangGraph / CrewAI** | ✅ via callbacks | Python SDK callback | 🔜 planned (sdk-python 0.1) |
| **Cursor** | Team-level usage via Admin API only; no local per-call logs | periodic Admin-API importer | 🔜 feasible, teams only |
| **Pi** (Inflection) and consumer apps | ❌ nothing exposed | — | ❌ not capturable — this is exactly what the spec's "SHOULD emit usage reports" rule asks vendors to fix |

If your tool isn't listed: does it expose per-call model + token counts anywhere (logs, callbacks, OTel, API)? Then it works via `ingest` today. If it exposes nothing, no external tool can honestly account for it — ask the vendor to emit.

## 1. Claude Code (built-in)

Claude Code writes local transcripts (`~/.claude/projects/…/*.jsonl`) that include model and token usage for every response. From a project with a `carbon.md`:

```bash
npx carbon-md sync claude-code            # this project's sessions
npx carbon-md sync claude-code --all      # every Claude Code project on this machine
npx carbon-md sync claude-code --dry-run  # see what would be ingested
```

- Idempotent: re-running only picks up new messages (state in `.carbon-md/sources/claude-code.json`).
- Subagent transcripts are included.
- **Cache-read tokens are recorded but excluded from the estimate** — serving from prompt cache costs far less compute than a fresh forward pass; we'd rather under-claim than inflate. The raw counts stay in the ledger (`meta.cache_read_tokens`) so estimates can be revised when better public data exists.

Automate it: run the sync on a schedule (cron / Task Scheduler), or add a Claude Code `SessionEnd` hook in `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionEnd": [
      { "hooks": [{ "type": "command", "command": "npx carbon-md sync claude-code" }] }
    ]
  }
}
```

## 1b. Claude Code via OpenTelemetry (push, realtime)

Claude Code can push metrics instead of (or as well as) being scraped. Enable telemetry and point it at an [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) that writes a file:

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=http/json
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

Minimal collector config (`otel-config.yaml`) — receives OTLP, writes JSON lines:

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
exporters:
  file:
    path: ./otel-metrics.jsonl
service:
  pipelines:
    metrics:
      receivers: [otlp]
      exporters: [file]
```

Then, whenever you like:

```bash
npx carbon-md ingest otel-metrics.jsonl --source claude-code-otel
```

`ingest` auto-detects OTLP/JSON lines — no flags needed. It flattens any `*.token.usage` metric (Claude Code's `claude_code.token.usage`, Gemini-lineage `gemini_cli.token.usage`, …) and the GenAI semconv `gen_ai.client.token.usage`, so **any OTel-instrumented agent gets captured the same way**. Notes:

- Use **delta** temporality (Claude Code's default). Cumulative sums would double-count; `ingest` warns if it sees them.
- Token types map as: `input`/`cacheCreation`/`tool` → tokens_in · `output`/`thought` → tokens_out · `cacheRead`/`cache` → recorded, excluded from estimates.
- Don't run OTel capture *and* `sync claude-code` on the same sessions — that double-counts. Pick one per machine.

## 2. LiteLLM proxy (one integration, every provider)

If your agents route through a [LiteLLM proxy](https://docs.litellm.ai/), log successful calls to JSONL and ingest them. Minimal custom callback (`carbon_log.py`):

```python
import json, datetime
from litellm.integrations.custom_logger import CustomLogger

class CarbonLog(CustomLogger):
    def log_success_event(self, kwargs, response_obj, start_time, end_time):
        usage = getattr(response_obj, "usage", None)
        if not usage:
            return
        with open("carbon-usage.jsonl", "a") as f:
            f.write(json.dumps({
                "ts": datetime.datetime.utcnow().isoformat() + "Z",
                "model": kwargs.get("model"),
                "provider": kwargs.get("custom_llm_provider"),
                "input_tokens": usage.prompt_tokens,
                "output_tokens": usage.completion_tokens,
            }) + "\n")

carbon_log = CarbonLog()
```

Register it in your proxy config:

```yaml
litellm_settings:
  callbacks: carbon_log.carbon_log
```

Then, as often as you like:

```bash
npx carbon-md ingest carbon-usage.jsonl --source litellm
```

## 3. Anything else (generic JSONL)

`carbon-md ingest` accepts one JSON object per line, from a file or stdin (`-`). Field aliases:

| Field | Accepted keys |
|---|---|
| model | `model`, `model_name` |
| input tokens | `tokens_in`, `input_tokens`, `prompt_tokens` (also nested under `usage`) |
| output tokens | `tokens_out`, `output_tokens`, `completion_tokens` (also nested under `usage`) |
| timestamp | `ts`, `timestamp`, `startTime` (optional, defaults to now) |
| provider | `provider`, `custom_llm_provider` (optional) |

```bash
some-agent --emit-usage | npx carbon-md ingest - --source my-agent
```

Unrecognized models are mapped to the `medium` class with a warning — check `npx carbon-md factors` for the classes and open an issue/PR to improve the mapping.
