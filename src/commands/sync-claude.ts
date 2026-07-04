import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { estimateGco2e, FACTORS_VERSION, formatG } from "../core/factors.js";
import { appendEvents, LEDGER_DIR, type UsageEvent } from "../core/ledger.js";
import { findPolicyPath } from "../core/policy.js";

/**
 * Sync usage from Claude Code's local transcripts (~/.claude/projects/...).
 *
 * Every assistant message in a transcript carries `message.usage`
 * (input/output/cache token counts) and `message.model`. We dedupe by
 * message id (streamed responses write several entries per message; the
 * one with the highest output_tokens wins) and keep a per-file state of
 * already-ingested ids so re-running is idempotent.
 *
 * Cache-read tokens are recorded in event.meta but EXCLUDED from the
 * emission estimate: serving from prompt cache costs far less compute
 * than a fresh forward pass, and overstating would be its own kind of
 * dishonesty. Revisit when better public data exists.
 */

interface SyncState {
  files: Record<string, { ingested: string[] }>;
}

interface ParsedMsg {
  id: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  cacheRead: number;
  ts: string;
}

function slugForCwd(cwd: string): string {
  return resolve(cwd).replace(/[^a-zA-Z0-9]/g, "-");
}

function statePath(cwd: string): string {
  return join(cwd, LEDGER_DIR, "sources", "claude-code.json");
}

function loadState(cwd: string): SyncState {
  const p = statePath(cwd);
  if (!existsSync(p)) return { files: {} };
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return { files: {} };
  }
}

function saveState(cwd: string, state: SyncState): void {
  const p = statePath(cwd);
  mkdirSync(join(cwd, LEDGER_DIR, "sources"), { recursive: true });
  writeFileSync(p, JSON.stringify(state), "utf8");
}

function parseTranscript(path: string): Map<string, ParsedMsg> {
  const msgs = new Map<string, ParsedMsg>();
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return msgs;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let obj: any;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (obj.type !== "assistant") continue;
    const m = obj.message;
    const usage = m?.usage;
    const model: string | undefined = m?.model;
    if (!usage || !model || model.startsWith("<")) continue; // "<synthetic>" etc.
    const id: string = m.id ?? obj.uuid;
    if (!id) continue;
    const tokensOut = Number(usage.output_tokens ?? 0);
    const existing = msgs.get(id);
    if (existing && existing.tokensOut >= tokensOut) continue;
    msgs.set(id, {
      id,
      model,
      tokensIn: Number(usage.input_tokens ?? 0) + Number(usage.cache_creation_input_tokens ?? 0),
      tokensOut,
      cacheRead: Number(usage.cache_read_input_tokens ?? 0),
      ts: String(obj.timestamp ?? new Date().toISOString()),
    });
  }
  return msgs;
}

export async function cmdSync(cwd: string, argv: string[]): Promise<number> {
  const target = argv[0];
  if (target !== "claude-code") {
    console.error("Usage: carbon-md sync claude-code [--all | --dir <path>] [--dry-run]");
    console.error("(claude-code is the only built-in source so far — LiteLLM & co. use `carbon-md ingest`)");
    return 1;
  }
  if (!findPolicyPath(cwd)) {
    console.error("✖ No carbon.md here. Run `npx carbon-md init` first.");
    return 1;
  }

  const flags = argv.slice(1);
  const dryRun = flags.includes("--dry-run");
  const all = flags.includes("--all");
  const dirIdx = flags.indexOf("--dir");
  const customDir = dirIdx >= 0 ? flags[dirIdx + 1] : undefined;

  const base = join(homedir(), ".claude", "projects");
  let dirs: string[] = [];
  if (customDir) {
    dirs = [resolve(customDir)];
  } else if (all) {
    if (!existsSync(base)) {
      console.error(`✖ ${base} not found — is Claude Code installed?`);
      return 1;
    }
    dirs = readdirSync(base)
      .map((d) => join(base, d))
      .filter((d) => statSync(d).isDirectory());
  } else {
    const projectDir = join(base, slugForCwd(cwd));
    if (!existsSync(projectDir)) {
      console.error(`✖ No Claude Code transcripts found for this project (${projectDir}).`);
      console.error("  Use --all to sync every project, or --dir <path> to point at one.");
      return 1;
    }
    dirs = [projectDir];
  }

  const state = loadState(cwd);
  const events: UsageEvent[] = [];
  let filesScanned = 0;

  for (const dir of dirs) {
    const files = readdirSync(dir).filter((f) => f.endsWith(".jsonl"));
    for (const file of files) {
      const path = join(dir, file);
      filesScanned++;
      const msgs = parseTranscript(path);
      if (!msgs.size) continue;
      const fileState = state.files[path] ?? { ingested: [] };
      const seen = new Set(fileState.ingested);
      for (const msg of msgs.values()) {
        if (seen.has(msg.id)) continue;
        const est = estimateGco2e(msg.model, msg.tokensIn, msg.tokensOut);
        events.push({
          type: "usage",
          ts: msg.ts,
          source: "claude-code",
          provider: "anthropic",
          model: msg.model,
          tokens_in: msg.tokensIn,
          tokens_out: msg.tokensOut,
          gco2e: { low: est.low, central: est.central, high: est.high },
          model_class: est.cls,
          factors: FACTORS_VERSION,
          meta: msg.cacheRead ? { cache_read_tokens: msg.cacheRead } : undefined,
        });
        seen.add(msg.id);
      }
      state.files[path] = { ingested: [...seen] };
    }
  }

  if (!events.length) {
    console.log(`✔ Up to date — no new messages (${filesScanned} transcript files scanned).`);
    return 0;
  }

  const total = events.reduce((s, e) => s + e.gco2e.central, 0);
  const tokens = events.reduce((s, e) => s + e.tokens_in + e.tokens_out, 0);
  if (dryRun) {
    console.log(
      `Would ingest ${events.length} messages from ${filesScanned} files → ~${formatG(total)} central (${tokens.toLocaleString()} tokens). Dry run — nothing written.`
    );
    return 0;
  }

  appendEvents(cwd, events);
  saveState(cwd, state);
  console.log(
    `✔ Synced ${events.length} Claude Code messages (${filesScanned} files) → ~${formatG(total)} central estimate, ${tokens.toLocaleString()} tokens`
  );
  console.log("  run `npx carbon-md status` to see your position");
  return 0;
}
