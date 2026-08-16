# Model catalog

Living map of **model string → emission class** used by `carbonmd-factors-2026-08`.

This page is steered weekly (Sunday evening, Europe/Zurich): new public releases and models seen in agent usage are classified, documented here, and wired into `src/core/factors.ts`.

**Last steered:** 2026-08-16  
**Factors version:** `carbonmd-factors-2026-08`

## How to read this

- Classes feed the gCO₂e bands in [Methodology & factors](/methodology/).
- Matching is **heuristic and honest** — unknown strings fall to `medium` + `guessed: true`.
- Small markers win first (`mini`, `flash`, `luna`, `fast`, `lightning`…), so tiered families classify correctly.

## Frontier

High-capability flagships. Central **4.5 gCO₂e / 1k output tokens**.

| Family | Example IDs |
|---|---|
| OpenAI | `gpt-5.5`, `gpt-5.6-sol`, `o3`, `o4` |
| Anthropic | `claude-opus-5`, `claude-fable-5`, `*mythos*` |
| Google | `gemini-3.1-pro-preview`, `*ultra*` |

## Large

Workhorse coding / agent models. Central **2.5 gCO₂e / 1k output tokens**.

| Family | Example IDs |
|---|---|
| OpenAI | `gpt-5.6-terra`, `gpt-4o`, `*codex*` |
| Anthropic | `claude-sonnet-5`, `*sonnet*` |
| xAI | `grok-4.3`, `grok-4.5`, `grok-4.6`, `grok-build-0.1`, `grok-4*` |
| Moonshot | `kimi-k2.6`, `kimi-k2.7-code`, `kimi-k3`, `k3`, `kimi-for-coding` |
| DeepSeek | `deepseek-v4-pro`, `deepseek/deepseek-v4-pro`, `deepseek-v4-pro-0813` |
| Alibaba | `qwen/qwen3.7-max`, `qwen/qwen3.8-max`, `qwen/qwen3.8-2.4t-a95b`, `qwen/qwen3.8-27b`, `qwen3*` |
| Zhipu | `z-ai/glm-5.2`, `glm-5*` |
| ByteDance | `seed-2-1-turbo`, `seed-2.0-code`, `seedream*` |
| Sakana | `sakana-namazu` (Kimi K2.6 derivative) |
| Meta | `muse*`, `muse-spark*` |
| Other | `mistral-large*`, `command*`, `*405b*`, `*r1*` |

## Small

Cheap / fast tiers. Central **0.15 gCO₂e / 1k output tokens**.

| Family | Example IDs |
|---|---|
| OpenAI | `gpt-5.6-luna`, `gpt-5.4-mini`, `*-mini`, `*-nano` |
| Google | `gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-3.7-flash`, `*-flash-lite*` |
| DeepSeek | `deepseek-v4-flash`, `deepseek/deepseek-v4-flash` |
| xAI | `grok-composer-2.5-fast` |
| StepFun | `stepfun/step-3.7-flash` |
| NVIDIA | `nemotron-3.5-lightning` |
| Liquid | `lfm-2.5-2.6b` |
| Markers | `haiku`, `flash`, `lite`, `micro`, `fast`, `lightning`, `gemma`, `phi`, `1b`…`14b` (incl. `2.6b`) |

> **Decision note (2026-08 steer):** `grok-composer-2.5-fast` is classified **small**, not large.
> The `composer … fast` naming marks xAI's cheap/fast tier, and the explicit
> `composer` + `fast` rule wins over the generic `grok` → large family rule.
> This is a deliberate behavior change vs the pre-2026-08 catalog; it lowers
> the central estimate for that model from 2.5 to 0.15 gCO₂e / 1k output tokens.

> **Decision note (2026-08-16 steer):** `grok-4.6` stays **large**, not frontier.
> OpenRouter describes it as xAI's smartest coding/STEM model; the catalog
> still treats the whole `grok` family as the large workhorse band, consistent
> with `grok-4.3` / `grok-4.5`. `qwen3.8-max` / `qwen3.8-2.4t-a95b` stay
> **large** for the same family-rule reason (`qwen` → large), matching
> `qwen3.7-max`. `seed-2-1-turbo` is **large** (coding/agent workhorse);
> `lite`/`mini` Seed IDs remain small.

## Medium (guessed)

Anything without a known marker. Central **0.8 gCO₂e / 1k output tokens**, range widened in `status`.

Seen this week and left guessed: `dots-studio/dots-3-note-preview` (16B active / 280B MoE, no family rule yet).

If your production model lands here, open an issue or wait for the weekly steer.

## Weekly steer

Every **Sunday 20:00 Europe/Zurich**, Hermes:

1. Scans public release notes + Hermes `session_model_usage` for new model IDs
2. Proposes class mappings (frontier / large / medium / small)
3. Updates `factors.ts` + this page + methodology examples
4. Rebuilds and deploys [docs.carbonmd.dev](https://docs.carbonmd.dev)
5. Reports what changed

No silent factor-band rewrites: class **values** (gCO₂e table) only change with an explicit factors version bump and human review.

## Related

- [`carbon-md factors`](/cli/factors/) — print the active table from the CLI
- [Methodology](/methodology/) — derivation and token rules
- [GitHub issues](https://github.com/carbon-md/carbon-md/issues) — suggest a mapping
