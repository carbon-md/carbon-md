# carbon-md sync

Récupère l'usage depuis une source connue et l'écrit dans le registre. Idempotent — sans danger à lancer périodiquement.

```bash
npx carbon-md sync <source> [options]
```

## Sources

| Source | Lit |
|---|---|
| `claude-code` | les transcriptions locales de Claude Code |
| `hermes` | la base d'usage d'un agent Hermes |

Tout le reste passe par [`ingest`](/fr/cli/ingest/) — voir [Recettes de capture](/fr/guides/capture/).

## sync claude-code

```bash
npx carbon-md sync claude-code              # les transcriptions de ce projet
npx carbon-md sync claude-code --all        # tous les projets
npx carbon-md sync claude-code --dir <chemin> # un répertoire de transcriptions précis
npx carbon-md sync claude-code --dry-run    # montrer ce qui serait ingéré
```

Lit `~/.claude/projects/…/*.jsonl`. Chaque message de l'assistant porte `message.usage` (comptes de tokens) et `message.model`.

**Comment il reste honnête :**

- **Déduplication par id de message.** Les réponses en streaming écrivent plusieurs entrées par message ; celle dont `output_tokens` est le plus élevé l'emporte.
- **État par fichier** dans `.carbon-md/sources/claude-code.json` — relancer ne compte jamais deux fois.
- **Tokens de cache** : `cache_creation` est intégré à l'entrée (c'est du vrai calcul) ; `cache_read` est enregistré dans `meta` mais exclu de l'estimation.
- Les modèles synthétiques (`<synthetic>`, etc.) sont ignorés.

### Sortie

```
✔ Synced 128 Claude Code messages (14 files) → ~412 g CO2e central estimate, 873,412 tokens
  run `npx carbon-md status` to see your position
```

## sync hermes

Pour les agents persistants de type [Hermes](https://github.com/carbon-md/carbon-md) qui enregistrent déjà leur propre consommation de tokens. Lit la base de l'agent en **lecture seule** — aucun callback, aucun chemin d'inférence modifié.

```bash
npx carbon-md sync hermes                    # par défaut ~/.hermes/state.db
npx carbon-md sync hermes --db /chemin/state.db
npx carbon-md sync hermes --dry-run
```

### Fonctionnement

Lit la table `session_model_usage` — une ligne par session × modèle × fournisseur de facturation, contenant `input_tokens`, `output_tokens`, `reasoning_tokens`, `cache_read_tokens`, `cache_write_tokens`.

**Ingestion par delta.** Contrairement aux transcriptions, ces lignes sont des *totaux cumulés mutables* : les compteurs d'une session active continuent de croître. Chaque exécution n'ingère donc que l'**incrément** depuis la dernière synchronisation, suivi par `session:model:provider` dans `.carbon-md/sources/hermes.json`. Une session synchronisée en cours de route puis à nouveau plus tard est comptée une seule fois, correctement.

**Multi-fournisseurs.** `billing_provider` est conservé sur chaque événement : un Hermes qui route vers plusieurs fournisseurs (Nous Research, OpenAI/Codex, Kimi/Moonshot, OpenRouter, Gemini, xAI) est attribué fournisseur par fournisseur.

**Accès à la base.** Utilise `node:sqlite` quand il est disponible (Node ≥ 22.5), avec repli sur la CLI `sqlite3`. Toujours ouverte en lecture seule — carbon.md n'écrit jamais dans la base de l'agent.

### Ce qui compte dans l'estimation

| Type de token | Compté ? | Où |
|---|---|---|
| `input_tokens` | ✅ pondéré à 0,2× | estimation |
| `output_tokens` | ✅ pleine pondération | estimation |
| `reasoning_tokens` | ❌ **non compté** | enregistré dans `meta` |
| `cache_write_tokens` | ❌ **non compté** | enregistré dans `meta` |
| `cache_read_tokens` | ❌ non compté | enregistré dans `meta` |

> **C'est délibérément conservateur — et cela sous-déclare.** Les tokens de raisonnement *sont* bel et bien générés (ils coûtent une passe avant complète), et les écritures de cache sont du calcul réel. Sur les modèles à fort raisonnement, ils peuvent représenter 20 à 30 % du volume de sortie. Ils sont capturés dans `meta` afin que le registre puisse être recalculé lorsque la comptabilité sera révisée. Voir [Méthodologie](/fr/methodology/).

### Sortie

```
✔ Synced 47 Hermes usage delta entries (1235 records checked) → ~2.10 kg CO2e central estimate, 4,102,883 tokens
  run `npx carbon-md status` to see your position
```

Rien de nouveau :

```
✔ Up to date — no new Hermes usage (1235 session-model records checked).
```

## Options

| Flag | S'applique à | Signification |
|---|---|---|
| `--all` | `claude-code` | Parcourir tous les répertoires de projets |
| `--dir <chemin>` | `claude-code` | Cibler un répertoire de transcriptions précis |
| `--db <chemin>` | `hermes` | Chemin de la base (par défaut `~/.hermes/state.db`) |
| `--dry-run` | les deux | Indiquer ce qui serait ingéré ; n'écrire rien |

## Automatisation

`sync` est conçu pour cron. Toutes les heures convient très bien — il ne fait rien quand il n'y a rien de nouveau.

```bash
0 * * * * cd /chemin/vers/projet && npx carbon-md sync hermes >/dev/null 2>&1
```
