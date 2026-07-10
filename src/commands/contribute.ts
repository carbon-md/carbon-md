import * as readline from "node:readline/promises";
import { PORTFOLIO_PRICES } from "../core/factors.js";
import { aggregate, appendEvents, readLedger, type ContributionEvent } from "../core/ledger.js";
import { findPolicyPath, parsePolicy, type CarbonPolicy } from "../core/policy.js";
import { accountFor, loadWallet, usdcBalance } from "../core/wallet.js";
import { certificate, quote as x402quote, resolveClass, retire } from "../rails/x402.js";

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;

function getFlag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

/**
 * Flows:
 *   carbon-md contribute
 *       → outstanding tonnes + order summary (read-only).
 *   carbon-md contribute --record --tonnes … --cost … [--rail …] [--receipt …]
 *       → record an externally-executed retirement.
 *   carbon-md contribute --execute [--rail x402] [--class oae] [--tonnes …]
 *                        [--beneficiary "name"] [--beneficiary-address 0x…] [--message "…"]
 *       → v0.2: execute a retirement through the Klima x402 relay, policy-checked:
 *         hard stop at monthly_budget_max, typed confirmation above approval_above.
 *         Retirements are IRREVERSIBLE — the human confirms in the loop.
 */
export async function cmdContribute(cwd: string, argv: string[]): Promise<number> {
  const policyPath = findPolicyPath(cwd);
  if (!policyPath) {
    console.error("✖ No carbon.md here. Run `npx carbon-md init` first.");
    return 1;
  }
  const policy = parsePolicy(policyPath);

  if (argv.includes("--execute")) {
    return executeX402(cwd, argv, policy);
  }

  if (argv.includes("--record")) {
    const tonnes = parseFloat(getFlag(argv, "--tonnes") ?? "");
    const cost = parseFloat(getFlag(argv, "--cost") ?? "");
    const rail = getFlag(argv, "--rail") ?? "manual";
    const receipt = getFlag(argv, "--receipt") ?? "";
    if (!Number.isFinite(tonnes) || tonnes <= 0 || !Number.isFinite(cost)) {
      console.error(
        "Usage: carbon-md contribute --record --tonnes <t> --cost <amount> [--rail cnaught|carbonmark|manual] [--receipt <url>]"
      );
      return 1;
    }
    appendEvents(cwd, [
      {
        type: "contribution",
        ts: new Date().toISOString(),
        tonnes,
        cost,
        currency: policy.policy.monthly_budget_max.currency,
        rail,
        receipt,
      },
    ]);
    console.log(`✔ Recorded contribution: ${tonnes} tCO2e · ${cost} ${policy.policy.monthly_budget_max.currency} via ${rail}`);
    if (!receipt) console.log(dim("  tip: add --receipt <url> so the ledger stays provable."));
    return 0;
  }

  const all = aggregate(readLedger(cwd));
  const targetTonnes = (all.usage.central / 1_000_000) * policy.policy.contribution_target;
  const outstanding = Math.max(0, targetTonnes - all.contributedTonnes);

  console.log("");
  console.log(bold("Contribution order — summary"));
  if (outstanding <= 0) {
    console.log("✔ Nothing outstanding. Your policy target is currently met.\n");
    return 0;
  }

  const prices = PORTFOLIO_PRICES[policy.policy.portfolio];
  console.log(`  outstanding   ${outstanding.toFixed(4)} tCO2e (${(policy.policy.contribution_target * 100).toFixed(0)}% of central estimate)`);
  console.log(`  portfolio     ${policy.policy.portfolio}`);
  let central = NaN;
  if (prices) {
    central = outstanding * prices.central;
    console.log(
      `  est. cost     $${(outstanding * prices.low).toFixed(2)} – $${(outstanding * prices.high).toFixed(2)} ` +
        dim(`(central ~$${central.toFixed(2)})`)
    );
  } else {
    console.log(`  est. cost     ${dim("custom portfolio — set your own price basis")}`);
  }

  const approval = policy.policy.approval_above;
  const budget = policy.policy.monthly_budget_max;
  if (Number.isFinite(central) && central > budget.amount) {
    console.log(yellow(`  ⚠ exceeds monthly_budget_max (${budget.amount} ${budget.currency}) — order capped by policy; carry the rest forward`));
  } else if (Number.isFinite(central) && central > approval.amount) {
    console.log(yellow(`  ⚠ above approval threshold (${approval.amount} ${approval.currency}) — human confirmation required (that's you)`));
  } else {
    console.log(dim(`  below approval threshold (${approval.amount} ${approval.currency}) — eligible for auto-execution in v0.2`));
  }

  console.log("");
  console.log(bold("Execute:"));
  console.log(
    `  ${green("carbon-md contribute --execute --class oae")}  ${dim("— retire via Klima x402 relay (policy-checked, confirm-first)")}`
  );
  console.log(dim("  or retire externally, then: carbon-md contribute --record --tonnes … --cost … --receipt <url>"));
  console.log("");
  return 0;
}

async function executeX402(cwd: string, argv: string[], policy: CarbonPolicy): Promise<number> {
  const wallet = loadWallet(cwd);
  if (!wallet) {
    console.error("✖ No agent wallet. Create one with `carbon-md wallet init`, fund it with USDC on Base.");
    return 1;
  }

  const events = readLedger(cwd);
  const all = aggregate(events);
  const targetTonnes = (all.usage.central / 1_000_000) * policy.policy.contribution_target;
  const outstanding = Math.max(0, targetTonnes - all.contributedTonnes);

  const tonnesArg = getFlag(argv, "--tonnes");
  const tonnes = tonnesArg ?? Math.max(0.001, Math.ceil(outstanding * 1000) / 1000).toFixed(3);
  const classArg = getFlag(argv, "--class") ?? "oae";
  const beneficiary = getFlag(argv, "--beneficiary") ?? "carbon.md - Agentic Realism";
  const beneficiaryAddress = getFlag(argv, "--beneficiary-address");
  const message =
    getFlag(argv, "--message") ??
    "Emissions matched under a carbon.md policy - github.com/carbon-md/carbon-md";

  console.log(dim("\nresolving carbon class + live quote (read-only)…"));
  const cls = await resolveClass(classArg);
  const q = await x402quote(cls.carbonClassId, tonnes);
  const total = parseFloat(q.totalFormatted);

  // Policy enforcement — the whole point of the file.
  const budget = policy.policy.monthly_budget_max;
  const approval = policy.policy.approval_above;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const spentThisMonth = events
    .filter((e): e is ContributionEvent => e.type === "contribution" && new Date(e.ts) >= monthStart)
    .reduce((s, c) => s + c.cost, 0);

  console.log(`\n${bold("Retirement order — Klima x402 relay (Base)")}`);
  console.log(`  class        ${cls.name}`);
  console.log(`  amount       ${q.tonnesFormatted} tCO₂e`);
  console.log(`  quote        ${q.humanSummary}`);
  console.log(`  beneficiary  ${beneficiary}${beneficiaryAddress ? dim(" · " + beneficiaryAddress) : ""}`);
  console.log(`  message      ${dim(message)}`);
  console.log(`  wallet       ${wallet.address}`);
  try {
    const bal = await usdcBalance(wallet.address as `0x${string}`);
    const suggested = parseFloat(q.suggestedMaxInputFormatted);
    console.log(`  balance      ${bal.formatted} USDC`);
    if (parseFloat(bal.formatted) < suggested) {
      console.error(
        `\n✖ Insufficient USDC: need ~${q.suggestedMaxInputFormatted} (incl. slippage buffer), have ${bal.formatted}.`
      );
      return 1;
    }
  } catch {
    console.log(dim("  balance      (unavailable — proceeding on quote only)"));
  }

  if (spentThisMonth + total > budget.amount) {
    console.error(
      `\n✖ POLICY STOP: this order (${total.toFixed(2)}) + spent this month (${spentThisMonth.toFixed(2)}) exceeds monthly_budget_max (${budget.amount} ${budget.currency}).`
    );
    console.error("  Raise the cap in carbon.md (a human decision, in the file) or reduce the amount.");
    return 1;
  }

  const needsApproval = total > approval.amount;
  console.log("");
  if (needsApproval) {
    console.log(yellow(`⚠ ${total.toFixed(2)} USDC is above approval_above (${approval.amount} ${approval.currency}) — human confirmation required.`));
  }
  console.log(yellow("⚠ Retirement is IRREVERSIBLE — the credit is permanently burned."));
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(`Type ${bold("retire")} to execute, anything else to abort: `)).trim();
  rl.close();
  if (answer !== "retire") {
    console.log("Aborted — nothing signed, nothing spent.");
    return 1;
  }

  console.log(dim("\nprepare-auth → signing USDC authorization → relay…"));
  const result = await retire(accountFor(wallet), cls.carbonClassId, tonnes, {
    beneficiaryString: beneficiary,
    beneficiaryAddress,
    retirementMessage: message,
  });

  let urls = result.certificateUrls;
  if (!urls.length && result.txHash) {
    for (let i = 0; i < 6 && !urls.length; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        urls = await certificate(result.txHash);
      } catch {
        /* subgraph indexing lag — keep polling */
      }
    }
  }

  const receipt = urls[0] ?? (result.txHash ? `https://basescan.org/tx/${result.txHash}` : "");
  appendEvents(cwd, [
    {
      type: "contribution",
      ts: new Date().toISOString(),
      tonnes: parseFloat(q.tonnesFormatted),
      cost: total,
      currency: "USDC",
      rail: "x402-klima",
      receipt,
    },
  ]);

  console.log(`\n${green("✔ Retired " + q.tonnesFormatted + " tCO₂e")} (${result.status})`);
  if (result.txHash) console.log(`  tx           https://basescan.org/tx/${result.txHash}`);
  if (urls.length) console.log(`  certificate  ${bold(urls[0])}`);
  else console.log(dim("  certificate  still indexing — run: carbon-md contribute --certificate " + (result.txHash ?? "")));
  console.log(dim("  recorded in the ledger — regenerate the public page with `carbon-md export`\n"));
  return 0;
}
