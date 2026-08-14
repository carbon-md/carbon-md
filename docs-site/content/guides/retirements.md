# Retirements & receipts

How emissions become funded, retired carbon removal — and how anyone can check that it happened.

> **Retirement is irreversible.** A retired credit is permanently removed from circulation, in your name. Every safety property in carbon.md follows from that.

## Two rails

| | **On-chain (x402 / Klima, Base)** | **Fiat (Carbonmark, CNaught…)** |
|---|---|---|
| Autonomy | full — an agent can settle under a cap | human buys, agent records |
| Speed | seconds | minutes to days |
| Receipt | on-chain tx + certificate URL | dashboard certificate |
| Credit quality | **filter by methodology** — on-chain pools skew to old-vintage avoidance | curated, removal-grade |
| Setup | prepaid USDC wallet | a card and an account |

Most first retirements are fiat. That's fine and honest — record it with `contribute --record` and the ledger stays truthful.

## The on-chain rail

carbon.md's reference rail is Klima's **x402** endpoint on Base (chain 8453).

```
discover → quote (methodology-filtered) → prepare-auth → sign → retire → certificate
```

What makes it usable by an agent:

- **One signature.** The wallet signs a single EIP-712 USDC `TransferWithAuthorization`. A Klima executor submits the retirement and covers gas.
- **USDC only.** No ETH, no prior approval, no smart-account setup.
- **Immediate public proof.** You get a transaction hash and a certificate URL.

```bash
npx carbon-md wallet init     # create the key (no funds)
# → fund it with a small USDC amount on Base (human step)
npx carbon-md contribute --auto
```

## Credit quality — the part that matters

On-chain carbon markets make it easy to buy the *wrong* thing: cheap, old-vintage avoidance credits. If your policy says `removal-weighted`, autonomy without a quality filter would quietly betray it.

So: **filter by methodology at quote time**, prefer durable removal (biochar, DAC, ocean alkalinity), and always publish the registry serial and vintage on the receipt. A retirement you can't trace to a registry entry isn't proof.

## How a credit is classified

The rail names what it sells; carbon.md maps that to a **method** and stores it on the contribution:

| Method | Meaning |
|---|---|
| `removal` | the tonne was taken out of the atmosphere (biochar, DAC, ocean alkalinity, forestry removal) |
| `avoidance` | an emission was prevented, not removed |
| `mixed` | a portfolio spanning both |
| `unspecified` | the rail's description doesn't clearly say — **never counted as removal** |

Two rules make this trustworthy:

1. **Avoidance is tested first.** "Avoided deforestation" contains the word *forest* and must not read as a forestry removal. The ambiguous case resolves to the weaker claim, not the stronger one.
2. **Unknown stays unknown.** An unrecognised class is filed `unspecified` rather than guessed into the removal column — because that column carries the project's entire claim.

Under `portfolio: removal-only`, only `removal` discharges the target, and `contribute` refuses non-removal classes before quoting. See [contribute](/cli/contribute/).

## Safety model

Three independent limits, from softest to hardest:

1. **Policy** — `approval_above` blocks unattended spend above your threshold; `monthly_budget_max` caps the month.
2. **Prepaid balance** — the wallet holds only what you deposited. This is physics, not a promise.
3. **Human confirmation** — above the threshold, an explicit yes is required, always.

An agent may create a wallet, prepare an order, and report what it needs. It must never acquire, bridge, or transfer funds. See [For agents](/guides/for-agents/).

## Recording a purchase you made yourself

```bash
npx carbon-md contribute --record \
  --tonnes 0.05 --cost 12.50 --currency USD \
  --rail carbonmark \
  --receipt "https://www.carbonmark.com/retirements/…"
```

Then regenerate the public artifacts:

```bash
npx carbon-md export
```

## What a good receipt shows

- the **tonnage** retired and the **beneficiary** (you or your agent),
- the **project** and its **registry serial**, plus the **vintage** year,
- a **link anyone can open** — an on-chain certificate or a registry page,
- the **methodology version** used to size the purchase.

Anything less is a claim, not a receipt.

## Related

- [contribute](/cli/contribute/) · [wallet](/cli/wallet/) — command reference
- [Claims & compliance](/guides/claims/) — how to describe this without breaking the law
