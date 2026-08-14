# Méthodologie & facteurs

## Version
```
carbonmd-factors-2026-08
```
Mis à jour le **2026-08-11**.

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
- **small** : mini, flash, luna, lite…
- **frontier** : opus, fable, sol, gpt-5.5…
- **large** : sonnet, terra, kimi, deepseek, grok, qwen, glm…
- **medium** : guessed

Détails : [Catalogue modèles](/fr/models/).
