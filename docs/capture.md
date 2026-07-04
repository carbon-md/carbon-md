# Capture recipes

How to get your agents' token usage into the carbon-md ledger. Three paths, from zero-config to fully custom.

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
