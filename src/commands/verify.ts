import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BASE_RPC } from "../core/wallet.js";
import { deriveTrustLevel, verifySignature, type Passport, type VerifyResult } from "../core/passport.js";

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;

const LEVELS = ["L0", "L1", "L2", "L3"] as const;

async function load(target: string): Promise<Passport> {
  if (/^https?:\/\//.test(target)) {
    const res = await fetch(target);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${target}`);
    return (await res.json()) as Passport;
  }
  const p = resolve(target);
  if (!existsSync(p)) throw new Error(`no such file: ${p}`);
  return JSON.parse(readFileSync(p, "utf8"));
}

/** Confirm each anchor's transaction actually exists on Base. */
async function resolveAnchors(p: Passport, timeoutMs = 8000): Promise<{ resolved: boolean; notes: string[] }> {
  const notes: string[] = [];
  const hashes = (p.contribution.anchors ?? []).map((a) => a.tx_hash).filter(Boolean) as string[];
  if (!hashes.length) return { resolved: false, notes: ["anchors carry no transaction hash"] };

  for (const hash of hashes) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(BASE_RPC, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [hash] }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const body: any = await res.json();
      const receipt = body?.result;
      if (!receipt) {
        notes.push(`${hash.slice(0, 10)}… not found on chain`);
        return { resolved: false, notes };
      }
      if (receipt.status && receipt.status !== "0x1") {
        notes.push(`${hash.slice(0, 10)}… reverted on chain`);
        return { resolved: false, notes };
      }
    } catch (e: any) {
      notes.push(`could not reach the chain (${e?.name === "AbortError" ? "timeout" : e?.message ?? e})`);
      return { resolved: false, notes };
    }
  }
  return { resolved: true, notes };
}

export async function cmdVerify(cwd: string, argv: string[]): Promise<number> {
  const target = argv.find((a) => !a.startsWith("--"));
  if (!target) {
    console.error("Usage: carbon-md verify <passport.json | https://…/passport.json> [--offline] [--min L0|L1|L2] [--json]");
    return 2;
  }
  const offline = argv.includes("--offline");
  const asJson = argv.includes("--json");
  const minIdx = argv.indexOf("--min");
  const min = (minIdx >= 0 ? argv[minIdx + 1] : "L1") as (typeof LEVELS)[number];

  let p: Passport;
  try {
    p = await load(target);
  } catch (e: any) {
    console.error(`✖ ${e.message}`);
    return 2;
  }

  const sig = verifySignature(p);
  const stale = new Date(p.expires_at).getTime() < Date.now();

  let anchorsResolved = false;
  let notes: string[] = [];
  if (!offline && sig.valid) {
    const r = await resolveAnchors(p);
    anchorsResolved = r.resolved;
    notes = r.notes;
  } else if (offline) {
    notes.push("offline: anchors not checked against the chain");
  }

  const derived = deriveTrustLevel(p, { signatureValid: sig.valid, anchorsResolved });
  const warnings = [...derived.warnings, ...notes];
  if (stale) warnings.push(`expired on ${p.expires_at.slice(0, 10)} — re-issue with \`carbon-md passport\``);

  const result: VerifyResult = {
    subject: p.subject?.id ?? "unknown",
    verdict: !sig.valid ? "invalid" : stale ? "stale" : "verified",
    trust_level: derived.level,
    signature_valid: sig.valid,
    policy_target_met: derived.policyMet,
    removal_ok: derived.removalOk,
    anchors: p.contribution?.anchors?.length ?? 0,
    anchors_resolved: offline ? "offline" : anchorsResolved ? "resolved" : p.contribution?.anchors?.length ? "none" : "none",
    warnings,
    verified_at: new Date().toISOString(),
  };

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const badge =
      result.verdict === "invalid" ? red("✖ INVALID") : result.verdict === "stale" ? yellow("⚠ STALE") : green("✔ VERIFIED");
    console.log(`\n${bold("carbon.md passport")} — ${badge} ${bold(derived.level)}`);
    console.log(`  subject     ${p.subject?.name ?? "?"} ${dim(result.subject)}`);
    console.log(`  signature   ${sig.valid ? green("valid") : red(sig.reason ?? "invalid")}`);
    console.log(`  methodology ${p.methodology}`);
    console.log(`  emissions   ${p.estimated_gco2e?.central} gCO2e ${dim(`(${p.estimated_gco2e?.low} – ${p.estimated_gco2e?.high})`)}`);
    console.log(
      `  contribution ${p.contribution?.credited_tonnes} / ${p.contribution?.target_tonnes} tCO2e credited ${
        derived.policyMet ? green("· target met") : yellow("· outstanding")
      }`
    );
    console.log(`  anchors     ${result.anchors} ${dim(`(${result.anchors_resolved})`)}`);
    if (p.trust_level && p.trust_level !== derived.level) {
      console.log(yellow(`  ⚠ document claims ${p.trust_level}; evidence supports ${derived.level}`));
    }
    for (const w of warnings) console.log(dim(`  · ${w}`));
    console.log("");
  }

  const meets = LEVELS.indexOf(derived.level) >= LEVELS.indexOf(min);
  return sig.valid && meets && !stale ? 0 : 1;
}
