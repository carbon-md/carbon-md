import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { generatePrivateKey, privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { base } from "viem/chains";
import { LEDGER_DIR } from "./ledger.js";

/**
 * The agent wallet: a dedicated, prepaid EOA on Base used ONLY for
 * carbon retirements. Blast radius = its balance, by design — fund it
 * with what your carbon policy allows and nothing more.
 */

export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
export const BASE_RPC = "https://mainnet.base.org";

export interface WalletFile {
  address: string;
  privateKey: `0x${string}`;
  chain: string;
  chainId: number;
  createdAt: string;
  purpose: string;
}

export function walletPath(cwd: string): string {
  return join(cwd, LEDGER_DIR, "agent-wallet.json");
}

export function loadWallet(cwd: string): WalletFile | null {
  const p = walletPath(cwd);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

export function createWallet(cwd: string): WalletFile {
  const pk = generatePrivateKey();
  const account = privateKeyToAccount(pk);
  const data: WalletFile = {
    address: account.address,
    privateKey: pk,
    chain: "base",
    chainId: 8453,
    createdAt: new Date().toISOString(),
    purpose: "carbon.md agent wallet — x402 retirements only",
  };
  writeFileSync(walletPath(cwd), JSON.stringify(data, null, 2), { mode: 0o600 });
  return data;
}

export function accountFor(w: WalletFile): PrivateKeyAccount {
  return privateKeyToAccount(w.privateKey);
}

export async function usdcBalance(address: `0x${string}`): Promise<{ atomic: bigint; formatted: string }> {
  const client = createPublicClient({ chain: base, transport: http(BASE_RPC) });
  const atomic = await client.readContract({
    address: USDC_BASE,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });
  return { atomic, formatted: formatUnits(atomic, 6) };
}
