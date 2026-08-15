import { generateKeyPairSync } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { base58encode, base58decode, publicKeyToDid, signBytes, verifyBytes, type KeyFile } from "./keys.js";
import { canonicalize } from "./passport.js";

/**
 * The certification registry — the only part of carbon.md that is not
 * self-serve, and therefore the only claim a subject cannot mint for itself.
 *
 * L0–L2 are derived from a passport alone: anyone can recompute them and
 * nobody needs permission. L3 says a human reviewed the methodology, the
 * receipts and the public claims. That statement is worth something only if
 * it can be *withdrawn*, so the registry is signed, short-lived, and
 * revocable — see the trust anchors below for why each of those matters.
 */

export const REGISTRY_VERSION = "0.1";

/**
 * Trust anchors, pinned in code on purpose.
 *
 * A registry that named its own issuer would certify nothing: anyone could
 * sign a document saying "I am the issuer, and I am certified". The verifier
 * must therefore know, without being told by the data it is checking, both
 * WHO may certify and WHERE the list lives. Overriding either (see
 * `--registry` / `--registry-issuer` on `verify`) is a test/self-hosted
 * affordance, and the CLI says so loudly when you use it — because the result
 * is then no longer a carbon.md certification.
 */
export const CERTIFICATION_ISSUER_DID = "did:key:z6MkukXzcgxRqkhfFLf6nWcqQ47qRQd4ZR3tGQC36UqK97vd";
export const CERTIFICATION_REGISTRY_URL = "https://docs.carbonmd.dev/.well-known/carbon-md/registry.json";

/** How long a signed registry stays good. Short: see `expires_at` below. */
export const REGISTRY_VALIDITY_DAYS = 30;

export type CertificationTier = "maker" | "product" | "enterprise";
export type EntryStatus = "active" | "revoked";

export interface RegistryEntry {
  subject: string;
  name: string;
  tier: CertificationTier;
  status: EntryStatus;
  issued_at: string;
  valid_until: string;
  scope: { methodology: string; note?: string };
  certificate_url?: string;
  revoked_at?: string;
  revocation_reason?: string;
}

export interface Registry {
  carbon_md_registry: string;
  issuer: string;
  issued_at: string;
  /**
   * The registry itself expires, separately from any entry in it.
   *
   * Without this, a copy cached the day before a revocation would keep
   * vouching for a revoked subject forever, and revocation would be advisory.
   * A short life means the worst case is bounded: stale registry, no L3.
   */
  expires_at: string;
  entries: RegistryEntry[];
  proof?: {
    type: "eddsa-jcs-2022";
    verification_method: string;
    created: string;
    signature: string;
  };
}

/** What the verifier concluded about one subject's certification. */
export type CertificationState = "none" | "active" | "revoked" | "expired" | "unchecked";

export interface CertificationResult {
  status: CertificationState;
  tier?: CertificationTier;
  valid_until?: string;
  certificate_url?: string;
  revoked_at?: string;
  reason?: string;
  warnings: string[];
}

export function registrySigningBytes(r: Registry): Uint8Array {
  const { proof: _drop, ...unsigned } = r;
  return new TextEncoder().encode(canonicalize(unsigned));
}

export function signRegistry(r: Registry, key: KeyFile): Registry {
  return {
    ...r,
    proof: {
      type: "eddsa-jcs-2022",
      verification_method: `${key.did}#${key.publicKeyMultibase}`,
      created: new Date().toISOString(),
      signature: `z${base58encode(signBytes(key, registrySigningBytes(r)))}`,
    },
  };
}

/**
 * Verify a registry against an expected issuer.
 *
 * Three things must agree: the pinned issuer, the issuer the document names,
 * and the key that actually signed it. Checking only the last would let a
 * valid signature by *some* key pass; checking only the first two would trust
 * an unsigned assertion.
 */
export function verifyRegistrySignature(
  r: Registry,
  expectedIssuer: string
): { valid: boolean; reason?: string } {
  if (!r || typeof r !== "object") return { valid: false, reason: "not a registry document" };
  if (r.carbon_md_registry !== REGISTRY_VERSION) {
    return { valid: false, reason: `unsupported registry version ${r.carbon_md_registry}` };
  }
  if (!r.proof) return { valid: false, reason: "registry is not signed" };
  if (r.proof.type !== "eddsa-jcs-2022") return { valid: false, reason: `unsupported proof type ${r.proof.type}` };
  if (r.issuer !== expectedIssuer) {
    return { valid: false, reason: `registry issuer ${r.issuer} is not the expected ${expectedIssuer}` };
  }
  const signer = r.proof.verification_method.split("#")[0];
  if (signer !== expectedIssuer) {
    return { valid: false, reason: `registry was signed by ${signer}, not the issuer it names` };
  }
  if (!r.proof.signature.startsWith("z")) return { valid: false, reason: "signature is not multibase base58btc" };
  try {
    const ok = verifyBytes(signer, registrySigningBytes(r), base58decode(r.proof.signature.slice(1)));
    return ok ? { valid: true } : { valid: false, reason: "registry signature does not match the document" };
  } catch (e: any) {
    return { valid: false, reason: e?.message ?? String(e) };
  }
}

/**
 * Decide a subject's certification from a registry document.
 *
 * Every failure path returns something other than "active", so L3 is granted
 * only when the whole chain holds. `unchecked` is deliberately distinct from
 * `none`: "we could not look" must never read as "we looked and found nothing".
 */
export function lookupCertification(
  registry: Registry,
  subject: string,
  opts: { expectedIssuer?: string; now?: number } = {}
): CertificationResult {
  const expectedIssuer = opts.expectedIssuer ?? CERTIFICATION_ISSUER_DID;
  const now = opts.now ?? Date.now();
  const warnings: string[] = [];

  const sig = verifyRegistrySignature(registry, expectedIssuer);
  if (!sig.valid) return { status: "unchecked", warnings: [`certification registry rejected: ${sig.reason}`] };

  const registryExpiry = Date.parse(registry.expires_at);
  if (!Number.isFinite(registryExpiry)) {
    return { status: "unchecked", warnings: ["certification registry has no valid expiry"] };
  }
  if (registryExpiry < now) {
    return {
      status: "unchecked",
      warnings: [`certification registry expired on ${registry.expires_at.slice(0, 10)} — treating as unavailable`],
    };
  }

  const entries = (registry.entries ?? []).filter((e) => e.subject === subject);
  if (!entries.length) return { status: "none", warnings };

  // A revoked entry outranks an active one: withdrawal must not be defeated
  // by appending a fresh row next to it.
  const revoked = entries.find((e) => e.status === "revoked");
  if (revoked) {
    return {
      status: "revoked",
      tier: revoked.tier,
      certificate_url: revoked.certificate_url,
      revoked_at: revoked.revoked_at,
      reason: revoked.revocation_reason,
      warnings: [
        `certification revoked${revoked.revoked_at ? ` on ${revoked.revoked_at.slice(0, 10)}` : ""}${
          revoked.revocation_reason ? `: ${revoked.revocation_reason}` : ""
        }`,
      ],
    };
  }

  const entry = entries[0];
  const from = Date.parse(entry.issued_at);
  const until = Date.parse(entry.valid_until);
  if (!Number.isFinite(until)) return { status: "unchecked", warnings: ["certification entry has no valid expiry"] };
  if (Number.isFinite(from) && from > now) {
    return { status: "none", warnings: [`certification does not start until ${entry.issued_at.slice(0, 10)}`] };
  }
  if (until < now) {
    return {
      status: "expired",
      tier: entry.tier,
      valid_until: entry.valid_until,
      certificate_url: entry.certificate_url,
      warnings: [`certification lapsed on ${entry.valid_until.slice(0, 10)} — renew to restore L3`],
    };
  }

  return {
    status: "active",
    tier: entry.tier,
    valid_until: entry.valid_until,
    certificate_url: entry.certificate_url,
    warnings,
  };
}

export function emptyRegistry(issuer: string, now = new Date()): Registry {
  const expires = new Date(now.getTime() + REGISTRY_VALIDITY_DAYS * 86400_000);
  return {
    carbon_md_registry: REGISTRY_VERSION,
    issuer,
    issued_at: now.toISOString(),
    expires_at: expires.toISOString(),
    entries: [],
  };
}

// ---------------------------------------------------------------------------
// Issuer key handling. Separate from the passport key on purpose: this one
// signs statements about *other people*, so it lives outside any project
// directory and is never something a repo can accidentally carry.
// ---------------------------------------------------------------------------

export function issuerKeyPath(): string {
  return process.env.CARBON_MD_ISSUER_KEY ?? join(homedir(), ".carbon-md", "registry-key.json");
}

export function loadIssuerKey(): KeyFile | null {
  const p = issuerKeyPath();
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

export function createIssuerKey(): KeyFile {
  const p = issuerKeyPath();
  if (existsSync(p)) throw new Error(`an issuer key already exists at ${p} — refusing to overwrite the root of trust`);
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const raw = new Uint8Array(publicKey.export({ type: "spki", format: "der" })).slice(-32);
  const did = publicKeyToDid(raw);
  const data: KeyFile = {
    did,
    publicKeyMultibase: did.slice("did:key:".length),
    privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    createdAt: new Date().toISOString(),
    purpose: "carbon.md certification registry issuer key — root of trust for L3",
  };
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 2), { mode: 0o600 });
  return data;
}
