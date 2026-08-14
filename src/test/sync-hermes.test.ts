import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { tmpdir } from "node:os";

const require = createRequire(import.meta.url);

import { classify, estimateGco2e } from "../core/factors.js";
import { cmdSyncHermes, loadState, readHermesRows } from "../commands/sync-hermes.js";
import { readLedger } from "../core/ledger.js";

// Helper to create a temporary test SQLite DB using sqlite3 CLI or node:sqlite
function createTestDb(dbPath: string): void {
  const initSql = `
    CREATE TABLE IF NOT EXISTS session_model_usage (
      session_id TEXT NOT NULL,
      model TEXT NOT NULL,
      billing_provider TEXT DEFAULT '',
      billing_base_url TEXT DEFAULT '',
      billing_mode TEXT DEFAULT '',
      task TEXT DEFAULT '',
      api_call_count INTEGER DEFAULT 0,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      cache_read_tokens INTEGER DEFAULT 0,
      cache_write_tokens INTEGER DEFAULT 0,
      reasoning_tokens INTEGER DEFAULT 0,
      estimated_cost_usd REAL DEFAULT 0,
      actual_cost_usd REAL DEFAULT 0,
      cost_status TEXT DEFAULT '',
      cost_source TEXT DEFAULT '',
      first_seen REAL,
      last_seen REAL,
      PRIMARY KEY (session_id, model, billing_provider)
    );
  `;
  try {
    const { DatabaseSync } = require("node:sqlite");
    const db = new DatabaseSync(dbPath);
    db.exec(initSql);
    db.close();
  } catch {
    execFileSync("sqlite3", [dbPath, initSql]);
  }
}

function executeSql(dbPath: string, sql: string): void {
  try {
    const { DatabaseSync } = require("node:sqlite");
    const db = new DatabaseSync(dbPath);
    db.exec(sql);
    db.close();
  } catch {
    execFileSync("sqlite3", [dbPath, sql]);
  }
}

test("factors: classification for kimi and deepseek models", () => {
  assert.equal(classify("kimi-k2.7-code").cls, "large");
  assert.equal(classify("kimi-k2.6").cls, "large");
  assert.equal(classify("k3").cls, "large");
  assert.equal(classify("deepseek/deepseek-v4-pro").cls, "large");
  assert.equal(classify("deepseek/deepseek-v4-flash").cls, "small"); // 'flash' is small token
});

test("sync hermes: reads DB, handles delta ingestion and idempotence", async () => {
  const workDir = join(tmpdir(), `carbon-test-hermes-${Date.now()}`);
  mkdirSync(workDir, { recursive: true });

  const dbPath = join(workDir, "test-state.db");
  createTestDb(dbPath);

  // Write policy carbon.md
  writeFileSync(
    join(workDir, "carbon.md"),
    `---\ncarbon_md: "0.1"\npolicy:\n  contribution_target: 1.10\n  monthly_budget_max: { amount: 5, currency: USD }\n  approval_above: { amount: 10, currency: USD }\nmethodology: carbonmd-factors-2026-07\n---\n`,
    "utf8"
  );

  // 1. Insert initial row into SQLite
  executeSql(
    dbPath,
    `INSERT INTO session_model_usage (
      session_id, model, billing_provider,
      input_tokens, output_tokens, reasoning_tokens, cache_read_tokens,
      first_seen, last_seen
    ) VALUES (
      'sess_001', 'gpt-5.6-sol', 'openai-codex',
      1000, 200, 50, 5000,
      1782864000, 1782864000
    );`
  );

  // Initial sync
  const code1 = await cmdSyncHermes(workDir, ["--db", dbPath]);
  assert.equal(code1, 0);

  const ledger1 = readLedger(workDir);
  assert.equal(ledger1.length, 1);
  const event1 = ledger1[0];
  assert.equal(event1.type, "usage");
  if (event1.type === "usage") {
    assert.equal(event1.source, "hermes");
    assert.equal(event1.model, "gpt-5.6-sol");
    assert.equal(event1.tokens_in, 1000);
    assert.equal(event1.tokens_out, 200); // output includes reasoning
    assert.equal(event1.meta?.cache_read_tokens, 5000);
    assert.equal(event1.meta?.reasoning_tokens, 50);
  }

  // Check state file in .carbon-md/sources/hermes.json
  const state1 = loadState(workDir);
  assert.equal(state1.sessions["sess_001:gpt-5.6-sol:openai-codex"].input_tokens, 1000);
  assert.equal(state1.sessions["sess_001:gpt-5.6-sol:openai-codex"].output_tokens, 200);

  // 2. Second sync — DB unchanged -> MUST BE IDEMPOTENT (0 new events)
  const code2 = await cmdSyncHermes(workDir, ["--db", dbPath]);
  assert.equal(code2, 0);

  const ledger2 = readLedger(workDir);
  assert.equal(ledger2.length, 1, "Re-running on unchanged DB must not duplicate events");

  // 3. Update row in DB with cumulative addition (+500 input, +100 output, +30 reasoning, +2000 cache read)
  executeSql(
    dbPath,
    `UPDATE session_model_usage SET 
      input_tokens = 1500,
      output_tokens = 300,
      reasoning_tokens = 80,
      cache_read_tokens = 7000,
      last_seen = 1782864100
     WHERE session_id = 'sess_001' AND model = 'gpt-5.6-sol';`
  );

  // Third sync — should ingest only the delta
  const code3 = await cmdSyncHermes(workDir, ["--db", dbPath]);
  assert.equal(code3, 0);

  const ledger3 = readLedger(workDir);
  assert.equal(ledger3.length, 2, "Delta sync must append exactly 1 new event");

  const event2 = ledger3[1];
  assert.equal(event2.type, "usage");
  if (event2.type === "usage") {
    assert.equal(event2.tokens_in, 500, "Delta input tokens must be 1500 - 1000 = 500");
    assert.equal(event2.tokens_out, 100, "Delta output tokens must be 300 - 200 = 100");
    assert.equal(event2.meta?.reasoning_tokens, 30, "Delta reasoning tokens must be 80 - 50 = 30");
    assert.equal(event2.meta?.cache_read_tokens, 2000, "Delta cache read tokens must be 7000 - 5000 = 2000");
  }

  // Cleanup
  rmSync(workDir, { recursive: true, force: true });
});
