# Capture recipes

Getting token usage into the ledger, per stack. The principle: **capture at chokepoints**, not per application. One integration at a provider boundary covers everything behind it.

## Claude Code

Built in — nothing to configure.

```bash
npx carbon-md sync claude-code
```

Reads local transcripts, dedupes by message id, keeps state so re-runs are safe. See [`sync`](/cli/sync/).

## LiteLLM

LiteLLM sees every provider you route through it. Add a callback that appends a usage line:

```python
import json, datetime, litellm

def log_usage(kwargs, response, start, end):
    u = response.usage
    with open("usage.jsonl", "a") as f:
        f.write(json.dumps({
            "ts": datetime.datetime.utcnow().isoformat() + "Z",
            "model": response.model,
            "provider": kwargs.get("custom_llm_provider"),
            "input_tokens": u.prompt_tokens,
            "output_tokens": u.completion_tokens,
        }) + "\n")

litellm.success_callback = [log_usage]
```

```bash
npx carbon-md ingest usage.jsonl
```

## OpenRouter / any OpenAI-compatible API

Every response carries a `usage` object. One line per call is the whole integration:

```js
const res = await client.chat.completions.create({ model, messages });
appendFileSync("usage.jsonl", JSON.stringify({
  ts: new Date().toISOString(),
  model: res.model,
  provider: "openrouter",
  input_tokens: res.usage.prompt_tokens,
  output_tokens: res.usage.completion_tokens,
}) + "\n");
```

## OpenTelemetry (any instrumented agent)

If your agent exports OTel metrics, you're already done — `ingest` flattens `*.token.usage` and `gen_ai.client.token.usage`.

```yaml
# collector config — write metrics to a file carbon-md can read
exporters:
  file:
    path: /var/log/otel/usage.json
service:
  pipelines:
    metrics:
      receivers: [otlp]
      exporters: [file]
```

```bash
npx carbon-md ingest /var/log/otel/usage.json
```

## Hermes (self-hosted persistent agent)

Built in. Hermes already records its own token usage per session, model and billing provider — `sync hermes` reads that database **read-only** and ingests only what's new.

```bash
npx carbon-md sync hermes              # default ~/.hermes/state.db
npx carbon-md sync hermes --db /path/to/state.db --dry-run
```

Because the agent's counters are running totals rather than append-only events, ingestion is **delta-based**: safe to run hourly from Hermes' own cron, mid-session, without double counting. Multi-provider setups (Nous Research, OpenAI/Codex, Kimi, OpenRouter…) are attributed per provider automatically. See [`sync`](/cli/sync/) for what is and isn't counted.

## Your own agent

Emit the [usage report format](/usage-report/) and ingest it. Four fields — `ts`, `model`, `input_tokens`, `output_tokens` — are enough.

This is also the path for an agent that wants to account for **itself**: write a line per call, ingest on a schedule. See [For agents](/guides/for-agents/).

## Agent compatibility

| Agent / tool | Capture path | Notes |
|---|---|---|
| Claude Code | `sync claude-code` | native, shipped |
| LiteLLM | callback → `ingest` | covers every provider behind it |
| OpenRouter | response `usage` → `ingest` | |
| LangGraph / CrewAI | callback → `ingest` | Python SDK callback planned |
| Any OTel agent | OTLP → `ingest` | zero custom code |
| Codex CLI | `ingest` from session logs | logs `token_count` events in `~/.codex/sessions` |
| Hermes | `sync hermes` | native — reads its own usage database, read-only, delta-based |
| Cursor | Admin API only | no local usage log |
| Closed assistants | not capturable | no usage exposed |

## Choosing a granularity

Per-call events give the richest breakdowns. Aggregated rows (per session, per model, per day) are fine too — the ledger doesn't care, and `status` will simply report fewer, larger events.

## Avoid double counting

Use **one** path per stream of traffic. If LiteLLM already logs a call, don't also ingest the provider's own export of the same call. Sources are tracked separately in `.carbon-md/sources/`, but two different sources describing the same traffic will both count.
