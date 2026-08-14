# carbon-md ingest

Loads usage from a file or stdin. The universal path — if your stack can write JSON, it can be accounted for.

```bash
npx carbon-md ingest <file>
npx carbon-md ingest -          # read stdin
```

## Accepted inputs

Format is auto-detected:

| Input | Detection |
|---|---|
| **Usage-report JSONL** | one JSON object per line with token fields |
| **JSON array** | an array of the same objects |
| **OTLP / OpenTelemetry JSON** | flattens `*.token.usage` and `gen_ai.client.token.usage` |

Field names and aliases are documented in [Usage report format](/usage-report/).

## Examples

```bash
# a usage log your agent writes
npx carbon-md ingest usage.jsonl

# an OpenTelemetry export — any OTel-instrumented agent works
npx carbon-md ingest otel-export.json

# straight from a pipeline
my-agent --emit-usage | npx carbon-md ingest -
```

## Idempotency

Ingested batches are tracked in `.carbon-md/sources/`. Re-ingesting the same file does not double-count. When in doubt, `--dry-run` first:

```bash
npx carbon-md ingest usage.jsonl --dry-run
```

## Output

```
✔ Ingested 412 events → ~1.2 kg CO2e central estimate, 2,910,004 tokens
  3 models were classified by guess — see `npx carbon-md factors`
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `0 events ingested` | fields not recognised | check names against [usage-report](/usage-report/) |
| Everything is `medium (guessed)` | model strings unknown to the classifier | fine — ranges widen; consider a PR to the factor table |
| Numbers look too high | cache reads counted as input | send them as `cache_read_tokens`; they're then excluded |
| Duplicate-looking totals | ingesting the same data through two paths | use one source per stream (`sync` **or** `ingest`) |
