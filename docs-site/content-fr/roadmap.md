> **Traduction FR en cours.** Version anglaise ci-dessous — [EN](/roadmap/).

# What's coming

What is designed but not yet shipped. Anything marked *planned* in these docs appears here. We document a feature when it lands — see [Docs conventions](/docs-conventions/).

## Shipped today

| | |
|---|---|
| spec v0.1 + reference CLI | `init` · `sync claude-code` · **`sync hermes`** · `ingest` · `status` · `contribute` · `wallet` · `export` · `factors` |
| capture | Claude Code, Hermes, usage-report JSONL, OTLP/OpenTelemetry |
| retirement rail | x402 / Klima on Base, prepaid agent wallet |
| proof | public ledger page, badge, `ledger.json` |

## Carbon Passport + attestation API

The `ledger.json` you already produce, **signed** and anchored to on-chain retirement receipts — so a third party can verify it programmatically instead of trusting a badge image.

- **`carbon-md passport`** — signs a canonical credential (Ed25519, `did:key` locally) including retirement anchors: transaction hash, registry serial, vintage, certificate URL.
- **`carbon-md verify <url>`** — re-derives the trust level from evidence. Works offline for signature and ledger checks.
- **Trust ladder** — L0 declared → L1 measured → L2 contribution-verified → **L3 certified**. L0–L2 are free and machine-verifiable forever.
- **Live badge** — re-verifies on request, so it can't drift from reality.

Why it matters: it turns "trust the badge" into "check the receipt", and it's the first layer someone can reasonably pay for (L3 certification), while everything below stays free.

## Unified token accounting

Capture adapters don't yet treat `reasoning` and `cache_write` tokens identically — `sync hermes` records them without counting them, which under-reports on reasoning-heavy models. The raw counts are preserved in every ledger event's `meta`, so a future factors version can recompute historical footprints rather than losing them. See [Methodology](/methodology/).

## Python SDK + framework callbacks

A thin `carbon-md` Python package: an EcoLogits wrapper and a LangGraph callback exporting to the same local ledger. CrewAI and AutoGen to follow.

## Local compute (CodeCarbon)

Tracking on-device inference and training. Cloud inference dominates most agent footprints, which is why this is a fast-follow rather than v0.1.

## Organization rollup

`organization_id` is already accepted in the policy file. Rolling several agents' ledgers into one organizational view — and a CSRD-oriented export of AI emissions — is the enterprise direction.

## The factor dataset

Real per-workload, per-model emission factors for *agentic* workloads don't exist publicly. Accumulating them — with provenance, versioning, and external review — is a long-term goal of the project and the reason ranges are published rather than hidden.

---

Want to influence what lands next? [Open an issue](https://github.com/carbon-md/carbon-md/issues) — especially with a real workload we should be able to measure and can't.
