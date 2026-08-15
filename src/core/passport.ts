import { base58encode, base58decode, signBytes, verifyBytes, type KeyFile } from "./keys.js";
import type { CreditMethod } from "./ledger.js";

/**
 * The Carbon Passport: the ledger summary you already publish, made
 * checkable by a stranger — signed, and anchored to retirement receipts.
 *
 * `trust_level` inside the document is ADVISORY. A verifier re-derives it
 * from the evidence and never trusts the claim; a forged "L3" fails because
 * the evidence for it isn't there.
 */

export const PASSPORT_VERSION = "0.1";

export type TrustLevel = "L0" | "L1" | "L2" | "L3";

export interface PassportAnchor {
  rail: string;
  chain_id?: number;
  tx_hash?: string;
  registry_serial?: string;
  project?: string;
  credit_class?: string;
  method?: CreditMethod;
  vintage?: number;
  tonnes: number;
  certificate_url?: string;
  beneficiary?: string;
}

export interface Passport {
  carbon_passport: string;
  subject: { id: string; name: string; kind: "agent" | "project" | "fleet"; organization_id?: string };
  period: { from: string; to: string };
  methodology: string;
  policy: { contribution_target: number; portfolio: string };
  estimated_gco2e: { low: number; central: number; high: number; calls: number; tokens: number };
  contribution: {
    target_tonnes: number;
    contributed_tonnes: number;
    credited_tonnes: number;
    met: boolean;
    anchors: PassportAnchor[];
  };
  trust_level: TrustLevel;
  issued_at: string;
  expires_at: string;
  issuer: string;
  proof?: {
    type: "eddsa-jcs-2022";
    verification_method: string;
    created: string;
    signature: string;
  };
}

/**
 * RFC 8785-style canonicalization: object keys sorted, no insignificant
 * whitespace. Both signer and verifier must agree byte-for-byte, so this
 * runs on the document with `proof` removed.
 */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(",")}}`;
}

export function signingBytes(p: Passport): Uint8Array {
  const { proof: _drop, ...unsigned } = p;
  return new TextEncoder().encode(canonicalize(unsigned));
}

export function sign(p: Passport, key: KeyFile): Passport {
  const sig = signBytes(key, signingBytes(p));
  return {
    ...p,
    proof: {
      type: "eddsa-jcs-2022",
      verification_method: `${key.did}#${key.publicKeyMultibase}`,
      created: new Date().toISOString(),
      signature: `z${base58encode(sig)}`,
    },
  };
}

export function verifySignature(p: Passport): { valid: boolean; reason?: string } {
  if (!p.proof) return { valid: false, reason: "no proof on the document" };
  if (p.proof.type !== "eddsa-jcs-2022") return { valid: false, reason: `unsupported proof type ${p.proof.type}` };
  const did = p.proof.verification_method.split("#")[0];
  if (!p.proof.signature.startsWith("z")) return { valid: false, reason: "signature is not multibase base58btc" };
  try {
    const ok = verifyBytes(did, signingBytes(p), base58decode(p.proof.signature.slice(1)));
    return ok ? { valid: true } : { valid: false, reason: "signature does not match the document" };
  } catch (e: any) {
    return { valid: false, reason: e?.message ?? String(e) };
  }
}

export interface VerifyResult {
  subject: string;
  verdict: "verified" | "invalid" | "stale";
  trust_level: TrustLevel;
  signature_valid: boolean;
  policy_target_met: boolean;
  removal_ok: boolean;
  anchors: number;
  anchors_resolved: "offline" | "resolved" | "none";
  warnings: string[];
  verified_at: string;
}

/**
 * Re-derive the trust level from evidence. Never reads p.trust_level.
 *
 * L0 declared → L1 measured → L2 contribution-verified. L3 requires a
 * certification registry entry, which is not shipped yet, so a document
 * claiming L3 is reported at the level its evidence actually supports.
 */
export function deriveTrustLevel(p: Passport, opts: { signatureValid: boolean; anchorsResolved: boolean }): {
  level: TrustLevel;
  warnings: string[];
  policyMet: boolean;
  removalOk: boolean;
} {
  const warnings: string[] = [];
  if (!opts.signatureValid) return { level: "L0", warnings: ["signature invalid — nothing below can be trusted"], policyMet: false, removalOk: false };

  const hasUsage = p.estimated_gco2e.calls > 0 && p.estimated_gco2e.central > 0;
  const hasRanges = p.estimated_gco2e.low <= p.estimated_gco2e.central && p.estimated_gco2e.central <= p.estimated_gco2e.high;
  const hasMethodology = typeof p.methodology === "string" && p.methodology.length > 0;
  if (!hasUsage) warnings.push("no usage recorded — cannot claim measurement");
  if (!hasRanges) warnings.push("uncertainty range is malformed");
  if (!hasMethodology) warnings.push("no methodology version pinned");

  const level1 = hasUsage && hasRanges && hasMethodology;
  if (!level1) return { level: "L0", warnings, policyMet: false, removalOk: false };

  const anchors = p.contribution.anchors ?? [];
  const policyMet = p.contribution.credited_tonnes >= p.contribution.target_tonnes && p.contribution.target_tonnes > 0;

  // A removal claim is only honoured if every counted anchor says removal.
  const removalPolicy = p.policy.portfolio === "removal-only" || p.policy.portfolio === "removal-weighted";
  const nonRemoval = anchors.filter((a) => a.method && a.method !== "removal");
  const unspecified = anchors.filter((a) => !a.method || a.method === "unspecified");
  const removalOk = !removalPolicy || (nonRemoval.length === 0 && unspecified.length === 0);

  if (!anchors.length) {
    warnings.push("no retirement anchors — measurement only");
    return { level: "L1", warnings, policyMet, removalOk };
  }
  if (!opts.anchorsResolved) warnings.push("anchors not resolved on-chain");
  if (removalPolicy && unspecified.length) warnings.push(`${unspecified.length} anchor(s) of unspecified method under a ${p.policy.portfolio} policy`);
  if (removalPolicy && nonRemoval.length) warnings.push(`${nonRemoval.length} anchor(s) are not removal under a ${p.policy.portfolio} policy`);
  if (!policyMet) warnings.push("contribution target not met");

  const level2 = policyMet && removalOk && opts.anchorsResolved;
  return { level: level2 ? "L2" : "L1", warnings, policyMet, removalOk };
}
