# Démarrage rapide

De rien du tout à une empreinte mesurée en cinq minutes environ. Sans compte, sans clé d'API, sans qu'aucune donnée ne quitte votre machine.

## Prérequis

- **Node.js ≥ 18** (la CLI s'exécute via `npx`).
- Un répertoire de projet — la racine d'un dépôt, ou le répertoire personnel de l'agent dont vous voulez rendre compte.

## 1. Initialiser

```bash
npx carbon-md init
```

La commande détecte votre stack et écrit deux choses :

- **`carbon.md`** — votre fichier de politique, à la racine. Du Markdown lisible par un humain, avec un bloc de front-matter YAML.
- **`.carbon-md/`** — le stockage local (registre, état des sources, clés). Il est gitignoré ; rien n'est envoyé nulle part.

## 2. L'alimenter en usage

Choisissez ce qui correspond à votre configuration — l'objectif est de faire entrer les comptes de tokens dans le registre.

```bash
# Claude Code — lit les transcriptions locales, déduplique, idempotent
npx carbon-md sync claude-code

# Tout le reste — un JSONL d'usage, un export OTLP, un log LiteLLM…
npx carbon-md ingest usage.jsonl
```

`ingest` détecte automatiquement OTLP/JSON et aplatit les métriques de tokens OpenTelemetry standard : la plupart des frameworks d'agents fonctionnent donc sans colle spécifique. Recettes complètes : [Recettes de capture](/fr/guides/capture/).

## 3. Voir où vous en êtes

```bash
npx carbon-md status
```

```
carbon.md — my-project

  This month     412 g CO2e     (220 g – 780 g)     128 calls
  All time       1.51 kg CO2e   (810 g – 2.9 kg)    873,412 tokens

  Policy         110% contribution · removal-weighted
  Outstanding    0.0017 tCO2e  (~$0.10 at removal-weighted prices)
```

Chaque valeur porte une **fourchette bas–central–haut**. Ce n'est pas une précaution oratoire — c'est la forme honnête des données. Voir [Méthodologie & facteurs](/fr/methodology/).

## 4. Contribuer (quand vous êtes prêt)

```bash
npx carbon-md contribute
```

Prépare un ordre correspondant à `politique × empreinte`. Par défaut, la **confirmation vient d'abord** : rien n'est dépensé sans surveillance au-dessus de votre seuil `approval_above`. Pour laisser un agent régler de façon autonome sous un plafond strict, mettez en place un wallet prépayé — voir [Retirements & reçus](/fr/guides/retirements/).

## 5. Publier la preuve

```bash
npx carbon-md export
```

Écrit un dossier `public/` autonome — une page de registre, un `badge.svg` pour votre README, et `ledger.json` (l'export exploitable par machine). Hébergez-le où vous voulez. Voir [Publier votre ledger](/fr/guides/publish-ledger/).

```markdown
![carbon.md](https://votre-url-de-registre/badge.svg)
```

Pour aller plus loin, [`passport`](/fr/cli/passport/) signe ce résumé afin qu'un inconnu puisse le vérifier — en local avec [`verify`](/fr/cli/verify/), ou sans rien installer via l'[API d'attestation](/fr/api/).

## Ce qui vient de se passer

Vous avez créé une politique contrôlée par un humain, un chemin de mesure qu'un agent alimente automatiquement, et un artefact public qu'un inconnu peut contrôler. C'est toute la boucle : **mesurer → gouverner → contribuer → prouver**.

> **Ensuite :** [Concepts](/fr/concepts/) explique pourquoi la boucle a cette forme, ou passez directement au [fichier carbon.md](/fr/spec/) pour ajuster votre politique.
