import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { formatG } from "../core/factors.js";
import { aggregate, creditedTonnes, methodOf, readLedger, type ContributionEvent } from "../core/ledger.js";
import { findPolicyPath, parsePolicy } from "../core/policy.js";
import { createKey, loadKey } from "../core/keys.js";
import { sign, PASSPORT_VERSION, type Passport, type PassportAnchor } from "../core/passport.js";

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;

/** Passports are fresh-by-design: a stale one must be re-issued, not trusted. */
const VALIDITY_DAYS = 90;

function projectName(cwd: string): string {
  return basename(resolve(cwd)) || "project";
}

function anchorFrom(c: ContributionEvent): PassportAnchor {
  return {
    rail: c.rail,
    chain_id: c.rail.startsWith("x402") ? 8453 : undefined,
    tx_hash: (c as any).tx_hash,
    registry_serial: (c as any).registry_serial,
    credit_class: c.credit_class,
    method: methodOf(c),
    vintage: (c as any).vintage,
    tonnes: c.tonnes,
    certificate_url: c.receipt || undefined,
  };
}

export async function cmdPassport(cwd: string, argv: string[]): Promise<number> {
  const policyPath = findPolicyPath(cwd);
  if (!policyPath) {
    console.error("✖ No carbon.md here. Run `npx carbon-md init` first.");
    return 1;
  }
  const policy = parsePolicy(policyPath);

  const outIdx = argv.indexOf("--out");
  const outDir = resolve(cwd, outIdx >= 0 ? argv[outIdx + 1] ?? "public" : "public");
  const kindIdx = argv.indexOf("--kind");
  const kind = (kindIdx >= 0 ? argv[kindIdx + 1] : "project") as Passport["subject"]["kind"];

  let key = loadKey(cwd);
  if (!key) {
    key = createKey(cwd);
    console.log(green("✔ Created a passport signing key") + dim(` (${key.did})`));
    console.log(dim("  Stored in .carbon-md/ (gitignored, mode 0600). Back it up privately."));
  }

  const events = readLedger(cwd);
  const all = aggregate(events);
  const contributions = events.filter((e): e is ContributionEvent => e.type === "contribution");
  const targetTonnes = (all.usage.central / 1_000_000) * policy.policy.contribution_target;
  const credited = creditedTonnes(all, policy.policy.portfolio);

  const times = events.map((e) => e.ts).filter(Boolean).sort();
  const now = new Date();
  const expires = new Date(now.getTime() + VALIDITY_DAYS * 86400_000);

  const passport: Passport = {
    carbon_passport: PASSPORT_VERSION,
    subject: { id: key.did, name: projectName(cwd), kind },
    period: { from: (times[0] ?? now.toISOString()).slice(0, 10), to: (times[times.length - 1] ?? now.toISOString()).slice(0, 10) },
    methodology: policy.methodology,
    policy: { contribution_target: policy.policy.contribution_target, portfolio: policy.policy.portfolio },
    estimated_gco2e: {
      low: all.usage.low,
      central: all.usage.central,
      high: all.usage.high,
      calls: all.usage.calls,
      tokens: all.usage.tokens,
    },
    contribution: {
      target_tonnes: Number(targetTonnes.toFixed(6)),
      contributed_tonnes: Number(all.contributedTonnes.toFixed(6)),
      credited_tonnes: Number(credited.toFixed(6)),
      met: credited >= targetTonnes,
      anchors: contributions.map(anchorFrom),
    },
    // advisory only — `verify` re-derives this from the evidence
    trust_level: contributions.length ? "L2" : "L1",
    issued_at: now.toISOString(),
    expires_at: expires.toISOString(),
    issuer: key.did,
  };

  const signed = sign(passport, key);

  mkdirSync(outDir, { recursive: true });
  const file = join(outDir, "passport.json");
  writeFileSync(file, JSON.stringify(signed, null, 2), "utf8");

  console.log(`\n${bold("Carbon Passport")} ${dim(PASSPORT_VERSION)}`);
  console.log(`  subject     ${signed.subject.name} ${dim(`(${signed.subject.kind})`)}`);
  console.log(`  identity    ${dim(key.did)}`);
  console.log(`  emissions   ${formatG(all.usage.central)} ${dim(`(${formatG(all.usage.low)} – ${formatG(all.usage.high)})`)}`);
  console.log(`  contributed ${signed.contribution.contributed_tonnes} tCO2e ${dim(`· credited ${signed.contribution.credited_tonnes} · target ${signed.contribution.target_tonnes}`)}`);
  console.log(`  anchors     ${signed.contribution.anchors.length}`);
  console.log(`  expires     ${signed.expires_at.slice(0, 10)}`);
  console.log(green(`\n✔ Wrote ${file}`));
  console.log(dim("  Anyone can check it:  npx carbon-md verify " + file));
  if (!signed.contribution.anchors.length) {
    console.log(dim("  No retirements yet — this passport can only reach L1 (measured)."));
  }
  return 0;
}
