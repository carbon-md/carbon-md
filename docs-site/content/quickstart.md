# Quickstart

From nothing to a measured footprint in about five minutes. No account, no API key, no data leaving your machine.

## Requirements

- **Node.js ≥ 18** (the CLI runs through `npx`).
- A project directory — a repo root, or the home directory of the agent you want to account for.

## 1. Initialize

```bash
npx carbon-md init
```

This detects your stack and writes two things:

- **`carbon.md`** — your policy file, at the root. Human-readable Markdown with a YAML front-matter block.
- **`.carbon-md/`** — the local store (ledger, source state, keys). It is gitignored; nothing is uploaded anywhere.

## 2. Feed it usage

Pick whichever matches your setup — the goal is to get token counts into the ledger.

```bash
# Claude Code — reads local transcripts, dedupes, idempotent
npx carbon-md sync claude-code

# Anything else — a usage JSONL, OTLP export, LiteLLM log…
npx carbon-md ingest usage.jsonl
```

`ingest` auto-detects OTLP/JSON and flattens standard OpenTelemetry token metrics, so most agent frameworks work without custom glue. Full recipes: [Capture recipes](/guides/capture/).

## 3. See where you stand

```bash
npx carbon-md status
```

```
carbon.md — my-project

  This month     412 g CO2e     (220 g – 780 g)     128 calls
  All time       1.51 kg CO2e   (810 g – 2.9 kg)    873,412 tokens

  Policy         110% contribution · removal-weighted
  Outstanding    0.0017 tCO2e  (~$0.10 at removal-weighted prices)
```

Every figure carries a **low–central–high range**. That is not hedging — it is the honest shape of the data. See [Methodology & factors](/methodology/).

## 4. Contribute (when you're ready)

```bash
npx carbon-md contribute
```

Prepares an order matching `policy × footprint`. By default it is **confirm-first**: nothing is spent unattended above your `approval_above` threshold. To let an agent settle autonomously under a hard cap, set up a prepaid wallet — see [Retirements & receipts](/guides/retirements/).

## 5. Publish the proof

```bash
npx carbon-md export
```

Writes a self-contained `public/` folder — a ledger page, a `badge.svg` for your README, and `ledger.json` (the machine-readable dump). Host it anywhere. See [Publish your ledger](/guides/publish-ledger/).

```markdown
![carbon.md](https://your-ledger-url/badge.svg)
```

## What just happened

You created a policy a human controls, a measurement path an agent feeds automatically, and a public artifact a stranger can check. That is the whole loop: **measure → govern → contribute → prove**.

> **Next:** [Concepts](/concepts/) explains why the loop is shaped this way, or jump to [The carbon.md file](/spec/) to tune your policy.
