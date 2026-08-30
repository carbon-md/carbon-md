# Méthodologie & facteurs

## Version
```
carbonmd-factors-2026-08
```
Mis à jour le **2026-08-30** (nouveaux IDs seulement ; bandes gCO₂e inchangées).

## Formule
```
weighted_ktokens = (output_tokens + 0.2 × input_tokens) / 1000
gCO2e = class_factor × weighted_ktokens
```

| Classe | Bas | Central | Haut |
|---|---|---|---|
| frontier | 1.5 | 4.5 | 15 |
| large | 0.8 | 2.5 | 8 |
| medium | 0.2 | 0.8 | 2.5 |
| small | 0.03 | 0.15 | 0.6 |

## Classification
- **small** : mini, flash, luna, lite, fast, lightning, hy-mt / hunyuan-mt, ox-alpha (GLM-5.3-Flash), 1b–14b (dont 2.6b)…
- **frontier** : opus, fable, sol, gpt-5.5…
- **large** : sonnet, terra, kimi, deepseek, grok, qwen, glm, seed, sakana/namazu…
- **medium** : guessed

Détails : [Catalogue modèles](/fr/models/).
