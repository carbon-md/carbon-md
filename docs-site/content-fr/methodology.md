# Méthodologie & facteurs

Comment carbon.md transforme des tokens en grammes — et pourquoi chaque chiffre porte une fourchette.

## Version actuelle

```
carbonmd-factors-2026-08
```

Catalogue rafraîchi le **11 août 2026**. La version est épinglée dans votre `carbon.md` et estampillée sur **chaque événement du registre**. Les estimations ne sont comparables qu'au sein d'une même version. Lorsque les facteurs sont révisés, les anciens événements conservent leur estampille d'origine — nous ne réécrivons jamais l'histoire en silence.

## Le modèle

Les émissions sont estimées par appel, à partir des comptes de tokens et d'un facteur par classe de modèle :

```
weighted_ktokens = (output_tokens + 0.2 × input_tokens) / 1000
gCO2e            = class_factor × weighted_ktokens
```

Les tokens d'entrée sont pondérés à **0,2×** ceux de sortie : le prefill est parallèle et peu coûteux par token, le decode est séquentiel et coûteux.

### Facteurs par classe (gCO₂e pour 1 000 tokens de sortie)

| Classe | Bas | Central | Haut |
|---|---|---|---|
| `frontier` | 1,5 | 4,5 | 15 |
| `large` | 0,8 | 2,5 | 8 |
| `medium` | 0,2 | 0,8 | 2,5 |
| `small` | 0,03 | 0,15 | 0,6 |

### Dérivation

- les courbes de régression de la méthodologie [EcoLogits](https://ecologits.ai) (JOSS 2025), plus
- les divulgations publiques des fournisseurs (le chiffre médian par prompt publié par Google en 2025, les déclarations par requête d'OpenAI),
- converties avec une intensité de réseau électrique moyenne mondiale d'environ 400 gCO₂e/kWh,
- arrondies à un chiffre significatif d'honnêteté.

## Pourquoi les fourchettes sont larges

Parce que la vérité est incertaine, et que prétendre le contraire est le mode de défaillance de toute cette catégorie. Les inconnues :

- la taille et l'architecture du modèle (rarement divulguées),
- le batching et le taux d'utilisation du matériel au moment de l'inférence,
- le PUE du centre de données et l'**intensité carbone du réseau de la région** vers laquelle vous avez été routé,
- le fait que votre requête ait touché un cache, un chemin de décodage spéculatif ou un démarrage à froid.

Un chiffre unique et assuré au gramme près serait une fiction. Une fourchette est la forme honnête.

## Règles de comptage des tokens

| Type de token | Traitement | Pourquoi |
|---|---|---|
| `input` | pondération ×0,2 | le prefill est parallèle, peu coûteux par token |
| `output` | pleine pondération | le decode séquentiel domine la consommation |
| `cache_read` | **exclu**, enregistré dans `meta` | servir depuis le cache coûte bien moins cher ; le compter exagérerait |
| `cache_write` | dépend de la source — voir ci-dessous | la création de cache est une vraie passe avant |
| `reasoning` | dépend de la source — voir ci-dessous | ce sont des tokens générés |

L'exclusion des lectures de cache n'est pas cosmétique. Sur des charges de travail d'agents intensives, les lectures de cache dépassent couramment les tokens d'entrée d'un ordre de grandeur — les inclure gonflerait les empreintes d'un facteur plusieurs fois supérieur.

### Là où les sources diffèrent aujourd'hui

Les adaptateurs de capture ne traitent pas encore tous les types de tokens de façon identique. C'est dit franchement plutôt que lissé :

| Source | `cache_write` | `reasoning` |
|---|---|---|
| [`sync claude-code`](/fr/cli/sync/) | intégré à l'**entrée** | s/o |
| [`sync hermes`](/fr/cli/sync/) | enregistré dans `meta` uniquement | compté comme **sortie** |
| [`ingest`](/fr/cli/ingest/) | tel que fourni | tel que fourni |

Lorsqu'un type de token est enregistré dans `meta` sans être compté, l'estimation est **conservatrice — elle sous-déclare**. Sur les modèles à fort raisonnement, les tokens de raisonnement peuvent représenter 20 à 30 % du volume de sortie. Comme les comptes bruts sont préservés dans le registre, les empreintes pourront être recalculées lorsque la comptabilité sera unifiée dans une future version des facteurs — aucune donnée n'est perdue, seulement inutilisée pour l'instant.

## Classification des modèles

Les chaînes de modèles sont associées à une classe par correspondance de mots entiers (ainsi `gpt-5.4-mini` atterrit en `small`, tandis qu'un `gemini` seul reste intact jusqu'à ce que des marqueurs plus spécifiques correspondent).

### Règles (vérifiées dans cet ordre)

- **small** — `haiku`, `mini`, `flash`, `nano`, `lite`, `micro`, `gemma`, `phi`, `luna`, ou une étiquette de paramètres de `1b` à `14b` ; également `composer…fast`
- **frontier** — `opus`, `fable`, `mythos`, `ultra`, `heavy`, `sol`, `o3`, `o4`, `gpt-5.5` / `gpt-5.6-sol` complets, les fleurons Gemini Pro (`gemini-3.1-pro`…)
- **large** — `sonnet`, `terra`, `gpt-4*`, `gemini…pro` (non-frontier), `grok`, `kimi` / `k2` / `k3`, `deepseek` (hors flash), `qwen`, `glm`, `muse`, `codex`, `r1`, `mistral large`, `405b`, `command`
- **medium** — tout le reste, signalé comme **deviné**

### Exemples du catalogue actuel (août 2026)

| Classe | Exemples rencontrés en conditions réelles |
|---|---|
| **frontier** | `gpt-5.5`, `gpt-5.6-sol`, `claude-opus-5`, `claude-fable-5`, `gemini-3.1-pro-preview` |
| **large** | `gpt-5.6-terra`, `claude-sonnet-5`, `kimi-k2.6`, `kimi-k2.7-code`, `kimi-k3`, `grok-4.3`, `grok-4.5`, `deepseek-v4-pro`, `qwen3.7-max`, `glm-5.2` |
| **small** | `gpt-5.6-luna`, `gpt-5.4-mini`, `gemini-3.5-flash`, `gemini-3.6-flash`, `deepseek-v4-flash`, `grok-composer-2.5-fast` |
| **medium (deviné)** | chaînes inconnues, sans marqueur identifiable |

Une classification devinée est signalée dans `status` et élargit la fourchette rapportée. Si vous la voyez sur un modèle qui vous importe, c'est une invitation à [ouvrir une issue](https://github.com/carbon-md/carbon-md/issues) — chaque nouvelle correspondance améliore la table commune.

Voir aussi la page vivante [Catalogue modèles](/fr/models/) (mise à jour chaque semaine).

## Ce qui n'est pas compté (encore)

Des limites honnêtes, énoncées franchement :

- **Le calcul local** — un suivi de l'inférence sur l'appareil, à la CodeCarbon, est prévu mais pas livré. L'inférence cloud domine la plupart des empreintes d'agents.
- **L'amortissement de l'entraînement** — aucune répartition par requête crédible n'existe publiquement. Exclu plutôt qu'inventé.
- **Le matériel incorporé** et le transfert réseau — hors périmètre à cette précision.
- **Le routage régional** — nous supposons un réseau électrique moyen mondial, car les fournisseurs disent rarement quelle région vous a servi.

## Contribuer aux facteurs

La table de facteurs est versionnée dans le dépôt ouvert. Nouveaux modèles, meilleures divulgations et intensités régionales sont tous bienvenus sous forme de pull requests. La provenance compte davantage que la précision : citez la source de chaque chiffre que vous ajoutez.

> Construire le véritable jeu de données de facteurs d'émission par charge de travail pour les charges *agentiques* — qui n'existe nulle part aujourd'hui — est un objectif explicite de ce projet. Voir [Feuille de route](/fr/roadmap/).
