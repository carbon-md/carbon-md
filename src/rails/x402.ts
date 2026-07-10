import type { PrivateKeyAccount } from "viem/accounts";
import { USDC_BASE } from "../core/wallet.js";

/**
 * Klima x402 endpoint client — the carbon.md reference retirement rail.
 * https://www.klimalabs.com/x402-endpoint
 *
 * Relay ("paid retire") path: the agent wallet signs ONE standard EIP-712
 * USDC TransferWithAuthorization; a Klima executor submits the retirement
 * on-chain and is reimbursed for gas from the signed budget. The wallet
 * needs USDC only — no ETH, no prior approval, no Base Account.
 *
 * Retirements are IRREVERSIBLE. Callers must enforce carbon.md policy
 * (approval_above, monthly_budget_max) BEFORE invoking retire().
 */

const API = "https://x402.klimalabs.com/api";
const CHAIN_ID = 8453;

async function call(action: string, params: Record<string, unknown>): Promise<any> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 402) {
    const msg = body?.message ?? body?.error ?? `HTTP ${res.status}`;
    throw new Error(`x402 ${action}: ${msg}${body?.issues ? " — " + JSON.stringify(body.issues) : ""}`);
  }
  return body;
}

export interface CarbonClass {
  carbonClassId: string;
  name: string;
  category?: string;
  priceUsdcPerTonneFormatted?: string;
  minRetirementTonnesFormatted?: string;
}

export async function discover(): Promise<CarbonClass[]> {
  const r = await call("discover", {});
  return r.carbonClasses ?? r.classes ?? [];
}

/** Resolve a class by fuzzy name (e.g. "oae", "biochar", "forest") or exact 0x id. */
export async function resolveClass(nameOrId: string): Promise<CarbonClass> {
  if (nameOrId.startsWith("0x")) return { carbonClassId: nameOrId, name: nameOrId };
  const classes = await discover();
  const q = nameOrId.toLowerCase();
  const aliases: Record<string, string> = {
    oae: "ocean alkalinity",
    ocean: "ocean alkalinity",
    biochar: "biochar",
    forest: "forest",
    regen: "regen",
  };
  const needle = aliases[q] ?? q;
  const hit = classes.find((c) => c.name?.toLowerCase().includes(needle));
  if (!hit) {
    throw new Error(
      `No carbon class matching "${nameOrId}". Available: ${classes.map((c) => c.name).join(" · ")}`
    );
  }
  return hit;
}

export interface Quote {
  tonnesFormatted: string;
  retirementPriceFormatted: string;
  feeFormatted: string;
  totalFormatted: string;
  suggestedMaxInputFormatted: string;
  humanSummary: string;
  resolvedCredit?: { creditToken: string; tokenId: number; vintage: number };
}

export async function quote(carbonClass: string, tonnes: string): Promise<Quote> {
  return call("quote", {
    chainId: CHAIN_ID,
    inputToken: USDC_BASE,
    carbonClass,
    amount: tonnes,
  });
}

export interface RetirementDetails {
  beneficiaryAddress?: string;
  beneficiaryString: string;
  retirementMessage: string;
  retiringEntityString?: string;
}

export interface RetireResult {
  status: string;
  txHash?: string;
  certificateUrls: string[];
  raw: any;
}

/**
 * Relay retirement: prepare-auth → sign typed data → actions/retire.
 * The ONLY signature is the USDC transfer authorization.
 */
export async function retire(
  account: PrivateKeyAccount,
  carbonClass: string,
  tonnes: string,
  details: RetirementDetails
): Promise<RetireResult> {
  const prep = await call("prepare-auth", {
    chainId: CHAIN_ID,
    inputToken: USDC_BASE,
    carbonClass,
    amount: tonnes,
    from: account.address,
    details,
  });
  const typedData = prep.typedData;
  const request = prep.actionsRetireRequest;
  if (!typedData || !request) {
    throw new Error(`x402 prepare-auth: unexpected response — ${JSON.stringify(prep).slice(0, 300)}`);
  }

  // viem wants types without the EIP712Domain entry
  const { EIP712Domain: _drop, ...types } = typedData.types ?? {};
  const signature = await account.signTypedData({
    domain: typedData.domain,
    types,
    primaryType: typedData.primaryType,
    message: typedData.message,
  });

  const result = await call("actions/retire", { ...request, signature });
  const txHash: string | undefined =
    result.transactionHash ?? result.txHash ?? result.retirements?.[0]?.transactionHash;
  const urls: string[] = (result.retirements ?? [])
    .map((r: any) => r.certificateUrl)
    .filter(Boolean);
  return { status: result.status ?? "unknown", txHash, certificateUrls: urls, raw: result };
}

export async function certificate(txHash: string): Promise<string[]> {
  const r = await call("certificate", { txHash });
  return (r.retirements ?? []).map((x: any) => x.certificateUrl).filter(Boolean);
}
