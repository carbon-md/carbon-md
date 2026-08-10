# Methodology & factors

How carbon.md turns tokens into grams — and why every number carries a range.

## Current version

```
carbonmd-factors-2026-07
```

The version is pinned in your `carbon.md` and stamped on **every ledger event**. Estimates are only comparable within a version. When factors are revised, old events keep their original stamp — we never silently rewrite history.

## The model

Emissions are estimated per call from token counts and a per-model-class factor:

```
weighted_ktokens = (output_tokens + 0.2 × input_tokens) / 1000
gCO2e            = class_factor × weighted_ktokens
```

Input tokens are weighted at **0.2×** output: prefill is parallel and cheap per token, decode is sequential and expensive.

### Class factors (gCO₂e per 1k output tokens)

| Class | Low | Central | High |
|---|---|---|---|
| `frontier` | 1.5 | 4.5 | 15 |
| `large` | 0.8 | 2.5 | 8 |
| `medium` | 0.2 | 0.8 | 2.5 |
| `small` | 0.03 | 0.15 | 0.6 |

### Derivation

- [EcoLogits](https://ecologits.ai) methodology (JOSS 2025) regression curves, plus
- public provider disclosures (Google's 2025 median-prompt figure, OpenAI per-query statements),
- converted with a world-average grid intensity of ~400 gCO₂e/kWh,
- rounded to one significant figure of honesty.

## Why the ranges are wide

Because the truth is uncertain, and pretending otherwise is the failure mode of this whole category. The unknowns:

- model size and architecture (rarely disclosed),
- batching and hardware utilisation at inference time,
- data-centre PUE and the **grid intensity of the region** you were routed to,
- whether your request hit a cache, a speculative decode path, or a cold start.

A single confident gram figure would be a fiction. A range is the honest shape.

## Token accounting rules

| Token type | Treatment | Why |
|---|---|---|
| `input` | ×0.2 weight | prefill is parallel, cheap per token |
| `output` | full weight | sequential decode dominates energy |
| `cache_read` | **excluded**, recorded in `meta` | serving from cache costs far less; counting it would overstate |
| `cache_write` | source-dependent — see below | cache creation is a real forward pass |
| `reasoning` | source-dependent — see below | they are generated tokens |

Cache-read exclusion is not cosmetic. On heavy agent workloads cache reads routinely exceed input tokens by an order of magnitude — including them would inflate footprints by multiples.

### Where sources currently differ

Capture adapters do not yet treat every token type identically. This is stated plainly rather than smoothed over:

| Source | `cache_write` | `reasoning` |
|---|---|---|
| [`sync claude-code`](/cli/sync/) | folded into **input** | n/a |
| [`sync hermes`](/cli/sync/) | recorded in `meta` only | recorded in `meta` only |
| [`ingest`](/cli/ingest/) | as supplied | as supplied |

Where a token type is recorded in `meta` but not counted, the estimate is **conservative — it under-reports**. On reasoning-heavy models, reasoning tokens can be 20–30% of output volume. Because the raw counts are preserved in the ledger, footprints can be recomputed when the accounting is unified in a future factors version — no data is lost, only currently unused.

## Model classification

Model strings are mapped to a class by whole-token matching (so `gpt-5-mini` lands in `small` while `gemini` is untouched):

- **small** — `haiku`, `mini`, `flash`, `nano`, `lite`, `micro`, `gemma`, `phi`, or a `1b`–`14b` parameter tag
- **frontier** — `opus`, `ultra`, `heavy`, `gpt-5`, `o3`, `o4`
- **large** — `sonnet`, `gpt-4`, `gemini pro`, `grok`, `r1`, `mistral large`, `405b`, `command`
- **medium** — everything else, flagged as **guessed**

A guessed classification is surfaced in `status` and widens the reported range. If you see it on a model you care about, that's an invitation to [open an issue](https://github.com/carbon-md/carbon-md/issues) — every new mapping improves the shared table.

## What isn't counted (yet)

Honest limitations, stated plainly:

- **Local compute** — CodeCarbon-style tracking of on-device inference is planned, not shipped. Cloud inference dominates most agent footprints.
- **Training amortisation** — no credible per-request allocation exists publicly. Excluded rather than invented.
- **Embodied hardware** and network transfer — out of scope at this precision.
- **Regional routing** — we assume a world-average grid because providers rarely tell you which region served you.

## Contributing to the factors

The factor table is versioned in the open repository. New models, better disclosures, and regional intensities are all welcome as pull requests. Provenance matters more than precision: cite the source of any number you add.

> Building the real, per-workload emission-factor dataset for *agentic* workloads — which does not exist anywhere today — is an explicit goal of this project. See [What's coming](/roadmap/).
