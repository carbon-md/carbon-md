# Model catalog

Living map of **model string → emission class** used by `carbonmd-factors-2026-08`.

This page is steered weekly (Sunday evening, Europe/Zurich): new public releases and models seen in agent usage are classified, documented here, and wired into `src/core/factors.ts`.

**Last steered:** 2026-09-20<br>
**Factors version:** `carbonmd-factors-2026-08`

## How to read this

- Classes feed the gCO₂e bands in [Methodology & factors](/methodology/).
- Matching is **heuristic and honest** — unknown strings fall to `medium` + `guessed: true`.
- Small markers win first (`mini`, `flash`, `luna`, `fast`, `lightning`…), so tiered families classify correctly.

## Frontier

High-capability flagships. Central **4.5 gCO₂e / 1k output tokens**.

| Family | Example IDs |
|---|---|
| OpenAI | `gpt-5.2-codex`, `gpt-5.3-codex`, `gpt-5.5`, `gpt-5.6-sol`, `gpt-6-astra`, `gpt-6-astra-pro`, `o3`, `o4` |
| Anthropic | `claude-opus-5`, `claude-fable-5`, `claude-fable-5.1`, `claude-mythos-5.1`, `*mythos*` |
| Google | `gemini-3.1-pro-preview`, `*ultra*` |

## Large

Workhorse coding / agent models. Central **2.5 gCO₂e / 1k output tokens**.

| Family | Example IDs |
|---|---|
| OpenAI | `gpt-5.6-terra`, `gpt-4o`, `*codex*` |
| Anthropic | `claude-sonnet-5`, `*sonnet*` |
| xAI | `grok-4.3`, `grok-4.5`, `grok-4.6`, `grok-build-0.1`, `grok-4*` |
| Moonshot | `kimi-k2.6`, `kimi-k2.7-code`, `kimi-k2.8-preview`, `kimi-k3`, `k3`, `kimi-for-coding` |
| DeepSeek | `deepseek-v4-pro`, `deepseek/deepseek-v4-pro`, `deepseek-v4-pro-0813` |
| Meituan | `meituan/longcat-2.0`, `meituan/longcat-2.0:free`, `longcat*` |
| Alibaba | `qwen/qwen3.7-max`, `qwen/qwen3.8-max`, `qwen/qwen3.8-max-0902`, `qwen/qwen3.8-2.4t-a95b`, `qwen/qwen3.8-27b`, `qwen3*` |
| Zhipu | `z-ai/glm-5.2`, `z-ai/glm-5.3`, `glm-5*` (non-flash) |
| ByteDance | `seed-2-1-turbo`, `seed-2.0-code`, `seedream*` |
| Sakana | `sakana-namazu` (Kimi K2.6 derivative) |
| Meta | `muse*`, `muse-spark*`, `muse-spark-1.2-contributor`, `muse-spark-1.3`, `muse-spark-1.3-contributor` |
| Tencent | `hy4-preview` (Hunyuan 4 flagship; not `hy-mt`) |
| Upstage | `upstage/solar-pro4:free`, `solar-pro4` |
| Shanghai AI Lab | `Atria-Dawn-Preview`, `atria-dawn-preview` |
| Other | `mistral-large*`, `command*`, `*405b*`, `*r1*` |

## Small

Cheap / fast tiers. Central **0.15 gCO₂e / 1k output tokens**.

| Family | Example IDs |
|---|---|
| OpenAI | `gpt-5.6-luna`, `gpt-5.4-mini`, `*-mini`, `*-nano` |
| Google | `gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-3.7-flash`, `gemini-3.8-flash`, `gemini-3.8-flash-cyber`, `*-flash-lite*` |
| DeepSeek | `deepseek-v4-flash`, `deepseek/deepseek-v4-flash`, `deepseek-v4-flash-vision-exp`, `deepseek-v4.1-flash`, `deepseek/deepseek-v4.1-flash`, `deepseek-flash` |
| xAI | `grok-composer-2.5-fast` |
| Alibaba | `qwen/qwen3.8-flash`, `qwen/qwen3.8-flash-next` |
| Zhipu | `z-ai/glm-5.3-flash`, `stealth/ox-alpha` (unmasked as GLM-5.3-Flash) |
| StepFun | `stepfun/step-3.7-flash` |
| InclusionAI | `inclusionai/ling-3.0-flash`, `inclusionai/ling-3.0-flash-fin` |
| NVIDIA | `nemotron-3.5-lightning` |
| Liquid | `lfm-2.5-2.6b` |
| IBM | `ibm-granite/granite-4.2-8b` |
| Inception | `inception/mercury-2.5-preview` |
| Tencent | `hy-mt2-1.8b`, `hy-mt2-7b`, `hy-mt2-30b-a3b`, `hy-mt*` |
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

> **Decision note (2026-08-23 steer):** `z-ai/glm-5.3` stays **large** (`glm`
> family, reasoning / agent workhorse). `meta/muse-spark-1.2-contributor`
> stays **large** — `contributor` is not a small marker; the `muse` family
> rule wins even though the contributor SKU is cheaper than Spark. Tencent
> `hy-mt2*` (Hunyuan-MT translation specialists, including `30b-a3b` with
> 3B active) is classified **small**. `deepseek-v4-flash-vision-exp` is
> **small** via `flash`.

> **Decision note (2026-08-30 steer):** `stealth/ox-alpha` is classified **small**,
> not medium/guessed. Z.ai unmasked it on 2026-08-26 as `GLM-5.3-Flash`
> (320B-A18B). The `flash` marker already maps `glm-5.3-flash` / `qwen3.8-flash-next`
> to small; the explicit `ox-alpha` rule keeps the stealth ID aligned with that
> SKU. `glm-5.3` (non-flash) stays **large**. Factor *bands* unchanged.

> **Decision note (2026-09-06 steer):** `gpt-6-astra` / `gpt-6-astra-pro` are
> classified **frontier**, not medium/guessed. OpenAI's GPT-6 flagship began a
> phased rollout on 2026-09-03 (API IDs also listed as `openai/gpt-6-astra`).
> The `gpt-6` rule is checked after small markers, so a hypothetical
> `gpt-6-mini` / `luna` still lands small. `claude-fable-5.1` and
> `claude-mythos-5.1` stay **frontier** via existing `fable` / `mythos`.
> `gemini-3.8-flash` (and the Fairwind-gated Cyber variant) is **small** via
> `flash`. `muse-spark-1.3` / `muse-spark-1.3-contributor` stay **large** via
> `muse`. `qwen3.8-max-0902` stays **large** via `qwen`.
> `ibm-granite/granite-4.2-8b` is **small** via `8b`.
> `inception/mercury-2.5-preview` is classified **small** (diffusion LLM,
> vendor-compared to Luna / Flash-Lite / Haiku). `tencent/hy4-preview` is
> **large** (Hunyuan 4, 770B-A49B coding flagship) — the `hy-mt` translation
> family remains small; `hy4` is a different product. Factor *bands* unchanged.
> No new uncatalogued IDs in Hermes usage this week.
>
> **Decision note (2026-09-13 steer):** `deepseek-v4.1-flash` /
> `deepseek/deepseek-v4.1-flash` / API alias `deepseek-flash` are **small**
> via `flash`. DeepSeek launched V4.1-Flash on 2026-09-10 (MIT weights;
> older V4 Flash / Flash Vision API names now route here). `gemini-3.8-flash-cyber`
> stays **small** via `flash`. `inclusionai/ling-3.0-flash-fin` is **small**
> via `flash`. `meituan/longcat-2.0` (and `:free`) is classified **large**,
> not medium/guessed — Meituan LongCat-2.0 is a 1.6T-A48B coding workhorse,
> same band as Kimi / DeepSeek-Pro / Qwen-Max. Factor *bands* unchanged.
>
> **Decision note (2026-09-20 steer):** Moonshot's `kimi-k2.8-preview` is
> **large** through the existing `kimi` family rule; its Kimi Code rollout also
> retains the `kimi-for-coding` endpoint. Shanghai AI Lab's
> `Atria-Dawn-Preview` is **large**, not medium/guessed: it is a 744B
> agentic-MoE release built on the GLM-5.2 lineage, so an explicit `atria` rule
> aligns it with GLM/Kimi/DeepSeek workhorses. Hermes usage also contains
> `upstage/solar-pro4:free`; Upstage describes Solar Pro 4 as its 512K-context
> agentic LLM, and the explicit `solar-pro` rule maps it **large**. The complete
> `gpt-5.2-codex`, `gpt-5.3-codex`, and `gemini-3.1-flash-lite-preview` IDs
> were documented as already-covered family variants. Factor *bands* unchanged.

## Medium (guessed)

Anything without a known marker. Central **0.8 gCO₂e / 1k output tokens**, range widened in `status`.

No new guessed IDs this week.

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
