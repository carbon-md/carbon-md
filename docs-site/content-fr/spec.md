> **Traduction FR en cours.** Version anglaise ci-dessous — [EN](/spec/).

# The carbon.md file

Spec **v0.1 (draft)**. The file lives at your repository root. It is Markdown with a YAML front-matter policy block — readable by humans, parseable by tools, and ingestible by the agents it governs.

## Minimal example

```markdown
---
carbon_md: "0.1"
policy:
  contribution_target: 1.10
  portfolio: removal-weighted
  monthly_budget_max: { amount: 25, currency: USD }
  approval_above: { amount: 10, currency: USD }
reporting:
  mode: local
  public_ledger: true
methodology: carbonmd-factors-2026-08
---

# Carbon Policy — my-project

This project's agents measure their inference emissions and fund
verified carbon removal per the policy above. Ledger: <link>
```

Everything below the front matter is free-form Markdown for humans (and for agents reading the repo). Everything inside it is the machine contract.

## Field reference

### `carbon_md`

Spec version string. Currently `"0.1"`. Tools refuse files whose major version they don't understand rather than guessing.

### `policy.contribution_target`

Number. The fraction of estimated emissions to match. `1.0` matches 100%; `1.10` matches 110%.

The generated copy never calls this "neutral" or "positive" — it is a contribution ratio. See [Claims & compliance](/guides/claims/).

### `policy.portfolio`

Which credits to buy.

| Value | Meaning | Indicative price (USD/tCO₂e) |
|---|---|---|
| `removal-weighted` | **default** — durable removal (biochar, DAC, OAE) | 35 – 60 – 120 |
| `balanced` | mixed removal/avoidance | 15 – 28 – 45 |
| `custom` | you choose the projects; no price assumption | — |

Prices are assumptions used to estimate what you owe, not quotes. The real price comes from the rail at purchase time.

### `policy.monthly_budget_max`

`{ amount, currency }`. A hard ceiling on contributions per calendar month. The CLI refuses an order that would push month-to-date spending past it.

### `policy.approval_above`

`{ amount, currency }`. The human-in-the-loop threshold. Orders costing more than this require explicit confirmation; below it, an agent with a funded wallet may settle autonomously.

> **Two caps, on purpose.** `monthly_budget_max` is a *policy* cap the tooling enforces. The prepaid wallet balance is a *physical* cap nothing can exceed. See [Retirements & receipts](/guides/retirements/).

### `reporting.mode`

`local` (default) or `hosted`. Local means the ledger never leaves your machine; `export` still produces a publishable static site.

### `reporting.public_ledger`

Boolean. Whether you intend to publish. `export` warns if you publish while this is `false`.

### `methodology`

The pinned factor-table version, e.g. `carbonmd-factors-2026-08`. Estimates are only comparable within a methodology version. See [Methodology & factors](/methodology/).

## Optional fields

### `organization_id`

An opaque organization identifier (WorkOS-compatible) used to roll several agents' ledgers up to one org. Enterprise/CSRD rollup builds on this. Currently accepted and carried through; hosted rollup is [planned](/roadmap/).

## Design rules

The spec is deliberately small. When considering an addition, we ask:

- **Agent-readable?** Agents already ingest repo Markdown; the file must stay parseable without a schema fetch.
- **Human-auditable?** Someone must be able to read the file and know exactly what their agents may do.
- **Honest by construction?** No field should make it easy to state something unprovable.
- **Local-first?** Nothing may require an account to function.

## The ledger

Alongside the policy file, `.carbon-md/` holds the append-only ledger at `.carbon-md/ledger.jsonl` — one JSON object per line, two event types:

```jsonc
// usage
{ "type":"usage", "ts":"2026-08-01T09:12:00Z", "source":"claude-code",
  "provider":"anthropic", "model":"claude-sonnet-4", "tokens_in":18400,
  "tokens_out":2100, "gco2e":{"low":1.2,"central":3.6,"high":12.1},
  "model_class":"large", "factors":"carbonmd-factors-2026-08",
  "meta":{"cache_read_tokens":91000} }

// contribution
{ "type":"contribution", "ts":"2026-08-01T10:00:00Z", "tonnes":0.005,
  "cost":1.10, "currency":"USD", "rail":"x402:klima",
  "receipt":"https://…/certificate" }
```

Append-only and plain text on purpose: it is inspectable with `cat`, diffable in git if you choose to commit it, and impossible to silently rewrite through the tool.

## Related

- [Usage report format](/usage-report/) — how to push usage in from any agent.
- [CLI reference](/cli/) — the commands that read and write this file.
