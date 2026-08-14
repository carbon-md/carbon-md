> **Traduction FR en cours.** Version anglaise ci-dessous — [EN](/cli/contribute/).

# carbon-md contribute

Prepares — and, within policy, executes — the contribution that matches your footprint.

```bash
npx carbon-md contribute [options]
```

> **Retirements are irreversible.** Everything here is designed around that fact: confirm-first by default, hard caps from the policy file, and a prepaid wallet whose balance is the blast radius.

## Default behaviour (confirm-first)

Run without arguments and nothing is spent. `contribute` computes what you owe, prices it, and prints an order for you to approve:

```
Contribution order — my-project

  Outstanding      0.0050 tCO2e   (110% of 4.5 kg estimated)
  Portfolio        removal-weighted
  Estimated cost   ~$1.10 USD

  Policy check     ✔ below approval_above ($10)
                   ✔ within monthly_budget_max ($25, $0 used)

  Execute:  npx carbon-md contribute --auto
  Or record a manual purchase:
            npx carbon-md contribute --record --tonnes 0.005 --cost 1.10 \
              --rail carbonmark --receipt https://…
```

## Options

| Flag | Meaning |
|---|---|
| `--auto` | Execute autonomously via the on-chain rail, if policy and wallet allow |
| `--record` | Record a purchase you made elsewhere (fiat, Carbonmark, CNaught…) |
| `--tonnes <n>` | With `--record`: tonnes retired |
| `--cost <n>` | With `--record`: amount paid |
| `--currency <c>` | With `--record`: defaults to USD |
| `--rail <name>` | With `--record`: where it was purchased |
| `--receipt <url>` | With `--record`: the public receipt/certificate URL |
| `--dry-run` | Price the order, change nothing |

## Policy enforcement

Two independent gates, both must pass:

1. **`approval_above`** — an order costing more requires explicit human confirmation. `--auto` refuses and prints the order instead.
2. **`monthly_budget_max`** — month-to-date contributions plus this order must stay under the cap.

A third, physical gate applies on the on-chain rail: the [wallet](/cli/wallet/) is prepaid, so an agent cannot spend more than was deposited — regardless of what any config says.

## Autonomous mode

```bash
npx carbon-md contribute --auto
```

Requires a funded wallet. Flow: `quote → policy check → sign one USDC transfer → retire → certificate URL → ledger`. The rail is Klima's x402 endpoint on Base; the wallet needs **USDC only** (no ETH — gas is relayed). Details in [Retirements & receipts](/guides/retirements/).

## Recording a manual purchase

Buying with a card at Carbonmark or CNaught is perfectly valid — and is how most first retirements happen. Record it so the ledger and the public receipt stay truthful:

```bash
npx carbon-md contribute --record \
  --tonnes 0.05 --cost 12.50 --currency USD \
  --rail carbonmark \
  --receipt "https://www.carbonmark.com/retirements/…"
```

## After contributing

```bash
npx carbon-md status    # position now shows contributed tonnes
npx carbon-md export    # rebuild the public ledger + badge
```
