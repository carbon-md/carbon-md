> **Traduction FR en cours.** Version anglaise ci-dessous — [EN](/guides/claims/).

# Claims & compliance

What you may say about a carbon.md ledger — and what you must not. This is a design constraint of the standard, not a legal disclaimer bolted on afterwards.

> **Not legal advice.** If you make environmental claims commercially in the EU, get them reviewed.

## The rule

**Never claim neutrality.** Say what actually happened:

| ✅ Say | ❌ Never say |
|---|---|
| "measures its agents' emissions and contributes 110% via verified carbon removal" | "carbon neutral" |
| "matched by verified carbon credits" | "climate positive" |
| "estimated emissions, with uncertainty ranges" | "offsets your emissions" |
| "funded the removal of X tCO₂e" | "zero-emission AI" |

## Why

**Legally** — the EU's Empowering Consumers for the Green Transition directive (ECGT) bans environmental claims on consumer-facing products that rely on offsetting, applying from **27 September 2026**. "Carbon neutral thanks to offsets" becomes prohibited, not merely frowned upon.

**Substantively** — matching emissions with a removal purchase is a *contribution*. The CO₂ was still emitted. Removal takes time and carries its own uncertainty. Calling that "neutral" overstates what happened, and the whole value of this project rests on not overstating.

## What the tooling does for you

carbon.md is built so the honest phrasing is the default and the dishonest one is hard to produce:

- Generated pages and badges use contribution language only.
- Every figure ships with a **low–central–high range** — no false precision.
- Pages state **"estimated, not measured"** and name the methodology version.
- Receipts link to registry serials and, on the on-chain rail, to a transaction.
- Nothing in the spec lets you declare an outcome you can't evidence.

## Writing your own copy

A safe template:

> *`<project>` measures the inference emissions of its AI agents using `<methodology version>` (estimates with uncertainty ranges) and contributes `<X>`% of them via verified carbon removal. Ledger and retirement receipts: `<link>`.*

Keep it specific: name the methodology, show the ranges, link the receipts.

## For enterprise reporting

Ledger data supports scope-3 style reporting for AI workloads, but describe it accurately: **estimated** emissions from a **versioned open methodology**, with contributions recorded separately from the emissions themselves. Contributions never subtract from your reported emissions — they are disclosed alongside them. Deeper CSRD-oriented export is [planned](/roadmap/).

## Related

- [Concepts — contribution, not neutrality](/concepts/)
- [Methodology & factors](/methodology/) — the uncertainty you must communicate
