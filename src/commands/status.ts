import { formatG, PORTFOLIO_PRICES } from "../core/factors.js";
import { aggregate, readLedger } from "../core/ledger.js";
import { findPolicyPath, parsePolicy } from "../core/policy.js";

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;

export async function cmdStatus(cwd: string): Promise<number> {
  const policyPath = findPolicyPath(cwd);
  if (!policyPath) {
    console.error("✖ No carbon.md here. Run `npx carbon-md init` first.");
    return 1;
  }
  const policy = parsePolicy(policyPath);
  const events = readLedger(cwd);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const all = aggregate(events);
  const month = aggregate(events, monthStart);

  console.log("");
  console.log(bold("carbon.md status"));
  console.log(dim(`policy: ${policyPath} · methodology: ${policy.methodology}`));
  console.log("");

  const line = (label: string, t: typeof all) => {
    console.log(
      `${label.padEnd(12)} ${bold(formatG(t.usage.central))} ` +
        dim(`(range ${formatG(t.usage.low)} – ${formatG(t.usage.high)})`) +
        dim(` · ${t.usage.calls} calls · ${t.usage.tokens.toLocaleString()} tokens`)
    );
  };
  line("This month", month);
  line("All time", all);

  if (all.byModel.size) {
    console.log("");
    console.log(dim("By model (central estimate):"));
    const sorted = [...all.byModel.entries()].sort((a, b) => b[1].central - a[1].central);
    for (const [model, m] of sorted.slice(0, 6)) {
      console.log(`  ${model.padEnd(36)} ${formatG(m.central).padStart(12)} ${dim(`${m.calls} calls`)}`);
    }
  }

  // Contribution position (all-time)
  const targetTonnes = (all.usage.central / 1_000_000) * policy.policy.contribution_target;
  const outstanding = Math.max(0, targetTonnes - all.contributedTonnes);
  const prices = PORTFOLIO_PRICES[policy.policy.portfolio] ?? null;

  console.log("");
  console.log(bold("Contribution position"));
  console.log(
    `  target      ${(policy.policy.contribution_target * 100).toFixed(0)}% of estimated emissions → ${targetTonnes.toFixed(4)} tCO2e`
  );
  console.log(`  contributed ${all.contributedTonnes.toFixed(4)} tCO2e`);
  if (outstanding > 0) {
    let costNote = "";
    if (prices) {
      const est = outstanding * prices.central;
      costNote = dim(
        ` (~$${est.toFixed(2)} at ${policy.policy.portfolio} central price $${prices.central}/t)`
      );
    }
    console.log(yellow(`  outstanding ${outstanding.toFixed(4)} tCO2e${costNote}`));
    console.log(dim("  → run `npx carbon-md contribute` to prepare the order"));
  } else {
    console.log(green(`  ✔ policy target met — nothing outstanding`));
  }
  console.log("");
  console.log(dim("Estimates, not measurements — ranges are wide by design."));
  console.log("");
  return 0;
}
