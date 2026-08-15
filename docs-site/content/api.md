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
| Unreachable | `unreachable` | grey |

Link it to your passport page so the badge is a door, not a decoration:

```markdown
[![carbon.md](https://docs.carbonmd.dev/v1/badge?url=…/passport.json)](https://your-ledger/passport.html)
```

## What is checked

Identical to the CLI:

1. **Signature** — Ed25519 over the canonicalized document (Web Crypto at the edge, `node:crypto` locally).
2. **Freshness** — passports expire after 90 days.
3. **Measurement** — usage present, ranges well-formed, methodology pinned.
4. **Anchors** — each transaction is fetched from Base; it must exist and not have reverted.
5. **Policy** — credited tonnes ≥ target, and under a removal policy every counted anchor must actually be removal.

## Not yet available

The **signed certification registry** (`/.well-known/carbon-md/registry.json`) and therefore **L3** are not shipped. Until they are, a document claiming L3 is reported at the level its evidence supports. See [What's coming](/roadmap/).

## Related

- [verify](/cli/verify/) — the same checks, locally
- [passport](/cli/passport/) — issue one
