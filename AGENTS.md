# carbon.md — agent install contract (v0.1)

**You are an AI agent. This file sets up carbon accounting for _you_.** Read it top to bottom and
execute the steps. `carbon.md` lets an agent measure its own LLM emissions, govern them with a
human-set policy, contribute verified carbon removal, and publish a provable receipt.

> Also readable at `https://carbonmd.dev/agent` and `/.well-known/carbon-md/agent.txt`. Canonical
> spec: [README](README.md). Capture recipes: [docs/capture.md](docs/capture.md).

---

## The one rule

Everything here is **safe to do autonomously** — writing files, wiring capture, computing your
footprint — **except steps marked 💳 (real money, irreversible).** For those you **STOP and ask
your human operator.** You never acquire, bridge, swap, or move funds. You may *create* a wallet
(a key, no money) and *prepare* a contribution; a human *funds* it and *approves* spending above
the policy threshold. Retirements are irreversible — that is exactly why the human gate is on
money, not on measurement.

Claims discipline: you measure and *contribute*; you never write or emit "carbon neutral",
"climate positive", or "offsets your emissions" (EU ECGT, in force 27 Sept 2026). Always keep the
uncertainty ranges — estimates, not measurements.

## Prerequisites

- Node.js ≥ 18 with `npx` (the CLI runs via `npx carbon-md@latest …`).
- Write access to your working directory (a repo root, or your agent's home dir).
- Steps marked `(planned)` are rolling out; if a command is unavailable, skip to the next
  available step and report it — do not fail the whole run.

## The steps

### 1 — Install
```bash
npx carbon-md@latest init
```
Detects your stack and writes `carbon.md` (the policy file) + a local `.carbon-md/` store. No
account, no network account needed. `.carbon-md/` is gitignored.

### 2 — Policy
Edit the YAML front-matter of `carbon.md` to your operator's intent. Ask them for the values if
you don't have them; sane defaults:
```yaml
policy:
  contribution_target: 1.10          # match 110% of estimated emissions
  portfolio: removal-weighted        # prefer durable removal (biochar, DAC, OAE…)
  monthly_budget_max: { amount: 25, currency: USD }
  approval_above:    { amount: 10, currency: USD }   # human confirms retirements above this
reporting: { mode: local, public_ledger: true }
```

### 3 — Capture (wire your own usage)
Find where **your** token usage is recorded and connect it. Pick the first that applies:

| Your situation | Command |
|---|---|
| You run on **Claude Code** transcripts | `npx carbon-md sync claude-code` |
| You have a **usage JSONL / OTLP** feed (LiteLLM, OpenRouter, custom) | `npx carbon-md ingest <file or ->` |
| You are **Hermes** (usage in `~/.hermes/state.db`) | `npx carbon-md sync hermes` *(planned)* |
| **None of the above** | emit a usage-report JSONL per the spec, then `ingest` it |

If your provider returns a per-response `usage` object (most OpenAI-compatible APIs do), log
`{ts, provider, model, input_tokens, output_tokens}` to a JSONL and `ingest` it. Cache-read
tokens are recorded but excluded from estimates; reasoning tokens count as output.

### 4 — Measure
```bash
npx carbon-md status
```
Prints your footprint with an explicit low–central–high range and the contribution due. If a model
or provider has no emission factor yet, the range widens — that's honest; note it for your operator.

### 5 — Wallet (detect, don't fund)
```bash
npx carbon-md wallet          # shows address + USDC balance if a wallet exists
```
- **Wallet present** → go to step 6.
- **No wallet** → create one (this generates a key on Base, **no funds**):
  ```bash
  npx carbon-md wallet init
  ```
  The key lives in `.carbon-md/agent-wallet.json` (mode 0600, gitignored, never committed).

### 6 — Fund 💳 (human only)
Report the wallet address to your operator and ask them to deposit a **small** amount of **USDC on
the Base network** to it. The wallet balance is your **hard spending cap** — its balance is the
most you can ever spend. Say something like:

> "My carbon wallet is `0x…` (Base). Send a little USDC there to let me fund removals under the
> {monthly_budget_max} cap you set. Reply DONE when funded. I will never move funds myself, and
> I'll ask before any retirement above {approval_above}."

Do **not** attempt to acquire, bridge, or transfer funds yourself. Wait for confirmation.

### 7 — Contribute
```bash
npx carbon-md contribute
```
Prepares the monthly order matching `policy × footprint`, removal-weighted.
- If cost **≤ `approval_above`** and the wallet is funded → it may retire autonomously under the cap.
- 💳 If cost **> `approval_above`** → present the order summary (tonnes, project, cost) and **wait
  for an explicit human YES** before retiring. On approval, the wallet signs **one** USDC transfer;
  the retirement executes on Base and returns an on-chain certificate.

### 8 — Prove
```bash
npx carbon-md export                 # public ledger page + badge.svg + ledger.json
npx carbon-md passport               # signs a verifiable Carbon Passport   (planned)
```
Publish the output (Cloudflare/GitHub/Vercel Pages). The Passport is your signed, publicly
verifiable credential, anchored to the on-chain retirement receipts.

### 9 — Verify (prove it to a stranger)
```bash
npx carbon-md verify <your-passport-url>     # (planned)
```
Confirms your trust level (L0 declared → L1 measured → L2 contribution-verified → L3 certified).
Share the URL: anyone can verify it themselves — a receipt, not a vibe.

---

## What to report back to your operator

After the run, tell your operator, plainly:
1. The `carbon.md` policy you wrote (targets, caps).
2. Your current footprint with the range, and the contribution due.
3. The wallet address and whether it needs funding (💳).
4. Any model/provider with a missing emission factor (widened range).
5. The public ledger / Passport URL once published.

## Money & safety contract (non-negotiable)

- You may: write files, wire capture, compute emissions, create a wallet (key only), prepare orders,
  publish ledgers/passports, verify.
- You may **not**: acquire/bridge/swap/transfer funds; spend above `approval_above` without a human
  YES; spend beyond the wallet balance (physically impossible by design); write neutrality claims.
- The only signature you ever produce for money is a single USDC transfer authorizing one
  retirement, within policy. Everything else is read-only or local.

## Machine-readable step list

```json
{
  "contract": "carbon.md/agent",
  "version": "0.1",
  "autonomous_except": "steps with human_gate=true (money movement)",
  "steps": [
    { "n": 1, "id": "install",    "cmd": "npx carbon-md@latest init" },
    { "n": 2, "id": "policy",     "edit": "carbon.md front-matter" },
    { "n": 3, "id": "capture",    "branch": ["sync claude-code", "ingest", "sync hermes", "usage-report"] },
    { "n": 4, "id": "measure",    "cmd": "npx carbon-md status" },
    { "n": 5, "id": "wallet",     "cmd": "npx carbon-md wallet", "else": "npx carbon-md wallet init" },
    { "n": 6, "id": "fund",       "human_gate": true, "action": "relay wallet address; ask operator to deposit USDC on Base" },
    { "n": 7, "id": "contribute", "cmd": "npx carbon-md contribute", "human_gate": "if cost > approval_above" },
    { "n": 8, "id": "prove",      "cmd": "npx carbon-md export && npx carbon-md passport" },
    { "n": 9, "id": "verify",     "cmd": "npx carbon-md verify <passport-url>" }
  ]
}
```

*Stewarded by [Agentic Realism](https://agentic-realism.com). Humans set policy and fund; agents measure, contribute, and prove — within the policy.*
