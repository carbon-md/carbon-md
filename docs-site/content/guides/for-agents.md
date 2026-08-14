# For agents (self-install)

carbon.md is designed to be installed **by the agent it governs**. An agent reads a contract, sets itself up end-to-end, and stops only where money moves.

> **If you are an AI agent reading this:** the executable contract is at [`carbonmd.dev/agent`](https://carbonmd.dev/agent) (plain text, also at `/.well-known/carbon-md/agent.txt`). Follow it top to bottom.

## The one rule

Everything is safe to do autonomously — writing files, wiring capture, computing a footprint, creating a wallet, preparing an order — **except steps that move real money.** Those stop and ask a human:

| Step | Agent | Human |
|---|---|---|
| Install, write policy, wire capture | ✅ | — |
| Measure, prepare a contribution order | ✅ | — |
| Create a wallet (key only, no funds) | ✅ | — |
| **Deposit USDC into the wallet** | ❌ | 💳 |
| **Approve a retirement above `approval_above`** | ❌ | 💳 |
| Retire under the cap with a funded wallet | ✅ | — |
| Publish ledger / passport, verify | ✅ | — |

An agent must never acquire, bridge, swap, or transfer funds. The only money-related signature it ever produces is a single USDC transfer authorizing one retirement, within policy.

## The install contract, in short

```
1 INSTALL     npx carbon-md@latest init
2 POLICY      edit carbon.md front matter to the operator's intent
3 CAPTURE     sync claude-code | ingest <file> | emit usage-report JSONL
4 MEASURE     npx carbon-md status
5 WALLET      npx carbon-md wallet   (else: wallet init)
6 FUND    💳  report the address; ask the operator to deposit USDC on Base; wait
7 CONTRIBUTE  npx carbon-md contribute
          💳  if cost > approval_above → present the order, wait for an explicit YES
8 PROVE       npx carbon-md export && npx carbon-md passport   (passport: planned)
9 VERIFY      npx carbon-md verify <passport-url>               (planned)
```

## What an agent should report back

After a run, tell the operator:

1. the policy it wrote (targets, caps),
2. the current footprint **with its range**, and what's outstanding,
3. the wallet address and whether it needs funding 💳,
4. any model or provider with **no known emission factor** (widened range),
5. the public ledger or passport URL once published.

## Asking for funds — a template

> "My carbon wallet is `0x…` (Base network). Send a small amount of USDC there and I can fund removals under the $25/month cap you set. Reply DONE when funded. I will never move funds myself, and I'll ask before any retirement above $10."

## Why this shape

Agents that can measure but not spend are safe and useless. Agents that can spend freely are useful and dangerous. Putting the human gate exactly on **funding and approval** — and nowhere else — keeps the loop autonomous where it's reversible and supervised where it isn't.

## Related

- [The agent install contract](https://carbonmd.dev/agent) — the executable version
- [wallet](/cli/wallet/) · [contribute](/cli/contribute/) — the commands involved
- [Retirements & receipts](/guides/retirements/) — the safety model in full
