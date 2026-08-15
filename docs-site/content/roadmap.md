# What's coming

What is designed but not yet shipped. Anything marked *planned* in these docs appears here. We document a feature when it lands — see [Docs conventions](/docs-conventions/).

## Shipped today

| | |
|---|---|
| spec v0.1 + reference CLI | `init` · `sync claude-code` · **`sync hermes`** · `ingest` · `status` · `contribute` · `wallet` · `export` · `factors` |
| capture | Claude Code, Hermes, usage-report JSONL, OTLP/OpenTelemetry |
| retirement rail | x402 / Klima on Base, prepaid agent wallet |
| proof | public ledger page, badge, `ledger.json`, signed passport + public page |
| verification | `verify` locally, or the hosted [attestation API](/api/) — same checks either way |
| certification | signed, revocable [registry](/certification/) + `registry` command · L0–L2 free, L3 reviewed |

## Carbon Passport + attestation API

**Shipped (L0–L2):** [`carbon-md passport`](/cli/passport/) signs the ledger summary as a verifiable credential (Ed25519, `did:key`, canonicalized) with retirement **anchors**; [`carbon-md verify`](/cli/verify/) re-derives the trust level from evidence — checking the signature, the uncertainty ranges, on-chain transactions on Base, and whether counted anchors really are removal. Works offline for everything except the chain lookup, and exits non-zero as a CI gate.

The **hosted attestation API** shipped too: [`/v1/verify` and `/v1/badge`](/api/) on `docs.carbonmd.dev` re-run those same checks at the edge, so a passport can be checked without installing anything. A parity test keeps the two implementations from drifting apart.

The **signed certification registry** and **L3** shipped with 0.1.10: the registry is served at [`/.well-known/carbon-md/registry.json`](/certification/), `verify` and `/v1/verify` consult it, and `carbon-md registry` maintains it. It certifies nobody yet — the machinery exists, the first review has not happened.

**Still to come:** the public application flow for certification, and the hosted compliance tier the Enterprise price ties to.


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
