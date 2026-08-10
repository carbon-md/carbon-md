# carbon-md sync

Pulls usage from a known source into the ledger. Idempotent — safe to run on a schedule.

```bash
npx carbon-md sync <source> [options]
```

## Sources

| Source | Reads |
|---|---|
| `claude-code` | local Claude Code transcripts |
| `hermes` | a Hermes agent's own usage database |

Anything else goes through [`ingest`](/cli/ingest/) — see [Capture recipes](/guides/capture/).

## sync claude-code

```bash
npx carbon-md sync claude-code              # this project's transcripts
npx carbon-md sync claude-code --all        # every project
npx carbon-md sync claude-code --dir <path> # a specific transcript directory
npx carbon-md sync claude-code --dry-run    # show what would be ingested
```

Reads `~/.claude/projects/…/*.jsonl`. Every assistant message carries `message.usage` (token counts) and `message.model`.

**How it stays honest:**

- **Dedupe by message id.** Streamed responses write several entries per message; the one with the highest `output_tokens` wins.
- **Per-file state** in `.carbon-md/sources/claude-code.json` — re-running never double-counts.
- **Cache tokens**: `cache_creation` is folded into input (real compute); `cache_read` is recorded in `meta` but excluded from the estimate.
- Synthetic models (`<synthetic>` etc.) are skipped.

### Output

```
✔ Synced 128 Claude Code messages (14 files) → ~412 g CO2e central estimate, 873,412 tokens
  run `npx carbon-md status` to see your position
```

## sync hermes

For [Hermes](https://github.com/carbon-md/carbon-md)-style persistent agents that already record their own token usage. Reads the agent's database **read-only** — no callback, no patched inference path.

```bash
npx carbon-md sync hermes                    # default ~/.hermes/state.db
npx carbon-md sync hermes --db /path/state.db
npx carbon-md sync hermes --dry-run
```

### How it works

Reads the `session_model_usage` table — one row per session × model × billing provider, holding `input_tokens`, `output_tokens`, `reasoning_tokens`, `cache_read_tokens`, `cache_write_tokens`.

**Delta ingestion.** Unlike transcripts, these rows are *mutable running totals*: an active session's counters keep growing. So each run ingests only the **increment** since the last sync, tracked per `session:model:provider` in `.carbon-md/sources/hermes.json`. A session synced mid-flight and again later is counted once, correctly.

**Multi-provider.** `billing_provider` is preserved on every event, so a Hermes routing across several providers (Nous Research, OpenAI/Codex, Kimi/Moonshot, OpenRouter, Gemini, xAI) is attributed per provider.

**Database access.** Uses `node:sqlite` when available (Node ≥ 22.5), falling back to the `sqlite3` CLI. Always opened read-only — carbon.md never writes to the agent's database.

### What counts toward the estimate

| Token type | Counted? | Where |
|---|---|---|
| `input_tokens` | ✅ at 0.2× weight | estimate |
| `output_tokens` | ✅ full weight | estimate |
| `reasoning_tokens` | ❌ **not counted** | recorded in `meta` |
| `cache_write_tokens` | ❌ **not counted** | recorded in `meta` |
| `cache_read_tokens` | ❌ not counted | recorded in `meta` |

> **This is deliberately conservative — and it under-reports.** Reasoning tokens *are* generated (they cost a full forward pass), and cache writes are real compute. On reasoning-heavy models they can be 20–30% of output volume. They are captured in `meta` so the ledger can be recomputed when the accounting is revised. See [Methodology](/methodology/).

### Output

```
✔ Synced 47 Hermes usage delta entries (1235 records checked) → ~2.10 kg CO2e central estimate, 4,102,883 tokens
  run `npx carbon-md status` to see your position
```

Nothing new:

```
✔ Up to date — no new Hermes usage (1235 session-model records checked).
```

## Options

| Flag | Applies to | Meaning |
|---|---|---|
| `--all` | `claude-code` | Scan every project directory |
| `--dir <path>` | `claude-code` | Point at a specific transcript directory |
| `--db <path>` | `hermes` | Database path (default `~/.hermes/state.db`) |
| `--dry-run` | both | Report what would be ingested; write nothing |

## Automating

`sync` is designed for cron. Hourly is fine — it does nothing when there's nothing new.

```bash
0 * * * * cd /path/to/project && npx carbon-md sync hermes >/dev/null 2>&1
```
