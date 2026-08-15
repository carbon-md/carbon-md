# Catalogue modèles

Carte vivante de la correspondance **chaîne de modèle → classe d'émission** utilisée par `carbonmd-factors-2026-08`.

Cette page est pilotée chaque semaine (dimanche soir, Europe/Zurich) : les nouvelles sorties publiques et les modèles observés dans l'usage réel des agents sont classés, documentés ici, puis câblés dans `src/core/factors.ts`.

**Dernier pilotage :** 11 août 2026  
**Version des facteurs :** `carbonmd-factors-2026-08`

## Comment lire ceci

- Les classes alimentent les bandes de gCO₂e dans [Méthodologie & facteurs](/fr/methodology/).
- La correspondance est **heuristique et honnête** — les chaînes inconnues retombent en `medium` + `guessed: true`.
- Les marqueurs « small » l'emportent en premier (`mini`, `flash`, `luna`…), afin que les familles à paliers se classent correctement.

## Frontier

Fleurons à haute capacité. Central : **4,5 gCO₂e / 1 000 tokens de sortie**.

| Famille | Identifiants d'exemple |
|---|---|
| OpenAI | `gpt-5.5`, `gpt-5.6-sol`, `o3`, `o4` |
| Anthropic | `claude-opus-5`, `claude-fable-5`, `*mythos*` |
| Google | `gemini-3.1-pro-preview`, `*ultra*` |

## Large

Modèles de labeur pour le code et les agents. Central : **2,5 gCO₂e / 1 000 tokens de sortie**.

| Famille | Identifiants d'exemple |
|---|---|
| OpenAI | `gpt-5.6-terra`, `gpt-4o`, `*codex*` |
| Anthropic | `claude-sonnet-5`, `*sonnet*` |
| xAI | `grok-4.3`, `grok-4.5`, `grok-4*` |
| Moonshot | `kimi-k2.6`, `kimi-k2.7-code`, `kimi-k3`, `kimi-for-coding` |
| DeepSeek | `deepseek-v4-pro`, `deepseek/deepseek-v4-pro` |
| Alibaba | `qwen/qwen3.7-max`, `qwen3*` |
| Zhipu | `z-ai/glm-5.2`, `glm-5*` |
| Meta | `muse*`, `muse-spark*` |
| Autres | `mistral-large*`, `command*`, `*405b*`, `*r1*` |

## Small

Paliers économiques / rapides. Central : **0,15 gCO₂e / 1 000 tokens de sortie**.

| Famille | Identifiants d'exemple |
|---|---|
| OpenAI | `gpt-5.6-luna`, `gpt-5.4-mini`, `*-mini`, `*-nano` |
| Google | `gemini-3.5-flash`, `gemini-3.6-flash`, `*-flash-lite*` |
| DeepSeek | `deepseek-v4-flash`, `deepseek/deepseek-v4-flash` |
| xAI | `grok-composer-2.5-fast` |
| Marqueurs | `haiku`, `flash`, `lite`, `micro`, `gemma`, `phi`, `1b`…`14b` |

> **Note de décision (pilotage 2026-08) :** `grok-composer-2.5-fast` est classé **small**, et non large.
> Le nommage `composer … fast` marque le palier économique/rapide de xAI, et la règle
> explicite `composer` + `fast` l'emporte sur la règle générique de famille `grok` → large.
> C'est un changement de comportement délibéré par rapport au catalogue antérieur à 2026-08 ;
> il abaisse l'estimation centrale de ce modèle de 2,5 à 0,15 gCO₂e / 1 000 tokens de sortie.

## Medium (deviné)

Tout ce qui ne porte aucun marqueur connu. Central : **0,8 gCO₂e / 1 000 tokens de sortie**, avec une fourchette élargie dans `status`.

Si votre modèle de production atterrit ici, ouvrez une issue ou attendez le pilotage hebdomadaire.

## Pilotage hebdomadaire

Chaque **dimanche à 20 h 00, Europe/Zurich**, Hermes :

1. Parcourt les notes de version publiques + la table `session_model_usage` de Hermes à la recherche de nouveaux identifiants de modèles
2. Propose des correspondances de classe (frontier / large / medium / small)
3. Met à jour `factors.ts` + cette page + les exemples de la méthodologie
4. Reconstruit et déploie [docs.carbonmd.dev](https://docs.carbonmd.dev)
5. Rapporte ce qui a changé

Aucune réécriture silencieuse des bandes de facteurs : les **valeurs** de classe (la table de gCO₂e) ne changent qu'avec un incrément de version explicite des facteurs et une revue humaine.

## Voir aussi

- [`carbon-md factors`](/fr/cli/factors/) — afficher la table active depuis la CLI
- [Méthodologie](/fr/methodology/) — dérivation et règles de comptage des tokens
- [Issues GitHub](https://github.com/carbon-md/carbon-md/issues) — proposer une correspondance
