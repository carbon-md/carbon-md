# carbon.md documentation

**An open standard for carbon-governed AI agents.** A `carbon.md` file in your repository declares your agents' carbon policy: how their emissions are estimated, how much is compensated through verified carbon-removal contributions, what they may spend, and where the proof lives.

Humans set the policy. Agents execute within it. Everything is provable.

```bash
npx carbon-md init
```

> **New here?** Go to the [Quickstart](/quickstart/) — five minutes from install to your first footprint. Then read [Concepts](/concepts/) to understand the loop.

## What this is

AI agents run thousands of LLM calls a day. Their operators have three bad options: ignore the footprint, buy into heavyweight enterprise carbon suites, or make offset claims that are illegal in the EU from September 2026. `carbon.md` is the fourth option — a small, honest, verifiable primitive:

1. **Measure** — token usage is captured at chokepoints (Claude Code, LiteLLM, OpenTelemetry, any usage log) and converted to CO₂e estimates *with explicit uncertainty ranges*.
2. **Govern** — a human-authored policy file sets contribution targets, budget caps, and approval thresholds that agents must respect.
3. **Contribute** — emissions are matched by verified carbon-removal purchases (monthly, confirm-first by default — agents never spend unattended above your threshold).
4. **Prove** — every retirement gets a public receipt; the badge links to a ledger, not to a vibe.

## What it is not

- **Not a dashboard company.** The standard and the CLI are free and MIT-licensed, local-first, and work with no account.
- **Not a neutrality claim.** carbon.md never says "carbon neutral" or "climate positive". It says: *this agent measured X, and contributed Y% via verified removal — here is the receipt.* See [Claims & compliance](/guides/claims/).
- **Not false precision.** Cloud inference is a black box. Every number ships with a low–central–high range, and the [methodology](/methodology/) is versioned in the open.

## Where to go next

| If you want to… | Read |
|---|---|
| Get running in five minutes | [Quickstart](/quickstart/) |
| Understand the model | [Concepts](/concepts/) |
| Write or read a policy file | [The carbon.md file](/spec/) |
| Feed usage from your stack | [Capture recipes](/guides/capture/) |
| Look up a command | [CLI reference](/cli/) |
| Fund and prove a retirement | [Retirements & receipts](/guides/retirements/) |
| Let an agent install this itself | [For agents](/guides/for-agents/) |
| Know what's shipping next | [What's coming](/roadmap/) |

## Status

The spec is **v0.1 (draft)** and the reference CLI is published on npm as [`carbon-md`](https://www.npmjs.com/package/carbon-md). Things labelled *planned* in these docs are designed but not yet shipped — we document a feature when it lands, and the docs are versioned with the code. See [Docs conventions](/docs-conventions/).
