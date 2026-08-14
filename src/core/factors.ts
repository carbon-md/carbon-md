/**
 * carbonmd-factors-2026-07
 *
 * Per-model-class emission factors, gCO2e per 1k OUTPUT tokens.
 * Input tokens are weighted at 0.2x of the output-token factor.
 *
 * Derivation: EcoLogits methodology (JOSS 2025) regression curves +
 * public provider disclosures (Google 2025 median-prompt figure,
 * OpenAI per-query statements), converted with a world-average grid
 * intensity assumption (~400 gCO2e/kWh) and rounded to one significant
 * figure of honesty. Ranges are wide BY DESIGN: cloud inference is a
 * black box. Estimates are only comparable within a factors version.
 */

export const FACTORS_VERSION = "carbonmd-factors-2026-07";

export type ModelClass = "frontier" | "large" | "medium" | "small";

export interface Range {
  low: number;
  central: number;
  high: number;
}

/** gCO2e per 1k output tokens */
export const CLASS_FACTORS: Record<ModelClass, Range> = {
  frontier: { low: 1.5, central: 4.5, high: 15 },
  large: { low: 0.8, central: 2.5, high: 8 },
  medium: { low: 0.2, central: 0.8, high: 2.5 },
  small: { low: 0.03, central: 0.15, high: 0.6 },
};

export const INPUT_TOKEN_WEIGHT = 0.2;

const SMALL_TOKENS = new Set([
  "haiku", "mini", "flash", "nano", "tiny", "lite", "micro", "gemma", "phi",
]);
const FRONTIER_TOKENS = new Set(["opus", "ultra", "heavy", "fable", "mythos"]);

function tokenize(model: string): string[] {
  return model.toLowerCase().split(/[^a-z0-9.]+/).filter(Boolean);
}

/**
 * Heuristic model -> class mapping. Checked in order:
 * small markers first (so "gpt-5-mini" lands small, while "gemini"
 * stays untouched because we match whole tokens, not substrings).
 */
export function classify(model: string): { cls: ModelClass; guessed: boolean } {
  const raw = model.toLowerCase();
  const tokens = tokenize(model);
  const has = (t: string) => tokens.includes(t);
  const smallB = tokens.some((t) => /^([1-9]|1[0-4])b$/.test(t)); // 1b..14b params

  if (tokens.some((t) => SMALL_TOKENS.has(t)) || smallB) return { cls: "small", guessed: false };
  if (tokens.some((t) => FRONTIER_TOKENS.has(t))) return { cls: "frontier", guessed: false };
  if (raw.includes("gpt-5") || has("o3") || has("o4")) return { cls: "frontier", guessed: false };
  if (
    has("sonnet") ||
    raw.includes("gpt-4") ||
    (has("gemini") && has("pro")) ||
    has("grok") ||
    raw.includes("r1") ||
    (has("mistral") && has("large")) ||
    has("405b") ||
    has("command")
  ) {
    return { cls: "large", guessed: false };
  }
  return { cls: "medium", guessed: true };
}

export interface Estimate extends Range {
  cls: ModelClass;
  guessed: boolean;
}

/** Estimate gCO2e for a single call. */
export function estimateGco2e(model: string, tokensIn: number, tokensOut: number): Estimate {
  const { cls, guessed } = classify(model);
  const f = CLASS_FACTORS[cls];
  const weightedKtok = (tokensOut + INPUT_TOKEN_WEIGHT * tokensIn) / 1000;
  return {
    low: f.low * weightedKtok,
    central: f.central * weightedKtok,
    high: f.high * weightedKtok,
    cls,
    guessed,
  };
}

export const PRICES_VERSION = "carbonmd-prices-2026-07";

/**
 * Default price assumptions per portfolio, USD per tCO2e.
 *
 * PLANNING FIGURES, NOT QUOTES. The spread on removal is genuinely enormous, so
 * a narrow range here would be a lie in both directions. Anchors observed live
 * on the Klima x402 rail, July 2026:
 *
 *   nature-based removal (Regen City Forest)   ~$17/t
 *   durable, biochar (Puro)                    ~$127/t   — whole tonnes only
 *   durable, ocean alkalinity enhancement      ~$1,308/t — cheapest durable
 *                                                          removal buyable
 *                                                          fractionally today
 *
 * "removal-weighted" centres on durable biochar because that is what the
 * portfolio name promises; the high end is OAE, which is what a small agent
 * footprint actually ends up buying, since sub-tonne durable removal has no
 * cheaper option yet. `contribute --execute` never uses these numbers — it
 * prices against a live quote and refuses to spend past the policy caps.
 */
export const PORTFOLIO_PRICES: Record<string, Range | null> = {
  // Same band as removal-weighted — both buy removal; only the enforcement
  // differs. The low end is the cheapest removal actually on the rail.
  "removal-only": { low: 12, central: 130, high: 1400 },
  "removal-weighted": { low: 20, central: 130, high: 1400 },
  balanced: { low: 8, central: 30, high: 200 },
  custom: null,
};

export function formatG(g: number): string {
  if (g >= 1_000_000) return `${(g / 1_000_000).toFixed(2)} tCO2e`;
  if (g >= 1000) return `${(g / 1000).toFixed(2)} kgCO2e`;
  return `${g.toFixed(g < 1 ? 3 : 1)} gCO2e`;
}
