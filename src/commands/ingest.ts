import { readFileSync } from "node:fs";
import { estimateGco2e, FACTORS_VERSION, formatG } from "../core/factors.js";
import { appendEvents, type UsageEvent } from "../core/ledger.js";
import { findPolicyPath } from "../core/policy.js";

/**
 * Accepts JSONL (one object per line) from a file or stdin ("-").
 * Field aliases cover common shapes (LiteLLM logs, OpenAI-style usage,
 * hand-rolled exports):
 *   model            model | model_name
 *   input tokens     tokens_in | input_tokens | prompt_tokens
 *   output tokens    tokens_out | output_tokens | completion_tokens
 *   timestamp        ts | timestamp | startTime (optional, defaults now)
 *   provider         provider | custom_llm_provider (optional)
 */
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

  const raw =
    fileArg === "-" ? readFileSync(0, "utf8") : readFileSync(fileArg, "utf8");

  const events: UsageEvent[] = [];
  let skipped = 0;
  let guessedModels = new Set<string>();

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
    // some log shapes nest usage
    const usage = obj.usage ?? obj;
    const model: string | undefined = obj.model ?? obj.model_name;
    const tokensIn = Number(
      usage.tokens_in ?? usage.input_tokens ?? usage.prompt_tokens ?? 0
    );
    const tokensOut = Number(
      usage.tokens_out ?? usage.output_tokens ?? usage.completion_tokens ?? 0
    );
    if (!model || (!tokensIn && !tokensOut)) {
      skipped++;
      continue;
    }
    const est = estimateGco2e(model, tokensIn, tokensOut);
    if (est.guessed) guessedModels.add(model);
    events.push({
      type: "usage",
      ts: String(obj.ts ?? obj.timestamp ?? obj.startTime ?? new Date().toISOString()),
      source,
      provider: obj.provider ?? obj.custom_llm_provider,
      model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      gco2e: { low: est.low, central: est.central, high: est.high },
      model_class: est.cls,
      factors: FACTORS_VERSION,
    });
  }

  if (!events.length) {
    console.error(`✖ No usable records found (${skipped} lines skipped).`);
    return 1;
  }

  appendEvents(cwd, events);
  const total = events.reduce((s, e) => s + e.gco2e.central, 0);
  console.log(
    `✔ Ingested ${events.length} calls (${skipped} skipped) → ~${formatG(total)} central estimate`
  );
  if (guessedModels.size) {
    console.log(
      `  note: unrecognized model(s) mapped to class "medium": ${[...guessedModels].join(", ")}`
    );
  }
  return 0;
}
