#!/usr/bin/env node
import { cmdContribute } from "./commands/contribute.js";
import { cmdExport } from "./commands/export.js";
import { cmdIngest } from "./commands/ingest.js";
import { cmdInit } from "./commands/init.js";
import { cmdStatus } from "./commands/status.js";
import { cmdSync } from "./commands/sync-claude.js";
import { readFileSync } from "node:fs";
import { CLASS_FACTORS, FACTORS_VERSION, INPUT_TOKEN_WEIGHT } from "./core/factors.js";

const VERSION: string = (() => {
  try {
    return JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
  } catch {
    return "unknown";
  }
})();

const HELP = `
carbon-md ${VERSION} — carbon governance for AI agents (spec v0.1)

Usage:
  npx carbon-md init [--yes] [--force]   Write carbon.md policy + local ledger
  npx carbon-md sync claude-code [--all | --dir <path>] [--dry-run]
                                         Sync usage from Claude Code transcripts
  npx carbon-md ingest <file|-> [--source <label>]
                                         Ingest usage reports (JSONL) or OTLP/JSON metrics
  npx carbon-md status                   Footprint + contribution position (with uncertainty)
  npx carbon-md contribute               Prepare the monthly contribution order
  npx carbon-md contribute --record --tonnes <t> --cost <amt> [--rail <r>] [--receipt <url>]
                                         Record an executed retirement
  npx carbon-md export [--out <dir>]     Build a public ledger page + badge.svg + ledger.json
  npx carbon-md factors                  Show the emission-factor table
  npx carbon-md help                     This help

Docs & spec: https://github.com/carbon-md/carbon-md
`;

function cmdFactors(): number {
  console.log(`\n${FACTORS_VERSION}`);
  console.log(`gCO2e per 1k output tokens (input tokens weighted ${INPUT_TOKEN_WEIGHT}x)\n`);
  console.log("  class      low      central  high");
  for (const [cls, f] of Object.entries(CLASS_FACTORS)) {
    console.log(
      `  ${cls.padEnd(10)} ${String(f.low).padEnd(8)} ${String(f.central).padEnd(8)} ${f.high}`
    );
  }
  console.log("\nEstimates, not measurements. Derived from EcoLogits methodology +");
  console.log("public provider disclosures; world-average grid intensity assumption.");
  console.log("Only comparable within the same factors version.\n");
  return 0;
}

async function main(): Promise<number> {
  const [, , cmd, ...rest] = process.argv;
  const cwd = process.cwd();
  switch (cmd) {
    case "init":
      return cmdInit(cwd, rest);
    case "sync":
      return cmdSync(cwd, rest);
    case "ingest":
      return cmdIngest(cwd, rest);
    case "status":
      return cmdStatus(cwd);
    case "contribute":
      return cmdContribute(cwd, rest);
    case "export":
      return cmdExport(cwd, rest);
    case "factors":
      return cmdFactors();
    case "--version":
    case "-v":
      console.log(VERSION);
      return 0;
    case "help":
    case "--help":
    case "-h":
    case undefined:
      console.log(HELP);
      return 0;
    default:
      console.error(`Unknown command: ${cmd}`);
      console.log(HELP);
      return 1;
  }
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`✖ ${err?.message ?? err}`);
    process.exit(1);
  }
);
