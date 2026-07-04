import { PORTFOLIO_PRICES } from "../core/factors.js";
import { aggregate, appendEvents, readLedger } from "../core/ledger.js";
import { findPolicyPath, parsePolicy } from "../core/policy.js";

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;

function getFlag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

/**
 * v0.1 flow (confirm-first, semi-manual by design):
 *   carbon-md contribute
 *       → computes outstanding tonnes, prints the order summary + rail links.
 *   carbon-md contribute --record --tonnes 0.05 --cost 3.10 --rail cnaught --receipt <url>
 *       → records an executed retirement in the ledger.
 * Automated API purchasing lands in v0.2 — the human stays in the loop here,
 * exactly as the spec's approval rules intend.
 */
export async function cmdContribute(cwd: string, argv: string[]): Promise<number> {
  const policyPath = findPolicyPath(cwd);
  if (!policyPath) {
    console.error("✖ No carbon.md here. Run `npx carbon-md init` first.");
    return 1;
  }
  const policy = parsePolicy(policyPath);

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
  console.log(bold("Execute on a rail (v0.1 is confirm-first by design):"));
  console.log("  CNaught     https://www.cnaught.com  (curated portfolios, fiat, simple)");
  console.log("  Carbonmark  https://www.carbonmark.com  (fractional on-chain retirement, public certificate)");
  console.log("");
  console.log("Then record it:");
  console.log(
    dim(`  npx carbon-md contribute --record --tonnes ${outstanding.toFixed(4)} --cost <paid> --rail cnaught --receipt <url>`)
  );
  console.log("");
  return 0;
}
