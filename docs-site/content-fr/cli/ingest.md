# carbon-md ingest

Charge l'usage depuis un fichier ou stdin. Le chemin universel — si votre stack sait écrire du JSON, elle peut être comptabilisée.

```bash
npx carbon-md ingest <fichier>
npx carbon-md ingest -          # lire stdin
```

## Entrées acceptées

Le format est détecté automatiquement :

| Entrée | Détection |
|---|---|
| **JSONL usage-report** | un objet JSON par ligne, avec des champs de tokens |
| **Tableau JSON** | un tableau des mêmes objets |
| **JSON OTLP / OpenTelemetry** | aplatit `*.token.usage` et `gen_ai.client.token.usage` |

Les noms de champs et leurs alias sont documentés dans [Format usage-report](/fr/usage-report/).

## Exemples

```bash
# un journal d'usage écrit par votre agent
npx carbon-md ingest usage.jsonl

# un export OpenTelemetry — n'importe quel agent instrumenté OTel convient
npx carbon-md ingest otel-export.json

# directement depuis un pipeline
my-agent --emit-usage | npx carbon-md ingest -
```

## Idempotence

Les lots ingérés sont suivis dans `.carbon-md/sources/`. Ré-ingérer le même fichier ne compte pas deux fois. Dans le doute, `--dry-run` d'abord :

```bash
npx carbon-md ingest usage.jsonl --dry-run
```

## Sortie

```
✔ Ingested 412 events → ~1.2 kg CO2e central estimate, 2,910,004 tokens
  3 models were classified by guess — see `npx carbon-md factors`
```

## Dépannage

| Symptôme | Cause | Correctif |
|---|---|---|
| `0 events ingested` | champs non reconnus | vérifiez les noms dans [usage-report](/fr/usage-report/) |
| Tout est en `medium (guessed)` | chaînes de modèles inconnues du classifieur | ce n'est pas grave — les fourchettes s'élargissent ; envisagez une PR sur la table de facteurs |
| Les chiffres semblent trop élevés | lectures de cache comptées comme entrée | envoyez-les en `cache_read_tokens` ; elles sont alors exclues |
| Des totaux qui semblent dupliqués | mêmes données ingérées par deux chemins | une seule source par flux (`sync` **ou** `ingest`) |
