# Catalogue modèles

**Dernier steer :** 2026-09-06 · `carbonmd-factors-2026-08`

## Frontier
`gpt-5.5`, `gpt-5.6-sol`, `gpt-6-astra`, `gpt-6-astra-pro`, `claude-opus-5`, `claude-fable-5`, `claude-fable-5.1`, `claude-mythos-5.1`, `gemini-3.1-pro-preview`

## Large
`gpt-5.6-terra`, `claude-sonnet-5`, `kimi-k2.6`, `kimi-k3`, `k3`, `grok-4.3`, `grok-4.5`, `grok-4.6`, `grok-build-0.1`, `deepseek-v4-pro`, `deepseek-v4-pro-0813`, `qwen3.7-max`, `qwen3.8-max`, `qwen3.8-max-0902`, `qwen3.8-2.4t-a95b`, `qwen3.8-27b`, `glm-5.2`, `glm-5.3`, `muse-spark-1.2-contributor`, `muse-spark-1.3`, `muse-spark-1.3-contributor`, `seed-2-1-turbo`, `seed-2.0-code`, `sakana-namazu`, `hy4-preview`

## Small
`gpt-5.6-luna`, `gpt-5.4-mini`, `gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-3.7-flash`, `gemini-3.8-flash`, `deepseek-v4-flash`, `deepseek-v4-flash-vision-exp`, `grok-composer-2.5-fast`, `qwen3.8-flash`, `qwen3.8-flash-next`, `glm-5.3-flash`, `stealth/ox-alpha`, `step-3.7-flash`, `nemotron-3.5-lightning`, `lfm-2.5-2.6b`, `hy-mt2-1.8b`, `hy-mt2-7b`, `hy-mt2-30b-a3b`, `granite-4.2-8b`, `mercury-2.5-preview`

> **Note de décision (steer 2026-08) :** `grok-composer-2.5-fast` est classé **small**, pas large.
> La règle explicite `composer` + `fast` (tier rapide/économique xAI) prime sur la règle
> générique `grok` → large. Changement voulu : l'estimation centrale passe de 2,5 à 0,15 gCO₂e / 1k tokens de sortie.

> **Note de décision (steer 2026-08-16) :** `grok-4.6` reste **large** (famille grok, comme 4.3/4.5), pas frontier. `qwen3.8-max` / `qwen3.8-2.4t` restent **large**. `seed-2-1-turbo` est **large** ; les IDs Seed `lite`/`mini` restent small.

> **Note de décision (steer 2026-08-23) :** `glm-5.3` reste **large** (famille glm). `muse-spark-1.2-contributor` reste **large** (`contributor` n'est pas un marqueur small). Famille Tencent `hy-mt2*` → **small**. `deepseek-v4-flash-vision-exp` → **small** (`flash`).

> **Note de décision (steer 2026-08-30) :** `stealth/ox-alpha` est classé **small**, plus medium/guessed. Z.ai l’a démasqué le 2026-08-26 comme `GLM-5.3-Flash`. Le marqueur `flash` classe déjà `glm-5.3-flash` / `qwen3.8-flash-next` en small ; la règle `ox-alpha` aligne l’ID stealth. `glm-5.3` (sans flash) reste **large**. Bandes gCO₂e inchangées.

> **Note de décision (steer 2026-09-06) :** `gpt-6-astra` / `gpt-6-astra-pro` sont classés **frontier**, pas medium/guessed. Flagship GPT-6 d’OpenAI, déploiement progressif dès le 2026-09-03. La règle `gpt-6` vient après les marqueurs small : un hypothétique `gpt-6-mini` resterait small. `claude-fable-5.1` / `claude-mythos-5.1` restent **frontier** (`fable` / `mythos`). `gemini-3.8-flash` → **small** (`flash`). `muse-spark-1.3` reste **large** (`muse`). `qwen3.8-max-0902` reste **large**. `granite-4.2-8b` → **small** (`8b`). `mercury-2.5-preview` → **small** (diffusion, classe Luna / Flash-Lite / Haiku). `hy4-preview` → **large** (Hunyuan 4 flagship) ; la famille `hy-mt` reste small. Bandes gCO₂e inchangées. Aucun nouvel ID uncatalogué dans l’usage Hermes cette semaine.

## Medium
Inconnu / guessed. Aucun nouvel ID guessed cette semaine.

Steer auto : dimanche 20:00 Europe/Zurich.
