import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Range } from "./factors.js";

export const LEDGER_DIR = ".carbon-md";
export const LEDGER_FILE = "ledger.jsonl";

export interface UsageEvent {
  type: "usage";
  ts: string;
  source: string;
  provider?: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  gco2e: Range;
  model_class: string;
  factors: string;
  /** extra source-specific data kept for future factor revisions (e.g. cache reads) */
  meta?: Record<string, unknown>;
}

export interface ContributionEvent {
  type: "contribution";
  ts: string;
  tonnes: number;
  cost: number;
  currency: string;
  rail: string;
  receipt: string;
}

export type LedgerEvent = UsageEvent | ContributionEvent;

export function ledgerPath(cwd: string): string {
  return join(cwd, LEDGER_DIR, LEDGER_FILE);
}

export function ensureLedger(cwd: string): string {
  const dir = join(cwd, LEDGER_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const path = ledgerPath(cwd);
  if (!existsSync(path)) appendFileSync(path, "");
  return path;
}

export function appendEvents(cwd: string, events: LedgerEvent[]): void {
  ensureLedger(cwd);
  const lines = events.map((e) => JSON.stringify(e)).join("\n") + "\n";
  appendFileSync(ledgerPath(cwd), lines, "utf8");
}

export function readLedger(cwd: string): LedgerEvent[] {
  const path = ledgerPath(cwd);
  if (!existsSync(path)) return [];
  const out: LedgerEvent[] = [];
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed));
    } catch {
      // skip corrupt lines rather than dying on the whole ledger
    }
  }
  return out;
}

export interface Totals {
  usage: { low: number; central: number; high: number; calls: number; tokens: number };
  byModel: Map<string, { central: number; calls: number }>;
  contributedTonnes: number;
  contributedCost: Map<string, number>; // currency -> amount
}

export function aggregate(events: LedgerEvent[], since?: Date): Totals {
  const t: Totals = {
    usage: { low: 0, central: 0, high: 0, calls: 0, tokens: 0 },
    byModel: new Map(),
    contributedTonnes: 0,
    contributedCost: new Map(),
  };
  for (const e of events) {
    if (since && new Date(e.ts) < since) continue;
    if (e.type === "usage") {
      t.usage.low += e.gco2e.low;
      t.usage.central += e.gco2e.central;
      t.usage.high += e.gco2e.high;
      t.usage.calls += 1;
      t.usage.tokens += e.tokens_in + e.tokens_out;
      const m = t.byModel.get(e.model) ?? { central: 0, calls: 0 };
      m.central += e.gco2e.central;
      m.calls += 1;
      t.byModel.set(e.model, m);
    } else if (e.type === "contribution") {
      t.contributedTonnes += e.tonnes;
      t.contributedCost.set(e.currency, (t.contributedCost.get(e.currency) ?? 0) + e.cost);
    }
  }
  return t;
}
