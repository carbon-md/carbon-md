import type { PrivateKeyAccount } from "viem/accounts";
import type { CreditMethod } from "../core/ledger.js";
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

/**
 * Pinned to the v0 major version on Carbonmark engineering's advice (Peter
 * Sparacino, 30 Jul 2026): the bare host `x402.klimalabs.com/api` always
 * redirects to the LATEST major, so it will silently become v1 on release and
 * break this client. Each major keeps a stable prefixed host, deprecated only
 * with notice. Bump this deliberately, after testing against the new major.
 */
const API = "https://v0.x402.klimalabs.com/api";
const CHAIN_ID = 8453;

/** Class used when the caller doesn't name one: the cheapest durable removal
 *  purchasable in sub-tonne amounts today. */
export const DEFAULT_CLASS = "oae";

async function call(
  action: string,
  params: Record<string, unknown>,
  timeoutMs?: number
): Promise<any> {
  const res = await fetch(API, {
    method: "POST",
    // No keep-alive: a pooled socket would outlive the command and keep the
    // CLI's event loop open after the work is done.
    headers: { "content-type": "application/json", connection: "close" },
    body: JSON.stringify({ action, ...params }),
    signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
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

let discoverCache: CarbonClass[] | undefined;

export async function discover(timeoutMs?: number): Promise<CarbonClass[]> {
  if (discoverCache) return discoverCache;
  const r = await call("discover", {}, timeoutMs);
  discoverCache = r.carbonClasses ?? r.classes ?? [];
  return discoverCache!;
}

/** Resolve a class by fuzzy name (e.g. "oae", "biochar", "forest") or exact 0x id. */
export async function resolveClass(nameOrId: string, timeoutMs?: number): Promise<CarbonClass> {
  if (nameOrId.startsWith("0x")) return { carbonClassId: nameOrId, name: nameOrId };
  const classes = await discover(timeoutMs);
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

/**
 * Removal or avoidance, from what the rail says it is selling.
 *
 * Deliberately conservative: anything unrecognised returns "unspecified" rather
 * than being guessed into the removal column, because that column carries the
 * project's entire claim. Avoidance is tested first on purpose — "avoided
 * deforestation" contains "forest" and must not read as a forestry removal.
 */
export function classifyMethod(cls: CarbonClass): CreditMethod {
  const hay = `${cls.category ?? ""} ${cls.name ?? ""}`.toLowerCase();
  const avoidance = [
    "avoided", "redd", "wind", "solar", "hydro", "geothermal", "efficiency",
    "cookstove", "landfill", "methane", "fuel switch", "waste",
  ];
  const removal = [
    "removal", "biochar", "blue carbon", "ocean", "alkalinity", "forest",
    "afforest", "reforest", "mangrove", "soil", "direct air", "dac",
    "enhanced weathering", "olivine",
  ];
  if (avoidance.some((k) => hay.includes(k))) return "avoidance";
  if (removal.some((k) => hay.includes(k))) return "removal";
  return "unspecified";
}

/** The classes a removal-only policy is allowed to buy. */
export async function removalClasses(timeoutMs?: number): Promise<CarbonClass[]> {
  return (await discover(timeoutMs)).filter((c) => classifyMethod(c) === "removal");
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

export async function quote(
  carbonClass: string,
  tonnes: string,
  timeoutMs?: number
): Promise<Quote> {
  return call(
    "quote",
    {
      chainId: CHAIN_ID,
      inputToken: USDC_BASE,
      carbonClass,
      amount: tonnes,
    },
    timeoutMs
  );
}

export interface LivePrice {
  className: string;
  /** The amount actually quoted — may exceed the request, see MIN_TONNES. */
  tonnes: number;
  totalUsdc: number;
  usdcPerTonne: number;
}

/** Smallest retirement the rail accepts, anywhere: 1 kg. */
export const MIN_TONNES = 0.001;

/**
 * What the outstanding balance really costs, right now — read-only, no wallet,
 * no signature. Rounds up to the nearest kilo because the rail can't retire
 * finer than that; callers should say so when the rounding bites.
 */
export async function priceFor(
  nameOrId: string,
  tonnes: number,
  timeoutMs = 6000
): Promise<LivePrice> {
  const retirable = Math.max(MIN_TONNES, Math.ceil(tonnes * 1000) / 1000);
  const cls = await resolveClass(nameOrId, timeoutMs);
  const q = await quote(cls.carbonClassId, retirable.toFixed(3), timeoutMs);
  const total = parseFloat(q.totalFormatted);
  const quoted = parseFloat(q.tonnesFormatted);
  return {
    className: cls.name,
    tonnes: quoted,
    totalUsdc: total,
    usdcPerTonne: total / quoted,
  };
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
