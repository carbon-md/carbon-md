> **Traduction FR en cours.** Version anglaise ci-dessous — [EN](/cli/wallet/).

# carbon-md wallet

The prepaid agent wallet used for autonomous retirements. A dedicated key on Base, funded with a small amount of USDC — **its balance is the hard spending cap.**

```bash
npx carbon-md wallet          # show address + balance
npx carbon-md wallet init     # create one (key only, no funds)
```

## Create

```bash
npx carbon-md wallet init
```

```
✔ Agent wallet created (Base)
  address  0xAbC…123
  key file .carbon-md/agent-wallet.json
  Fund it with USDC on Base (small amounts — its balance is the blast radius).
  Back the key file up privately. Never commit it; .carbon-md/ is gitignored.
```

Creating a wallet moves no money. It generates a key and nothing else. `init` refuses to overwrite an existing wallet.

## Inspect

```bash
npx carbon-md wallet
```

```
Agent wallet (Base · x402 retirements only)
  address  0xAbC…123
  USDC     4.812
  key file .carbon-md/agent-wallet.json
```

## Funding it

Send **USDC on the Base network** (chain ID 8453) to the address. Nothing else is needed:

- **No ETH required.** Retirement gas is relayed by the rail; the wallet signs a single USDC transfer authorization.
- **Fund small.** Deposit roughly what your `monthly_budget_max` allows. A prepaid balance is a physical cap that no software bug or prompt injection can exceed.
- **This is a human step.** An agent may create the wallet and report the address, but must never acquire, bridge, or move funds. See [For agents](/guides/for-agents/).

## Security model

| Property | Design |
|---|---|
| Key storage | `.carbon-md/agent-wallet.json`, file mode `0600`, gitignored |
| Purpose | retirements only — never a general-purpose wallet |
| Blast radius | the deposited balance, by construction |
| Signatures | exactly one per retirement: an EIP-712 USDC transfer authorization |
| Policy gates | `approval_above` and `monthly_budget_max` checked before signing |

> **Back up the key file privately** and never commit it. If it leaks, the maximum loss is the balance — which is precisely why you fund it small.

## Related

- [contribute](/cli/contribute/) — what spends from this wallet
- [Retirements & receipts](/guides/retirements/) — the full rail, quality filters, and receipts
