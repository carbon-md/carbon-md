/**
 * Pre-publish check: does the thing we are about to ship match the source?
 *
 * Written after carbon-md@0.1.10 went to npm carrying the 0.1.8 build — the
 * right package.json, an old dist. It installed cleanly, reported version
 * 0.1.10, and answered "Unknown command: registry" for the feature that
 * release existed to deliver. Nothing failed; the version number simply
 * stopped describing the code, and npm versions are immutable, so the number
 * was spent.
 *
 * The build now cleans dist first, which removes the stale-output path. This
 * checks the result anyway: a release is the one moment where "it built fine"
 * is not good enough, because being wrong is permanent.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const problems = [];
const notes = [];

function fail(msg) {
  problems.push(msg);
}

// 1. Every command the CLI dispatches must exist in the build.
const indexTs = readFileSync(join(ROOT, "src", "index.ts"), "utf8");
const commands = [...indexTs.matchAll(/case "([a-z][a-z-]*)":/g)]
  .map((m) => m[1])
  .filter((c) => !c.startsWith("-") && c !== "help");

const indexJs = join(ROOT, "dist", "index.js");
if (!existsSync(indexJs)) fail("dist/index.js is missing — the build did not run");
else {
  const built = readFileSync(indexJs, "utf8");
  for (const cmd of commands) {
    if (!built.includes(`case "${cmd}"`)) {
      fail(`command "${cmd}" is in src/index.ts but not in dist/index.js — dist is stale`);
    }
  }
}

// 2. Every source module must have a compiled counterpart.
for (const rel of [...indexTs.matchAll(/from "\.\/([^"]+)\.js"/g)].map((m) => m[1])) {
  if (!existsSync(join(ROOT, "dist", `${rel}.js`))) {
    fail(`dist/${rel}.js is missing though src/index.ts imports it`);
  }
}

// 3. The version the binary reports must be the version being published.
try {
  const reported = execFileSync(process.execPath, [indexJs, "--version"], {
    encoding: "utf8",
    cwd: ROOT,
  }).trim();
  if (reported !== pkg.version) {
    fail(`the built CLI reports ${reported}, but package.json says ${pkg.version}`);
  }
} catch (e) {
  fail(`could not run the built CLI: ${e?.message ?? e}`);
}

// 4. Publishing something that is not on main is how an old tree ends up
//    wearing a new version number. A warning, not a hard stop: releasing from
//    a detached checkout is occasionally deliberate.
try {
  const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  if (git(["status", "--porcelain"])) notes.push("working tree has uncommitted changes");
  const head = git(["rev-parse", "HEAD"]);
  let remote = "";
  try {
    execFileSync("git", ["fetch", "-q", "origin", "main"], { cwd: ROOT, timeout: 20000 });
    remote = git(["rev-parse", "origin/main"]);
  } catch {
    notes.push("could not reach origin — HEAD not compared against main");
  }
  if (remote && head !== remote) {
    notes.push(`HEAD ${head.slice(0, 8)} is not origin/main ${remote.slice(0, 8)}`);
  }
} catch {
  notes.push("not a git checkout — provenance not verified");
}

const label = `${pkg.name}@${pkg.version}`;
if (problems.length) {
  console.error(`\n✖ preflight failed for ${label} — not publishing\n`);
  for (const p of problems) console.error(`  · ${p}`);
  console.error("\n  Run `npm run build` on a clean checkout and try again.");
  console.error("  A wrong publish cannot be undone: the version number is spent either way.\n");
  process.exit(1);
}

console.log(`✔ preflight ${label} — ${commands.length} commands present, version consistent`);
for (const n of notes) console.log(`  ⚠ ${n}`);
