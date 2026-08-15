# carbon-md passport

Signs a **Carbon Passport** — the ledger summary you already publish, made checkable by a stranger.

```bash
npx carbon-md passport [--out <dir>] [--kind agent|project|fleet] [--url <public-url>]
```

Writes `public/passport.json`, `public/passport.html` and `public/passport-badge.svg` alongside the artifacts from [`export`](/cli/export/).

## What it produces

```
Carbon Passport 0.1
  subject     hermes (agent)
  identity    did:key:z6Mko2Bjf9Tn9yAnwGEHToX4hyk2iJRcuFp2ZQB7KeiBg4kV
  emissions   285.0 gCO2e (93.0 gCO2e – 930.0 gCO2e)
  contributed 0.005 tCO2e · credited 0.005 · target 0.000314
  anchors     1
  expires     2026-11-13

✔ Wrote public/passport.json
  Anyone can check it:  npx carbon-md verify public/passport.json
```

## The document

The signed JSON carries your identity, the period, the pinned methodology, your policy, the emission ranges, and — the part that matters — **anchors**: one per retirement, with the transaction hash, credit class, method and certificate URL.

```jsonc
{
  "carbon_passport": "0.1",
  "subject": { "id": "did:key:z6Mk…", "name": "hermes", "kind": "agent" },
  "methodology": "carbonmd-factors-2026-08",
  "policy": { "contribution_target": 1.1, "portfolio": "removal-only" },
  "estimated_gco2e": { "low": 93, "central": 285, "high": 930, "calls": 2, "tokens": 306000 },
  "contribution": {
    "target_tonnes": 0.000314, "contributed_tonnes": 0.005,
    "credited_tonnes": 0.005, "met": true,
    "anchors": [{ "rail": "x402:klima", "chain_id": 8453, "tx_hash": "0x…",
                  "method": "removal", "tonnes": 0.005, "certificate_url": "https://…" }]
  },
  "trust_level": "L2",
  "expires_at": "2026-11-13T00:00:00Z",
  "proof": { "type": "eddsa-jcs-2022", "verification_method": "did:key:z6Mk…#z6Mk…", "signature": "z…" }
}
```

> **`trust_level` in the document is advisory.** [`verify`](/cli/verify/) re-derives it from the evidence and never trusts the claim — a forged `"L3"` simply fails to be supported.

## Identity

The first run creates an **Ed25519 keypair** and expresses it as a `did:key`. The public key travels inside the DID itself, so anyone holding the passport can check the signature **offline** — no account, no registry lookup, no server.

The key lives in `.carbon-md/passport-key.json` (mode `0600`, gitignored). **Back it up privately**: losing it means re-issuing under a new identity.

## The public page

`passport.html` is a self-contained page (no JS, no external assets) showing the level, the ranges, the contribution position, and every anchor linked to its certificate or transaction — plus a **"Verify this yourself"** box with the exact command. Pass `--url` to write the passport's final public address into it.

The badge (`passport-badge.svg`) states the level the evidence supports **offline** — a freshly issued passport cannot claim on-chain resolution it has not performed. Visitors reach L2 by running `verify` themselves.

## Freshness

Passports expire after **90 days**. This is deliberate — a contribution claim that nobody has re-stated in three months should not keep asserting itself. Re-run the command to re-issue.

## Notes

- Without retirements, a passport is honest but capped at **L1 (measured)** — it says so on generation.
- `credited_tonnes` respects your portfolio: under `removal-only`, avoidance purchases are reported but do not discharge the target. See [The carbon.md file](/spec/).
- The signature covers the whole document minus the proof, canonicalized (sorted keys, no insignificant whitespace) so signer and verifier agree byte-for-byte.

## Related

- [verify](/cli/verify/) — check a passport
- [export](/cli/export/) — the public page and badge it complements
