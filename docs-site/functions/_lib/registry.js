/**
 * Certification registry checks, in the edge runtime.
 *
 * A port of core/registry.ts. Kept in step by hand and held there by
 * src/test/edge-parity.test.ts: if these rules drifted from the CLI's, "L3"
 * would mean one thing on a badge and another on someone's machine.
 */

import { base58decode, canonicalize } from "./passport.js";

export const REGISTRY_VERSION = "0.1";

/** Pinned trust anchors — see core/registry.ts for why these are not data. */
export const CERTIFICATION_ISSUER_DID = "did:key:z6MkukXzcgxRqkhfFLf6nWcqQ47qRQd4ZR3tGQC36UqK97vd";
export const CERTIFICATION_REGISTRY_URL = "https://docs.carbonmd.dev/.well-known/carbon-md/registry.json";

function registrySigningBytes(r) {
  const { proof: _drop, ...unsigned } = r;
  return new TextEncoder().encode(canonicalize(unsigned));
}

export async function verifyRegistrySignature(r, expectedIssuer) {
  if (!r || typeof r !== "object") return { valid: false, reason: "not a registry document" };
  if (r.carbon_md_registry !== REGISTRY_VERSION) {
    return { valid: false, reason: "unsupported registry version " + r.carbon_md_registry };
  }
  if (!r.proof) return { valid: false, reason: "registry is not signed" };
  if (r.proof.type !== "eddsa-jcs-2022") return { valid: false, reason: "unsupported proof type " + r.proof.type };
  if (r.issuer !== expectedIssuer) {
    return { valid: false, reason: "registry issuer " + r.issuer + " is not the expected " + expectedIssuer };
  }
  const signer = String(r.proof.verification_method || "").split("#")[0];
  if (signer !== expectedIssuer) {
    return { valid: false, reason: "registry was signed by " + signer + ", not the issuer it names" };
  }
  if (typeof r.proof.signature !== "string" || !r.proof.signature.startsWith("z")) {
    return { valid: false, reason: "signature is not multibase base58btc" };
  }
  try {
    const { didToPublicKey } = await import("./passport.js");
    const raw = didToPublicKey(signer);
    const key = await crypto.subtle.importKey("raw", raw, { name: "Ed25519" }, false, ["verify"]);
    const ok = await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      base58decode(r.proof.signature.slice(1)),
      registrySigningBytes(r)
    );
    return ok ? { valid: true } : { valid: false, reason: "registry signature does not match the document" };
  } catch (e) {
    return { valid: false, reason: (e && e.message) || String(e) };
  }
}

/** Decide a subject's certification. Must match core/registry.ts exactly. */
export async function lookupCertification(registry, subject, options) {
  const expectedIssuer = (options && options.expectedIssuer) || CERTIFICATION_ISSUER_DID;
  const now = (options && options.now) || Date.now();

  const sig = await verifyRegistrySignature(registry, expectedIssuer);
  if (!sig.valid) return { status: "unchecked", warnings: ["certification registry rejected: " + sig.reason] };

  const registryExpiry = Date.parse(registry.expires_at);
  if (!Number.isFinite(registryExpiry)) {
    return { status: "unchecked", warnings: ["certification registry has no valid expiry"] };
  }
  if (registryExpiry < now) {
    return {
      status: "unchecked",
      warnings: [
        "certification registry expired on " + String(registry.expires_at).slice(0, 10) + " — treating as unavailable",
      ],
    };
  }

  const entries = (registry.entries || []).filter((e) => e.subject === subject);
  if (!entries.length) return { status: "none", warnings: [] };

  const revoked = entries.find((e) => e.status === "revoked");
  if (revoked) {
    return {
      status: "revoked",
      tier: revoked.tier,
      certificate_url: revoked.certificate_url,
      revoked_at: revoked.revoked_at,
      reason: revoked.revocation_reason,
      warnings: [
        "certification revoked" +
          (revoked.revoked_at ? " on " + String(revoked.revoked_at).slice(0, 10) : "") +
          (revoked.revocation_reason ? ": " + revoked.revocation_reason : ""),
      ],
    };
  }

  const entry = entries[0];
  const from = Date.parse(entry.issued_at);
  const until = Date.parse(entry.valid_until);
  if (!Number.isFinite(until)) return { status: "unchecked", warnings: ["certification entry has no valid expiry"] };
  if (Number.isFinite(from) && from > now) {
    return { status: "none", warnings: ["certification does not start until " + String(entry.issued_at).slice(0, 10)] };
  }
  if (until < now) {
    return {
      status: "expired",
      tier: entry.tier,
      valid_until: entry.valid_until,
      certificate_url: entry.certificate_url,
      warnings: ["certification lapsed on " + String(entry.valid_until).slice(0, 10) + " — renew to restore L3"],
    };
  }

  return {
    status: "active",
    tier: entry.tier,
    valid_until: entry.valid_until,
    certificate_url: entry.certificate_url,
    warnings: [],
  };
}

/**
 * Fetch and check the registry. Any failure yields "unchecked", capping the
 * result at L2 — an unreachable registry must never read as "not certified",
 * and must certainly never grant a level.
 */
export async function checkCertification(subject, options) {
  const url = (options && options.url) || CERTIFICATION_REGISTRY_URL;
  const issuer = (options && options.issuer) || CERTIFICATION_ISSUER_DID;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { accept: "application/json" },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!res.ok) return { status: "unchecked", warnings: ["certification registry unreachable (HTTP " + res.status + ")"] };
    const registry = await res.json();
    return await lookupCertification(registry, subject, { expectedIssuer: issuer });
  } catch (e) {
    const why = e && e.name === "TimeoutError" ? "timeout" : (e && e.message) || String(e);
    return { status: "unchecked", warnings: ["certification registry unreachable (" + why + ")"] };
  }
}
