# Attestation API

A hosted verifier for Carbon Passports, and a badge that re-checks itself on every request.

Base URL: **`https://docs.carbonmd.dev`** · read-only · no authentication · CORS-open.

> **The API is a convenience, never the authority.** A passport is verified from the document itself, so [`carbon-md verify`](/cli/verify/) on your own machine reaches the same verdict with no server involved. A parity test in the repository asserts that the two implementations agree — canonicalization, signatures, and every rung of the ladder.

## `GET /v1/verify`

Fetches a passport and verifies it.

```bash
curl "https://docs.carbonmd.dev/v1/verify?url=https://your-ledger/passport.json"
```

| Parameter | Meaning |
|---|---|
| `url` | **required** — where the passport JSON lives |
| `offline=1` | skip the on-chain anchor check (result then caps at L1) |

## `POST /v1/verify`

Verify a document you hold, without publishing it first.

```bash
curl -X POST https://docs.carbonmd.dev/v1/verify \
  -H "content-type: application/json" \
  --data @public/passport.json
```

## Response

```jsonc
{
  "subject": "did:key:z6Mko2Bjf9Tn…",
  "subject_name": "hermes",
  "verdict": "verified",          // verified | invalid | stale
  "trust_level": "L2",            // re-derived from evidence
  "claimed_trust_level": "L2",    // what the document asserted
  "signature_valid": true,
  "policy_target_met": true,
  "removal_ok": true,
  "anchors": 1,
  "anchors_resolved": "resolved", // resolved | none | offline
  "certification": {              // see /certification/
    "status": "none"              // active | none | revoked | expired | unchecked
  },
  "methodology": "carbonmd-factors-2026-08",
  "warnings": [],
  "verified_at": "2026-08-15T10:00:00Z"
}
```

`trust_level` is what the evidence supports; `claimed_trust_level` is what the document said. When they differ, believe the first — that gap is the whole point of publishing a verifier.

| Status | When |
|---|---|
| `200` | the document was checked (a verdict of `invalid` is still a `200` — the check succeeded, the passport didn't) |
| `400` | missing/invalid `url`, or unfetchable passport |
| `422` | the payload isn't a carbon.md passport |
| `405` | wrong method |

Responses are cached for 5 minutes: a verdict can change when anchors settle or a passport expires.

## `GET /v1/badge`

A badge that **re-verifies on every request**, so a tampered or lapsed passport flips its own badge. A static image can drift from reality; this cannot.

```markdown
![carbon.md](https://docs.carbonmd.dev/v1/badge?url=https://your-ledger/passport.json)
```

| Parameter | Meaning |
|---|---|
| `url` | **required** — the passport JSON |
| `label` | left-hand text (default `carbon.md`) |

| State | Reads | Colour |
|---|---|---|
| Contribution verified | `L2 verified` | moss |
| Measured only | `L1 verified` | muted green |
| Declared / no evidence | `L0 verified` | amber |
| Signature failed | `unverified` | red |
| Expired | `L1 stale` | amber |
| Certified | `L3 certified` | deep moss |
| Certification revoked | `L2 revoked` | red |
| Unreachable | `unreachable` | grey |

Link it to your passport page so the badge is a door, not a decoration:

```markdown
[![carbon.md](https://docs.carbonmd.dev/v1/badge?url=…/passport.json)](https://your-ledger/passport.html)
```

## A live example

A real signed passport is published as a fixture, so every example on this page is runnable:

```bash
curl "https://docs.carbonmd.dev/v1/verify?url=https://docs.carbonmd.dev/examples/passport.json"
```

![example](https://docs.carbonmd.dev/v1/badge?url=https://docs.carbonmd.dev/examples/passport.json)

It is an **example**: synthetic usage, a throwaway key, no retirements — so it verifies at **L1**, never L2. It also expires, like any passport. When it does, the badge above will say `stale` rather than quietly keep claiming otherwise; that is the behaviour worth seeing.

## What is checked

Identical to the CLI:

1. **Signature** — Ed25519 over the canonicalized document (Web Crypto at the edge, `node:crypto` locally).
2. **Freshness** — passports expire after 90 days.
3. **Measurement** — usage present, ranges well-formed, methodology pinned.
4. **Anchors** — each transaction is fetched from Base; it must exist and not have reverted.
5. **Policy** — credited tonnes ≥ target, and under a removal policy every counted anchor must actually be removal.
6. **Certification** — the subject is looked up in the [signed registry](/certification/); only an active entry reaches L3.

Every certification failure — unreachable, unsigned, wrong issuer, expired, tampered — resolves to `unchecked` and caps the result at L2. A registry we could not read never reads as "not certified", and never grants a level.

## The registry

The signed certification registry is served from the same origin and is what `/v1/verify` consults for L3:

```bash
curl https://docs.carbonmd.dev/.well-known/carbon-md/registry.json
```

It currently certifies nobody. A document claiming L3 is therefore reported at the level its evidence supports — see [Certification & the registry](/certification/).

## Related

- [verify](/cli/verify/) — the same checks, locally
- [passport](/cli/passport/) — issue one
