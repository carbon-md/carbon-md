import { existsSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { basename, join } from "node:path";
import * as readline from "node:readline/promises";
import { FACTORS_VERSION } from "../core/factors.js";
import { ensureLedger } from "../core/ledger.js";
import { POLICY_FILENAME } from "../core/policy.js";

interface InitOptions {
  yes: boolean;
  force: boolean;
}

interface DetectedStack {
  labels: string[];
  sources: string[];
}

function detectStack(cwd: string): DetectedStack {
  const labels: string[] = [];
  const sources: string[] = [];
  const has = (p: string) => existsSync(join(cwd, p));

  if (has("CLAUDE.md") || has(".claude")) {
    labels.push("Claude Code");
    sources.push("claude-code");
  }
  for (const f of ["litellm_config.yaml", "litellm.yaml", "proxy_config.yaml"]) {
    if (has(f)) {
      labels.push(`LiteLLM proxy (${f})`);
      sources.push("litellm");
      break;
    }
  }
  for (const f of ["pyproject.toml", "requirements.txt"]) {
    if (has(f)) {
      const content = readFileSync(join(cwd, f), "utf8").toLowerCase();
      if (content.includes("langgraph")) {
        labels.push("LangGraph");
        sources.push("langgraph");
      }
      if (content.includes("crewai")) {
        labels.push("CrewAI");
        sources.push("crewai");
      }
      if (content.includes("ecologits")) labels.push("EcoLogits (already installed 🎉)");
      break;
    }
  }
  if (has("package.json")) {
    try {
      const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const aiDeps = ["openai", "@anthropic-ai/sdk", "ai", "@ai-sdk/openai", "langchain"].filter(
        (d) => deps?.[d]
      );
      if (aiDeps.length) {
        labels.push(`JS AI SDKs (${aiDeps.join(", ")})`);
        sources.push("js-sdk");
      }
    } catch {
      /* unreadable package.json is fine */
    }
  }
  return { labels, sources };
}

function projectName(cwd: string): string {
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8"));
    if (typeof pkg.name === "string" && pkg.name) return pkg.name;
  } catch {
    /* fall through */
  }
  return basename(cwd);
}

function policyTemplate(opts: {
  name: string;
  target: number;
  portfolio: string;
  budget: number;
  approval: number;
  publicLedger: boolean;
}): string {
  return `---
carbon_md: "0.1"
policy:
  contribution_target: ${opts.target.toFixed(2)}
  portfolio: ${opts.portfolio}
  monthly_budget_max: { amount: ${opts.budget}, currency: USD }
  approval_above: { amount: ${opts.approval}, currency: USD }
reporting:
  mode: local
  public_ledger: ${opts.publicLedger}
methodology: ${FACTORS_VERSION}
---

# Carbon Policy — ${opts.name}

This project's agents measure their inference emissions and fund verified
carbon-removal contributions per the policy above.

- Estimates use versioned open factors (\`${FACTORS_VERSION}\`) and are
  shown as ranges — they are estimates, not measurements.
- Contributions are aggregated monthly; orders above the approval
  threshold require human confirmation.
- This project does **not** claim carbon neutrality. It measures, reduces
  where it can, and contributes to verified carbon removal.

Managed with [carbon-md](https://github.com/carbon-md/carbon-md) — \`npx carbon-md status\`
`;
}

export async function cmdInit(cwd: string, argv: string[]): Promise<number> {
  const opts: InitOptions = {
    yes: argv.includes("--yes") || argv.includes("-y"),
    force: argv.includes("--force"),
  };

  const target = join(cwd, POLICY_FILENAME);
  if (existsSync(target) && !opts.force) {
    console.error(`✖ ${POLICY_FILENAME} already exists. Use --force to overwrite.`);
    return 1;
  }

  console.log("\ncarbon.md init — carbon governance for your agents\n");

  const detected = detectStack(cwd);
  if (detected.labels.length) {
    console.log("Detected stack:");
    for (const l of detected.labels) console.log(`  • ${l}`);
  } else {
    console.log("No known agent stack detected — that's fine, the policy file works anywhere.");
  }
  console.log("");

  let targetPct = 1.1;
  let portfolio = "removal-weighted";
  let budget = 25;
  let approval = 10;
  let publicLedger = true;

  if (!opts.yes) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = async (q: string, def: string) => {
      const a = (await rl.question(`${q} [${def}]: `)).trim();
      return a || def;
    };
    targetPct = parseFloat(await ask("Contribution target (1.0 = 100%, 1.1 = 110%)", "1.1"));
    portfolio = await ask("Portfolio (removal-weighted / balanced / custom)", "removal-weighted");
    budget = parseFloat(await ask("Monthly budget cap (USD)", "25"));
    approval = parseFloat(await ask("Human approval required above (USD)", "10"));
    publicLedger = (await ask("Publish a public ledger? (true/false)", "true")) === "true";
    rl.close();
    if (!Number.isFinite(targetPct) || !Number.isFinite(budget) || !Number.isFinite(approval)) {
      console.error("✖ Numeric answers required for target/budget/approval.");
      return 1;
    }
  }

  writeFileSync(
    target,
    policyTemplate({
      name: projectName(cwd),
      target: targetPct,
      portfolio,
      budget,
      approval,
      publicLedger,
    }),
    "utf8"
  );
  ensureLedger(cwd);

  // keep the local ledger out of version control
  const gitignore = join(cwd, ".gitignore");
  const ignoreLine = ".carbon-md/";
  if (existsSync(gitignore)) {
    const content = readFileSync(gitignore, "utf8");
    if (!content.split(/\r?\n/).includes(ignoreLine)) {
      appendFileSync(gitignore, `\n${ignoreLine}\n`);
    }
  } else {
    writeFileSync(gitignore, `${ignoreLine}\n`, "utf8");
  }

  console.log(`✔ Wrote ${POLICY_FILENAME} (policy) and .carbon-md/ (local ledger)\n`);
  console.log("Next steps:");
  console.log("  1. Wire usage capture:");
  if (detected.sources.includes("litellm")) {
    console.log("     LiteLLM: log usage to JSONL, then `npx carbon-md ingest <file>`");
  }
  if (detected.sources.includes("claude-code")) {
    console.log("     Claude Code: export token usage (OTel/transcripts) → `carbon-md ingest`");
  }
  console.log("     Generic: pipe {model, tokens_in, tokens_out} JSONL into `carbon-md ingest -`");
  console.log("  2. `npx carbon-md status`      — see your footprint (with uncertainty)");
  console.log("  3. `npx carbon-md contribute`  — prepare the monthly contribution\n");
  return 0;
}
