# Catalogue modèles

**Dernier steer :** 2026-08-30 · `carbonmd-factors-2026-08`

## Frontier
`gpt-5.5`, `gpt-5.6-sol`, `claude-opus-5`, `claude-fable-5`, `gemini-3.1-pro-preview`

## Large
`gpt-5.6-terra`, `claude-sonnet-5`, `kimi-k2.6`, `kimi-k3`, `k3`, `grok-4.3`, `grok-4.5`, `grok-4.6`, `grok-build-0.1`, `deepseek-v4-pro`, `deepseek-v4-pro-0813`, `qwen3.7-max`, `qwen3.8-max`, `qwen3.8-2.4t-a95b`, `qwen3.8-27b`, `glm-5.2`, `glm-5.3`, `muse-spark-1.2-contributor`, `seed-2-1-turbo`, `seed-2.0-code`, `sakana-namazu`

## Small
`gpt-5.6-luna`, `gpt-5.4-mini`, `gemini-3.5-flash`, `gemini-3.6-flash`, `gemini-3.7-flash`, `deepseek-v4-flash`, `deepseek-v4-flash-vision-exp`, `grok-composer-2.5-fast`, `qwen3.8-flash`, `qwen3.8-flash-next`, `glm-5.3-flash`, `stealth/ox-alpha`, `step-3.7-flash`, `nemotron-3.5-lightning`, `lfm-2.5-2.6b`, `hy-mt2-1.8b`, `hy-mt2-7b`, `hy-mt2-30b-a3b`

> **Note de décision (steer 2026-08) :** `grok-composer-2.5-fast` est classé **small**, pas large.
> La règle explicite `composer` + `fast` (tier rapide/économique xAI) prime sur la règle
> générique `grok` → large. Changement voulu : l'estimation centrale passe de 2,5 à 0,15 gCO₂e / 1k tokens de sortie.

> **Note de décision (steer 2026-08-16) :** `grok-4.6` reste **large** (famille grok, comme 4.3/4.5), pas frontier. `qwen3.8-max` / `qwen3.8-2.4t` restent **large**. `seed-2-1-turbo` est **large** ; les IDs Seed `lite`/`mini` restent small.

> **Note de décision (steer 2026-08-23) :** `glm-5.3` reste **large** (famille glm). `muse-spark-1.2-contributor` reste **large** (`contributor` n'est pas un marqueur small). Famille Tencent `hy-mt2*` → **small**. `deepseek-v4-flash-vision-exp` → **small** (`flash`).

> **Note de décision (steer 2026-08-30) :** `stealth/ox-alpha` est classé **small**, plus medium/guessed. Z.ai l’a démasqué le 2026-08-26 comme `GLM-5.3-Flash`. Le marqueur `flash` classe déjà `glm-5.3-flash` / `qwen3.8-flash-next` en small ; la règle `ox-alpha` aligne l’ID stealth. `glm-5.3` (sans flash) reste **large**. Bandes gCO₂e inchangées.

## Medium
Inconnu / guessed. Aucun nouvel ID guessed cette semaine.

Steer auto : dimanche 20:00 Europe/Zurich.
