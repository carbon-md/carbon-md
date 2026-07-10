import { createWallet, loadWallet, usdcBalance, walletPath } from "../core/wallet.js";
import { findPolicyPath } from "../core/policy.js";

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;

export async function cmdWallet(cwd: string, argv: string[]): Promise<number> {
  if (!findPolicyPath(cwd)) {
    console.error("✖ No carbon.md here. Run `npx carbon-md init` first.");
    return 1;
  }

  if (argv[0] === "init") {
    if (loadWallet(cwd)) {
      console.error(`✖ Wallet already exists at ${walletPath(cwd)} — refusing to overwrite.`);
      return 1;
    }
    const w = createWallet(cwd);
    console.log(green("✔ Agent wallet created (Base)"));
    console.log(`  address  ${bold(w.address)}`);
    console.log(`  key file ${walletPath(cwd)}`);
    console.log(dim("  Fund it with USDC on Base (small amounts — its balance is the blast radius)."));
    console.log(dim("  Back the key file up privately. Never commit it; .carbon-md/ is gitignored."));
    return 0;
  }

  const w = loadWallet(cwd);
  if (!w) {
    console.error("✖ No agent wallet. Create one with `carbon-md wallet init`.");
    return 1;
  }
  console.log(`\n${bold("Agent wallet")} ${dim("(Base · x402 retirements only)")}`);
  console.log(`  address  ${w.address}`);
  try {
    const bal = await usdcBalance(w.address as `0x${string}`);
    console.log(`  USDC     ${bold(bal.formatted)}`);
  } catch (e: any) {
    console.log(dim(`  USDC     balance unavailable (${e?.message ?? e})`));
  }
  console.log(dim(`  key file ${walletPath(cwd)}\n`));
  return 0;
}
