import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  CERTIFICATION_ISSUER_DID,
  CERTIFICATION_REGISTRY_URL,
  REGISTRY_VALIDITY_DAYS,
  createIssuerKey,
  emptyRegistry,
  loadIssuerKey,
  lookupCertification,
  signRegistry,
  verifyRegistrySignature,
  type CertificationTier,
  type Registry,
  type RegistryEntry,
} from "../core/registry.js";

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;

/** Where the signed registry is authored, relative to the repo root. */
const DEFAULT_PATH = "docs-site/static/.well-known/carbon-md/registry.json";

const TIERS: CertificationTier[] = ["maker", "product", "enterprise"];

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}

function registryPath(cwd: string, argv: string[]): string {
  return resolve(cwd, flag(argv, "file") ?? DEFAULT_PATH);
}

function read(path: string): Registry {
  if (!existsSync(path)) throw new Error(`no registry at ${path} — run \`carbon-md registry init\` first`);
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * Every write re-signs and re-dates the whole document. The registry carries
 * one signature over its full contents, so there is no way to edit a row and
 * leave the proof intact — which is the point.
 */
function writeSigned(path: string, registry: Registry): Registry {
  const key = loadIssuerKey();
  if (!key) throw new Error("no issuer key — run `carbon-md registry init` (it is generated locally and never leaves this machine)");
  if (key.did !== CERTIFICATION_ISSUER_DID) {
    console.log(
      yellow(`⚠ this key (${key.did}) is not the issuer pinned in the CLI (${CERTIFICATION_ISSUER_DID}).`)
    );
    console.log(yellow("  Verifiers will reject the result as a carbon.md certification."));
  }
  const now = new Date();
  const signed = signRegistry(
    {
      ...registry,
      issuer: key.did,
      issued_at: now.toISOString(),
      expires_at: new Date(now.getTime() + REGISTRY_VALIDITY_DAYS * 86400_000).toISOString(),
    },
    key
  );
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(signed, null, 2) + "\n");
  return signed;
}

function summarise(path: string, r: Registry): void {
  const active = r.entries.filter((e) => e.status === "active").length;
  const revoked = r.entries.filter((e) => e.status === "revoked").length;
  console.log(`  issuer      ${dim(r.issuer)}`);
  console.log(`  expires     ${r.expires_at.slice(0, 10)} ${dim(`(${REGISTRY_VALIDITY_DAYS}-day validity — re-sign before then)`)}`);
  console.log(`  entries     ${r.entries.length} ${dim(`(${active} active, ${revoked} revoked)`)}`);
  console.log(`  file        ${dim(path)}`);
}

function usage(): number {
  console.error(`Usage: carbon-md registry <command>

  init                       Create the issuer key and an empty signed registry
  list                       Show what the local registry contains
  add --subject <did> --name <name> --tier maker|product|enterprise
      [--valid-until <YYYY-MM-DD>] [--methodology <v>] [--certificate-url <url>] [--note <text>]
                             Certify a subject and re-sign
  revoke --subject <did> --reason "<why>"
                             Withdraw a certification and re-sign
  sign                       Re-sign and re-date the registry (run before each deploy)
  verify [<file|url>]        Check a registry's signature and report its contents

Options: --file <path> to work on a registry other than ${DEFAULT_PATH}`);
  return 2;
}

export async function cmdRegistry(cwd: string, argv: string[]): Promise<number> {
  const sub = argv.find((a) => !a.startsWith("--"));
  if (!sub) return usage();

  try {
    switch (sub) {
      case "init":
        return init(cwd, argv);
      case "list":
        return list(cwd, argv);
      case "add":
        return add(cwd, argv);
      case "revoke":
        return revoke(cwd, argv);
      case "sign":
        return sign(cwd, argv);
      case "verify":
        return await verify(cwd, argv);
      default:
        return usage();
    }
  } catch (e: any) {
    console.error(red(`✖ ${e?.message ?? e}`));
    return 1;
  }
}

function init(cwd: string, argv: string[]): number {
  const path = registryPath(cwd, argv);
  let key = loadIssuerKey();
  if (!key) {
    key = createIssuerKey();
    console.log(green("✔ Issuer key created"));
    console.log(`  did         ${bold(key.did)}`);
    console.log(dim("  This key is the root of trust for L3. It is stored with mode 0600 outside"));
    console.log(dim("  any project directory. Back it up privately — losing it means every"));
    console.log(dim("  certification must be re-issued under a new identity, and the DID pinned"));
    console.log(dim("  in the CLI must change with it."));
  } else {
    console.log(dim(`Using the existing issuer key ${key.did}`));
  }

  if (existsSync(path)) {
    console.log(yellow(`\n⚠ a registry already exists at ${path} — left untouched`));
    return 0;
  }
  const signed = writeSigned(path, emptyRegistry(key.did));
  console.log(green("\n✔ Empty registry written and signed"));
  summarise(path, signed);
  console.log(dim(`\n  It certifies nobody yet, which is the honest starting state.`));
  console.log(dim(`  Publish it at ${CERTIFICATION_REGISTRY_URL}`));
  return 0;
}

function list(cwd: string, argv: string[]): number {
  const path = registryPath(cwd, argv);
  const r = read(path);
  const sig = verifyRegistrySignature(r, r.issuer);
  console.log(`\n${bold("carbon.md certification registry")} — ${sig.valid ? green("signature valid") : red(sig.reason ?? "invalid")}`);
  summarise(path, r);
  if (!r.entries.length) {
    console.log(dim("\n  No entries. Nobody is certified."));
    return 0;
  }
  console.log("");
  for (const e of r.entries) {
    const state = e.status === "revoked" ? red("revoked") : green("active");
    console.log(`  ${bold(e.name)} ${dim(e.subject)}`);
    console.log(`    ${state} · ${e.tier} · until ${e.valid_until.slice(0, 10)}${e.certificate_url ? dim(` · ${e.certificate_url}`) : ""}`);
    if (e.revocation_reason) console.log(dim(`    reason: ${e.revocation_reason}`));
  }
  console.log("");
  return 0;
}

function add(cwd: string, argv: string[]): number {
  const subject = flag(argv, "subject");
  const name = flag(argv, "name");
  const tier = (flag(argv, "tier") ?? "maker") as CertificationTier;
  if (!subject || !name) {
    console.error("Usage: carbon-md registry add --subject <did:key:…> --name <name> --tier maker|product|enterprise");
    return 2;
  }
  if (!subject.startsWith("did:key:")) throw new Error(`subject must be a did:key, got ${subject}`);
  if (!TIERS.includes(tier)) throw new Error(`unknown tier ${tier} — one of ${TIERS.join(", ")}`);

  const path = registryPath(cwd, argv);
  const r = read(path);
  if (r.entries.some((e) => e.subject === subject && e.status === "active")) {
    throw new Error(`${subject} is already certified — revoke first, or edit ${path} directly`);
  }

  const now = new Date();
  const validUntil = flag(argv, "valid-until")
    ? new Date(`${flag(argv, "valid-until")}T00:00:00Z`)
    : new Date(now.getTime() + 365 * 86400_000);
  if (Number.isNaN(validUntil.getTime())) throw new Error("--valid-until must be YYYY-MM-DD");

  const entry: RegistryEntry = {
    subject,
    name,
    tier,
    status: "active",
    issued_at: now.toISOString(),
    valid_until: validUntil.toISOString(),
    scope: {
      methodology: flag(argv, "methodology") ?? "carbonmd-factors-2026-08",
      ...(flag(argv, "note") ? { note: flag(argv, "note")! } : {}),
    },
    ...(flag(argv, "certificate-url") ? { certificate_url: flag(argv, "certificate-url")! } : {}),
  };

  const signed = writeSigned(path, { ...r, entries: [...r.entries, entry] });
  console.log(green(`✔ Certified ${name} (${tier}) until ${entry.valid_until.slice(0, 10)}`));
  summarise(path, signed);
  console.log(dim("\n  Commit and deploy the registry for this to take effect."));
  return 0;
}

function revoke(cwd: string, argv: string[]): number {
  const subject = flag(argv, "subject");
  const reason = flag(argv, "reason");
  if (!subject || !reason) {
    console.error('Usage: carbon-md registry revoke --subject <did:key:…> --reason "why"');
    return 2;
  }
  const path = registryPath(cwd, argv);
  const r = read(path);
  const idx = r.entries.findIndex((e) => e.subject === subject && e.status === "active");
  if (idx < 0) throw new Error(`no active certification for ${subject}`);

  // The row stays, marked revoked, rather than being deleted: the public
  // history of who was certified and why it ended is the accountability.
  const entries = [...r.entries];
  entries[idx] = { ...entries[idx], status: "revoked", revoked_at: new Date().toISOString(), revocation_reason: reason };

  const signed = writeSigned(path, { ...r, entries });
  console.log(green(`✔ Revoked ${entries[idx].name}: ${reason}`));
  summarise(path, signed);
  console.log(dim("\n  Deploy the registry now — until you do, the old one is still being served."));
  return 0;
}

function sign(cwd: string, argv: string[]): number {
  const path = registryPath(cwd, argv);
  const signed = writeSigned(path, read(path));
  console.log(green("✔ Registry re-signed"));
  summarise(path, signed);
  return 0;
}

async function verify(cwd: string, argv: string[]): Promise<number> {
  const target = argv.filter((a) => !a.startsWith("--"))[1] ?? registryPath(cwd, argv);
  let r: Registry;
  if (/^https?:\/\//.test(target)) {
    const res = await fetch(target);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${target}`);
    r = (await res.json()) as Registry;
  } else {
    r = read(resolve(target));
  }

  const issuer = flag(argv, "issuer") ?? CERTIFICATION_ISSUER_DID;
  const sig = verifyRegistrySignature(r, issuer);
  const expired = Date.parse(r.expires_at) < Date.now();

  console.log(`\n${bold("carbon.md certification registry")} — ${sig.valid ? green("✔ VALID") : red("✖ INVALID")}`);
  console.log(`  source      ${dim(target)}`);
  if (!sig.valid) console.log(`  reason      ${red(sig.reason ?? "unknown")}`);
  summarise(target, r);
  if (expired) console.log(yellow(`  ⚠ expired — verifiers will not grant L3 from this copy`));

  const subject = flag(argv, "subject");
  if (subject) {
    const c = lookupCertification(r, subject, { expectedIssuer: issuer });
    console.log(`\n  ${bold(subject)}`);
    console.log(`    certification ${c.status === "active" ? green(c.status) : c.status === "revoked" ? red(c.status) : yellow(c.status)}`);
    for (const w of c.warnings) console.log(dim(`    · ${w}`));
  }
  console.log("");
  return sig.valid && !expired ? 0 : 1;
}
