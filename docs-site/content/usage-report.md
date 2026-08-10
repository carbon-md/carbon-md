# Usage report format

The **push interface**. Rather than writing a scraper for every agent, carbon.md names a format that any self-tracking agent can emit. If your stack can write a line of JSON per LLM call, it can be carbon-accounted.

## The shape

One JSON object per line (JSONL). Only four fields are required.

```jsonl
{"ts":"2026-08-01T09:12:00Z","model":"gpt-5.5","input_tokens":18400,"output_tokens":2100}
{"ts":"2026-08-01T09:13:04Z","model":"claude-sonnet-4","input_tokens":9100,"output_tokens":840,"provider":"anthropic"}
```

| Field | Required | Notes |
|---|---|---|
| `ts` | yes | ISO 8601 timestamp |
| `model` | yes | provider's model string; used to classify the emission factor |
| `input_tokens` | yes | prompt tokens |
| `output_tokens` | yes | generated tokens |
| `provider` | no | e.g. `anthropic`, `openai`, `nous`, `openrouter` — improves attribution |
| `cache_read_tokens` | no | recorded in `meta`, **excluded** from the estimate |
| `cache_write_tokens` | no | counted as input (cache creation is real compute) |
| `reasoning_tokens` | no | counted as output (reasoning tokens are generated) |
| `session_id` | no | free-form grouping key |

Aliases are accepted: `prompt_tokens`/`completion_tokens`, `tokens_in`/`tokens_out`, `input`/`output`.

Ingest it:

```bash
npx carbon-md ingest usage.jsonl
cat usage.jsonl | npx carbon-md ingest -
```

## OpenTelemetry

`ingest` auto-detects OTLP/JSON and flattens standard token metrics — `*.token.usage` and `gen_ai.client.token.usage` — so **any OTel-instrumented agent works with no custom code**. Point your collector at a file and ingest it:

```bash
npx carbon-md ingest otel-export.json
```

See [Capture recipes](/guides/capture/) for a collector configuration.

## Why push, not scrape

Scraping transcripts is fragile: formats change, and many agents never write token counts to disk at all. A named push format means:

- an agent can account for **itself** without carbon.md knowing anything about it,
- new frameworks need zero work on our side,
- the same path serves runtime logging, batch backfills, and OTel pipelines.

## Emitting from your own agent

Any language, any framework — most OpenAI-compatible APIs return a `usage` object on every response. Append one line per call:

```js
const res = await client.chat.completions.create({ model, messages });
appendFileSync("usage.jsonl", JSON.stringify({
  ts: new Date().toISOString(),
  model: res.model,
  provider: "openai",
  input_tokens: res.usage.prompt_tokens,
  output_tokens: res.usage.completion_tokens,
}) + "\n");
```

That's the entire integration. Run `carbon-md ingest usage.jsonl` on a schedule (or let your agent run it).

## Related

- [ingest](/cli/ingest/) — command reference
- [Capture recipes](/guides/capture/) — per-stack recipes
- [The carbon.md file](/spec/) — how ingested events are stored
