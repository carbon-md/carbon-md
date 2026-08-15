# Feuille de route

Ce qui est conçu mais pas encore livré. Tout ce qui est marqué *prévu* dans cette documentation figure ici. Nous documentons une fonctionnalité au moment où elle atterrit — voir [Conventions docs](/fr/docs-conventions/).

## Livré aujourd'hui

| | |
|---|---|
| spéc. v0.1 + CLI de référence | `init` · `sync claude-code` · **`sync hermes`** · `ingest` · `status` · `contribute` · `wallet` · `export` · `factors` |
| capture | Claude Code, Hermes, JSONL usage-report, OTLP/OpenTelemetry |
| rail de retrait | x402 / Klima sur Base, wallet d'agent prépayé |
| preuve | page de registre publique, badge, `ledger.json`, passeport signé + page publique |
| vérification | `verify` en local, ou l'[API d'attestation](/fr/api/) hébergée — les mêmes contrôles dans les deux cas |

## Passeport Carbone + API d'attestation

**Livré (L0–L2) :** [`carbon-md passport`](/fr/cli/passport/) signe le résumé du registre comme un credential vérifiable (Ed25519, `did:key`, canonicalisé) avec des **ancres** de retrait ; [`carbon-md verify`](/fr/cli/verify/) re-dérive le niveau de confiance à partir des preuves — en contrôlant la signature, les fourchettes d'incertitude, les transactions on-chain sur Base, et si les ancres comptées relèvent réellement du removal. Fonctionne hors ligne pour tout sauf la consultation de la chaîne, et sort avec un code non nul pour servir de garde-fou en CI.

L'**API d'attestation hébergée** est livrée elle aussi : [`/v1/verify` et `/v1/badge`](/fr/api/) sur `docs.carbonmd.dev` rejouent exactement les mêmes contrôles côté edge, de sorte qu'un passeport peut être vérifié sans rien installer. Un test de parité empêche les deux implémentations de diverger.

**Encore à venir :** le registre de certification signé à `/.well-known/carbon-md/registry.json`, et la **certification L3** — le palier audité par des humains et révocable, qui constitue la surface payante.

## Comptabilité unifiée des tokens

Les adaptateurs de capture ne traitent pas encore les tokens `reasoning` et `cache_write` de façon identique — `sync hermes` les enregistre sans les compter, ce qui sous-déclare sur les modèles à fort raisonnement. Les comptes bruts sont préservés dans le `meta` de chaque événement du registre : une future version des facteurs pourra donc recalculer les empreintes historiques au lieu de les perdre. Voir [Méthodologie](/fr/methodology/).

## SDK Python + callbacks de frameworks

Un paquet Python `carbon-md` léger : un wrapper EcoLogits et un callback LangGraph exportant vers le même registre local. CrewAI et AutoGen suivront.

## Calcul local (CodeCarbon)

Suivi de l'inférence et de l'entraînement sur l'appareil. L'inférence cloud domine la plupart des empreintes d'agents, d'où un traitement en suivi rapproché plutôt qu'en v0.1.

## Consolidation par organisation

`organization_id` est déjà accepté dans le fichier de politique. Consolider les registres de plusieurs agents en une vue organisationnelle — et un export des émissions IA orienté CSRD — constitue la direction entreprise.

## Le jeu de données de facteurs

Il n'existe pas publiquement de facteurs d'émission réels par charge de travail et par modèle pour les charges *agentiques*. Les accumuler — avec provenance, versionnage et revue externe — est un objectif de long terme du projet, et la raison pour laquelle les fourchettes sont publiées plutôt que dissimulées.

---

Envie d'influencer ce qui atterrira ensuite ? [Ouvrez une issue](https://github.com/carbon-md/carbon-md/issues) — surtout avec une charge de travail réelle que nous devrions savoir mesurer et que nous ne mesurons pas.
