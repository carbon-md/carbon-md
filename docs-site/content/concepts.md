# Concepts

The model behind carbon.md, and why each piece is shaped the way it is.

## The loop

```
measure  →  govern  →  contribute  →  prove
   ↑                                     │
   └─────────────  the ledger  ──────────┘
```

**Measure.** Agents emit through inference. You cannot govern what you do not count, so capture happens at chokepoints — one integration per provider boundary, not per application.

**Govern.** A Markdown file at the repo root holds the policy: what fraction of emissions to match, which portfolio, how much may be spent per month, and above what amount a human must confirm. The file is the interface — readable by people, parseable by tools, and ingestible by the agents it governs.

**Contribute.** Emissions are matched by purchasing and retiring verified carbon credits. Monthly and aggregated, never per-call micro-transactions.

**Prove.** Every retirement produces a receipt. The ledger page and badge link to registry serials and, on the on-chain rail, to a transaction anyone can verify.

## The file is the interface

Think `AGENTS.md`, but for your agents' environmental footprint — inspired by [auth.md](https://workos.com/auth-md)'s "a Markdown file is the interface" approach.

This matters more than it looks. Agents already read repository Markdown. A policy expressed as a file means an agent can *discover* its own constraints, act within them, and explain them — without an SDK call, a dashboard login, or a human in the loop for every decision.

## Estimates, not measurements

Cloud inference providers do not publish per-request energy use. Anyone claiming a single precise gram figure is guessing with confidence. carbon.md instead:

- stores and displays a **low / central / high** range everywhere,
- pins a **versioned methodology** (`carbonmd-factors-2026-08`) so numbers are comparable within a version,
- widens the range when a model has no published factor, and marks the estimate as guessed,
- **excludes cache-read tokens** from estimates (serving from prompt cache is far cheaper than a fresh forward pass) while still recording them.

See [Methodology & factors](/methodology/).

## Contribution, not neutrality

carbon.md deliberately never generates the words "carbon neutral" or "climate positive". Two reasons:

1. **Legal.** The EU ECGT directive bans offset-based neutrality claims on consumer-facing products from 27 September 2026.
2. **Honest.** Matching emissions with removal purchases is a *contribution*; it does not un-emit the CO₂.

The generated copy says: *this project measures its agents' emissions and matches them X% with verified carbon credits.* See [Claims & compliance](/guides/claims/).

## Removal-weighted by default

The default portfolio favours **durable removal** (biochar, DAC, ocean alkalinity) over cheap avoidance credits. Removal costs more per tonne and is the harder thing to buy — which is exactly why it is the default. Avoidance-heavy on-chain pools are easy to buy and hard to defend.

## Humans fund, agents execute

The one thing an agent must never do alone is move money. carbon.md enforces this twice:

- **Policy (soft cap)** — the CLI refuses to spend above `approval_above`, or beyond `monthly_budget_max` month-to-date.
- **Funding (hard cap)** — the agent wallet is prepaid. Its balance *is* the blast radius. An agent physically cannot spend what was never deposited.

Retirements are irreversible. That asymmetry is why the human gate sits on funding and approval, not on measurement.

## Local-first

Everything works with no account: the ledger is a JSONL file in `.carbon-md/`, the policy is a file in your repo, and `export` produces static HTML you can host anywhere. Hosted services are optional conveniences, never a dependency for the standard.

## The trust ladder

Verification is not binary. The [Carbon Passport](/cli/passport/) assigns a level that any third party can re-derive:

| Level | Means | Verified by |
|---|---|---|
| **L0** Declared | a policy file exists | anyone, automatically |
| **L1** Measured | real usage recorded, ranges shown | automatically |
| **L2** Contribution-verified | retirements match policy, on-chain resolvable | automatically |
| **L3** Certified *(planned)* | methodology + claims audited | carbon.md (paid) |

L0–L2 have shipped and stay free and machine-verifiable forever — locally with [`verify`](/cli/verify/), or through the hosted [attestation API](/api/). See [What's coming](/roadmap/).
