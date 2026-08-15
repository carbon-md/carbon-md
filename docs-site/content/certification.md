# Certification & the registry

**L3 is the one level you cannot issue yourself.** L0–L2 are derived from your passport: anyone can recompute them, nobody's permission is involved, and they are free forever. L3 says a human reviewed the methodology, the receipts and the public claims — and that statement is worth something only because it can be taken away.

> **Nobody is certified yet.** The registry is live and signed, and it contains zero entries. That is the honest starting state, and this page will not pretend otherwise.

## The registry

A single signed document, served at:

```
https://docs.carbonmd.dev/.well-known/carbon-md/registry.json
```

```bash
npx carbon-md registry verify https://docs.carbonmd.dev/.well-known/carbon-md/registry.json
```

It lists every certified subject, the tier, the validity window, and every revocation. It is committed to the public repository, so the history of who was certified — and why a certification ended — is auditable, not just its current state.

## What makes it trustworthy

Three properties, each closing a specific hole:

**The issuer is pinned in code, not read from the document.** A registry that named its own issuer would certify nothing: anyone could sign a file saying "I am the issuer, and I am certified". The verifier knows the issuer DID and the registry URL without being told by the data it is checking. Passing `--registry` or `--registry-issuer` overrides them, and the CLI then says plainly that the result is not a carbon.md certification.

**The registry expires, separately from any entry in it.** Thirty days. Without that, a copy cached the day before a revocation would keep vouching for a revoked subject indefinitely, and revocation would be advisory. The worst case is now bounded: a stale registry grants nothing.

**A failed check is never a pass.** Unreachable, unsigned, wrong issuer, expired, tampered — all resolve to `unchecked`, which caps the result at L2. "We could not look" must never read as "we looked and found nothing", and must certainly never grant a level.

## What certification attests

| Certified | Never certified |
|---|---|
| Methodology conformance — right factor version, ranges shown | "carbon neutral" |
| Retirements over the period genuinely match the policy target | "climate positive" |
| Removal claims are backed by removal credits | that emissions were erased |
| Claims discipline — public copy uses contribution language | any outcome you cannot evidence |
| Identity and key control | |

The certificate reads: *"Verified: this agent measures its emissions per `<methodology>` and contributes ≥`<target>`% via verified carbon removal for `<period>`."* ECGT-safe by construction — see [Claims & compliance](/guides/claims/).

## Tiers

| Tier | For | Review | Indicative price |
|---|---|---|---|
| **Verified** (L2) | anyone | automated | **free** |
| **Certified · Maker** | an indie project or single agent | methodology, receipts, claims scan | ~$500 / yr |
| **Certified · Product** | a shipped product or small fleet | above + org linkage + published methodology review | ~$1.5–2k / yr |
| **Certified · Enterprise** | fleets, CSRD-linked | above + scope-3 export + audit trail + SLA | custom |

Renewed annually, because removals and claims are re-checked — freshness is the point of a time-boxed stamp.

## L3 never substitutes for evidence

Certification sits **on top of** a genuine L2. A certified subject whose anchors stop resolving, or whose contribution turns out to be avoidance under a removal policy, does not stay at L3 — it drops to whatever the evidence supports. The stamp attests to process; it never stands in for the receipts.

## Revocation

Revoke on lapsed removals, prohibited claims, or key compromise:

```bash
npx carbon-md registry revoke --subject did:key:z6Mk… --reason "prohibited neutrality claim"
```

The row stays, marked revoked, rather than being deleted — the public record of what ended and why *is* the accountability. A revoked entry outranks an active one for the same subject, so a withdrawal cannot be defeated by appending a fresh row beside it.

Downstream, revocation is loud: [`/v1/badge`](/api/) renders `revoked` in red rather than quietly falling back to `L2 verified`, because a reassuring badge on a withdrawn certification is the exact failure this design exists to prevent.

## Getting certified

1. Reach **L2** — `carbon-md verify` must be green against your published passport.
2. Apply with your passport URL.
3. Human review: methodology, receipts, and the claims on your public pages.
4. Your subject DID is added to the registry, which is re-signed and deployed.

Most of step 3 is the same automated check you can run yourself; the part you are paying for is the judgement, and the willingness to withdraw it.

## Offline

L3 cannot be established without the registry, so `verify --offline` caps at L2 and says so. Signature, freshness and measurement checks still run with no network — air-gapped CI keeps working, it simply cannot confirm a certification.

## Related

- [registry](/cli/registry/) — the issuer-side command reference
- [verify](/cli/verify/) — how a level is re-derived
- [Attestation API](/api/) — the same checks, hosted
