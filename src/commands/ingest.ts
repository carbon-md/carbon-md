import { readFileSync } from "node:fs";
import { estimateGco2e, FACTORS_VERSION, formatG } from "../core/factors.js";
import { appendEvents, type UsageEvent } from "../core/ledger.js";
import { findPolicyPath } from "../core/policy.js";

/**
 * Ingest usage data. Two shapes are auto-detected per line:
 *
 * 1. carbon.md usage report (spec v0.1) — one JSON object per line:
 *      model        model | model_name
 *      input        tokens_in | input_tokens | prompt_tokens   (also under `usage`)
 *      output       tokens_out | output_tokens | completion_tokens (also under `usage`)
 *      timestamp    ts | timestamp | startTime (optional)
 *      provider     provider | custom_llm_provider (optional)
 *      cache reads  cache_read_tokens (optional — recorded, excluded from estimate)
 *
 * 2. OTLP/JSON metric lines (OpenTelemetry Collector file exporter).
 *    Any metric named *.token.usage (claude_code, gemini_cli, …) or the
 *    GenAI semconv `gen_ai.client.token.usage` is flattened. Token-type
 *    mapping: input/cacheCreation/tool → tokens_in; output/thought →
 *    tokens_out; cacheRead/cache → recorded but excluded (prompt-cache
 *    serving costs far less than a fresh forward pass — we under-claim
 *    rather than inflate). Use DELTA temporality; cumulative sums would
 *    double-count and trigger a warning.
 */

interface Rec {
  model: string;
  tokensIn: number;
  tokensOut: number;
  cacheRead: number;
  ts?: string;
  provider?: string;
}

const TOKEN_METRIC = /(^|\.)token\.usage$/;
const IN_TYPES = new Set(["input", "cacheCreation", "cache_creation", "tool"]);
const OUT_TYPES = new Set(["output", "completion", "thought"]);
const CACHE_TYPES = new Set(["cacheRead", "cache_read", "cache"]);

function attrsOf(dp: any): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const a of dp.attributes ?? []) {
    const v = a.value ?? {};
    attrs[a.key] = v.stringValue ?? String(v.intValue ?? v.doubleValue ?? v.boolValue ?? "");
  }
  return attrs;
}

function flattenOtlp(obj: any, warnings: Set<string>): Rec[] {
  const recs: Rec[] = [];
  for (const rm of obj.resourceMetrics ?? []) {
    for (const sm of rm.scopeMetrics ?? []) {
      for (const metric of sm.metrics ?? []) {
        const name: string = metric.name ?? "";
        if (!TOKEN_METRIC.test(name) && name !== "gen_ai.client.token.usage") continue;
        const sum = metric.sum ?? metric.histogram;
        // OTLP AggregationTemporality: 1 = delta, 2 = cumulative
        if (metric.sum && Number(metric.sum.aggregationTemporality) === 2) {
          warnings.add(
            `metric ${name} uses CUMULATIVE temporality — values may double-count; configure delta temporality`
          );
        }
        for (const dp of sum?.dataPoints ?? []) {
          const attrs = attrsOf(dp);
          const model =
            attrs["model"] ?? attrs["gen_ai.response.model"] ?? attrs["gen_ai.request.model"];
          const type = attrs["type"] ?? attrs["gen_ai.token.type"];
          const value = Number(dp.asInt ?? dp.asDouble ?? dp.sum ?? 0);
          if (!model || !type || !value) continue;
          const ts = dp.timeUnixNano
            ? new Date(Number(dp.timeUnixNano) / 1e6).toISOString()
            : undefined;
          const rec: Rec = { model, tokensIn: 0, tokensOut: 0, cacheRead: 0, ts };
          if (IN_TYPES.has(type)) rec.tokensIn = value;
          else if (OUT_TYPES.has(type)) rec.tokensOut = value;
          else if (CACHE_TYPES.has(type)) rec.cacheRead = value;
          else continue; // unknown token type — leave for a future spec rev
          recs.push(rec);
        }
      }
    }
  }
  return recs;
}

function mapReport(obj: any): Rec | null {
  const usage = obj.usage ?? obj;
  const model: string | undefined = obj.model ?? obj.model_name;
  const tokensIn = Number(usage.tokens_in ?? usage.input_tokens ?? usage.prompt_tokens ?? 0);
  const tokensOut = Number(
    usage.tokens_out ?? usage.output_tokens ?? usage.completion_tokens ?? 0
  );
  const cacheRead = Number(usage.cache_read_tokens ?? 0);
  if (!model || (!tokensIn && !tokensOut && !cacheRead)) return null;
  return {
    model,
    tokensIn,
    tokensOut,
    cacheRead,
    ts: obj.ts ?? obj.timestamp ?? obj.startTime,
    provider: obj.provider ?? obj.custom_llm_provider,
  };
}

export async function cmdIngest(cwd: string, argv: string[]): Promise<number> {
  if (!findPolicyPath(cwd)) {
    console.error("✖ No carbon.md here. Run `npx carbon-md init` first.");
    return 1;
  }
  const fileArg = argv.find((a) => !a.startsWith("--"));
  if (!fileArg) {
    console.error("Usage: carbon-md ingest <usage.jsonl | -> [--source <label>]");
    return 1;
  }
  const sourceIdx = argv.indexOf("--source");
  const source = sourceIdx >= 0 ? argv[sourceIdx + 1] ?? "ingest" : "ingest";

  const raw = fileArg === "-" ? readFileSync(0, "utf8") : readFileSync(fileArg, "utf8");

  const recs: Rec[] = [];
  const warnings = new Set<string>();
  let skipped = 0;

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let obj: any;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      skipped++;
      continue;
    }
    if (obj.resourceMetrics) {
      recs.push(...flattenOtlp(obj, warnings));
    } else {
      const rec = mapReport(obj);
      if (rec) recs.push(rec);
      else skipped++;
    }
  }

  const events: UsageEvent[] = [];
  const guessedModels = new Set<string>();
  let cacheReadTotal = 0;

  for (const rec of recs) {
    cacheReadTotal += rec.cacheRead;
    if (!rec.tokensIn && !rec.tokensOut) continue; // cache-only record: noted, not estimated
    const est = estimateGco2e(rec.model, rec.tokensIn, rec.tokensOut);
    if (est.guessed) guessedModels.add(rec.model);
    events.push({
      type: "usage",
      ts: String(rec.ts ?? new Date().toISOString()),
      source,
      provider: rec.provider,
      model: rec.model,
      tokens_in: rec.tokensIn,
      tokens_out: rec.tokensOut,
      gco2e: { low: est.low, central: est.central, high: est.high },
      model_class: est.cls,
      factors: FACTORS_VERSION,
      meta: rec.cacheRead ? { cache_read_tokens: rec.cacheRead } : undefined,
    });
  }

  if (!events.length) {
    console.error(`✖ No usable records found (${skipped} lines skipped).`);
    return 1;
  }

  appendEvents(cwd, events);
  const total = events.reduce((s, e) => s + e.gco2e.central, 0);
  console.log(
    `✔ Ingested ${events.length} records (${skipped} skipped) → ~${formatG(total)} central estimate`
  );
  if (cacheReadTotal) {
    console.log(
      `  ${cacheReadTotal.toLocaleString()} cache-read tokens recorded but excluded from the estimate`
    );
  }
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  if (guessedModels.size) {
    console.log(
      `  note: unrecognized model(s) mapped to class "medium": ${[...guessedModels].join(", ")}`
    );
  }
  return 0;
}
