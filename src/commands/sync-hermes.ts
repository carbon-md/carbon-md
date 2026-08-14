import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
import { estimateGco2e, FACTORS_VERSION, formatG } from "../core/factors.js";
import { appendEvents, LEDGER_DIR, type UsageEvent } from "../core/ledger.js";
import { findPolicyPath } from "../core/policy.js";

export interface HermesRow {
  session_id: string;
  model: string;
  billing_provider: string;
  input_tokens: number;
  output_tokens: number;
  reasoning_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  api_call_count: number;
  last_seen: number;
  first_seen: number;
}

export interface HermesSessionState {
  input_tokens: number;
  output_tokens: number;
  reasoning_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  last_seen: number;
}

export interface HermesSyncState {
  db_path: string;
  sessions: Record<string, HermesSessionState>;
}

export function readHermesRows(dbPath: string): HermesRow[] {
  if (!existsSync(dbPath)) {
    throw new Error(`Hermes database file not found at: ${dbPath}`);
  }

  // 1. Try node:sqlite if available in runtime environment
  try {
    const { DatabaseSync } = require("node:sqlite");
    const db = new DatabaseSync(dbPath, { readOnly: true });
    const stmt = db.prepare(`
      SELECT 
        session_id, model, billing_provider,
        input_tokens, output_tokens, reasoning_tokens,
        cache_read_tokens, cache_write_tokens,
        api_call_count, last_seen, first_seen
      FROM session_model_usage
    `);
    const rows = stmt.all() as HermesRow[];
    db.close();
    return rows;
  } catch (err: any) {
    // 2. Fall back to sqlite3 CLI
    try {
      const query = `SELECT session_id, model, billing_provider, input_tokens, output_tokens, reasoning_tokens, cache_read_tokens, cache_write_tokens, api_call_count, last_seen, first_seen FROM session_model_usage`;
      const stdout = execFileSync("sqlite3", ["-json", `file:${dbPath}?mode=ro`, query], {
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024,
      });
      return JSON.parse(stdout) as HermesRow[];
    } catch (cliErr: any) {
      throw new Error(`Failed to query Hermes SQLite database (${dbPath}): ${err?.message || cliErr?.message}`);
    }
  }
}

export function statePath(cwd: string): string {
  return join(cwd, LEDGER_DIR, "sources", "hermes.json");
}

export function loadState(cwd: string): HermesSyncState {
  const p = statePath(cwd);
  if (!existsSync(p)) return { db_path: "", sessions: {} };
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return { db_path: "", sessions: {} };
  }
}

export function saveState(cwd: string, state: HermesSyncState): void {
  const p = statePath(cwd);
  mkdirSync(join(cwd, LEDGER_DIR, "sources"), { recursive: true });
  writeFileSync(p, JSON.stringify(state, null, 2), "utf8");
}

export async function cmdSyncHermes(cwd: string, argv: string[]): Promise<number> {
  if (!findPolicyPath(cwd)) {
    console.error("✖ No carbon.md here. Run `npx carbon-md init` first.");
    return 1;
  }

  const dryRun = argv.includes("--dry-run");
  const dbIdx = argv.indexOf("--db");
  const customDb = dbIdx >= 0 ? argv[dbIdx + 1] : undefined;

  const defaultDbPath = join(homedir(), ".hermes", "state.db");
  const dbPath = customDb ? resolve(customDb) : defaultDbPath;

  let rows: HermesRow[];
  try {
    rows = readHermesRows(dbPath);
  } catch (err: any) {
    console.error(`✖ ${err.message}`);
    return 1;
  }

  const state = loadState(cwd);
  state.db_path = dbPath;

  const events: UsageEvent[] = [];

  for (const row of rows) {
    const key = `${row.session_id}:${row.model}:${row.billing_provider || ""}`;
    const prev = state.sessions[key] || {
      input_tokens: 0,
      output_tokens: 0,
      reasoning_tokens: 0,
      cache_read_tokens: 0,
      cache_write_tokens: 0,
      last_seen: 0,
    };

    const deltaIn = Math.max(0, Number(row.input_tokens || 0) - prev.input_tokens);
    const deltaOut = Math.max(0, Number(row.output_tokens || 0) - prev.output_tokens);
    const deltaReasoning = Math.max(0, Number(row.reasoning_tokens || 0) - prev.reasoning_tokens);
    const deltaCacheRead = Math.max(0, Number(row.cache_read_tokens || 0) - prev.cache_read_tokens);
    const deltaCacheWrite = Math.max(0, Number(row.cache_write_tokens || 0) - prev.cache_write_tokens);

    if (deltaIn === 0 && deltaOut === 0) {
      continue;
    }

    const est = estimateGco2e(row.model, deltaIn, deltaOut);

    const tsSec = row.last_seen || row.first_seen || Date.now() / 1000;
    const ts = new Date(tsSec * 1000).toISOString();

    const meta: Record<string, unknown> = {
      session_id: row.session_id,
    };
    if (deltaCacheRead > 0) meta.cache_read_tokens = deltaCacheRead;
    if (deltaCacheWrite > 0) meta.cache_write_tokens = deltaCacheWrite;
    if (deltaReasoning > 0) meta.reasoning_tokens = deltaReasoning;

    events.push({
      type: "usage",
      ts,
      source: "hermes",
      provider: row.billing_provider || undefined,
      model: row.model,
      tokens_in: deltaIn,
      tokens_out: deltaOut,
      gco2e: { low: est.low, central: est.central, high: est.high },
      model_class: est.cls,
      factors: FACTORS_VERSION,
      meta: Object.keys(meta).length > 0 ? meta : undefined,
    });

    state.sessions[key] = {
      input_tokens: Number(row.input_tokens || 0),
      output_tokens: Number(row.output_tokens || 0),
      reasoning_tokens: Number(row.reasoning_tokens || 0),
      cache_read_tokens: Number(row.cache_read_tokens || 0),
      cache_write_tokens: Number(row.cache_write_tokens || 0),
      last_seen: Number(row.last_seen || 0),
    };
  }

  if (!events.length) {
    console.log(`✔ Up to date — no new Hermes usage (${rows.length} session-model records checked).`);
    return 0;
  }

  const total = events.reduce((s, e) => s + e.gco2e.central, 0);
  const tokens = events.reduce((s, e) => s + e.tokens_in + e.tokens_out, 0);

  if (dryRun) {
    console.log(
      `Would ingest ${events.length} delta usage entries from Hermes DB (${dbPath}) → ~${formatG(total)} central (${tokens.toLocaleString()} tokens). Dry run — nothing written.`
    );
    return 0;
  }

  appendEvents(cwd, events);
  saveState(cwd, state);

  console.log(
    `✔ Synced ${events.length} Hermes usage delta entries (${rows.length} records checked) → ~${formatG(total)} central estimate, ${tokens.toLocaleString()} tokens`
  );
  console.log("  run `npx carbon-md status` to see your position");
  return 0;
}
