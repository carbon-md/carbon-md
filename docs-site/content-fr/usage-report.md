# Format usage-report

L'**interface de push**. Plutôt que d'écrire un scraper pour chaque agent, carbon.md nomme un format que n'importe quel agent capable de se suivre lui-même peut émettre. Si votre stack sait écrire une ligne de JSON par appel LLM, elle peut être comptabilisée en carbone.

## La forme

Un objet JSON par ligne (JSONL). Quatre champs seulement sont obligatoires.

```jsonl
{"ts":"2026-08-01T09:12:00Z","model":"gpt-5.5","input_tokens":18400,"output_tokens":2100}
{"ts":"2026-08-01T09:13:04Z","model":"claude-sonnet-4","input_tokens":9100,"output_tokens":840,"provider":"anthropic"}
```

| Champ | Obligatoire | Notes |
|---|---|---|
| `ts` | oui | horodatage ISO 8601 |
| `model` | oui | chaîne de modèle du fournisseur ; sert à classer le facteur d'émission |
| `input_tokens` | oui | tokens du prompt |
| `output_tokens` | oui | tokens générés |
| `provider` | non | par ex. `anthropic`, `openai`, `nous`, `openrouter` — améliore l'attribution |
| `cache_read_tokens` | non | enregistré dans `meta`, **exclu** de l'estimation |
| `cache_write_tokens` | non | compté comme entrée (la création de cache est du calcul réel) |
| `reasoning_tokens` | non | compté comme sortie (les tokens de raisonnement sont bel et bien générés) |
| `session_id` | non | clé de regroupement libre |

Des alias sont acceptés : `prompt_tokens`/`completion_tokens`, `tokens_in`/`tokens_out`, `input`/`output`.

Pour l'ingérer :

```bash
npx carbon-md ingest usage.jsonl
cat usage.jsonl | npx carbon-md ingest -
```

## OpenTelemetry

`ingest` détecte automatiquement OTLP/JSON et aplatit les métriques de tokens standard — `*.token.usage` et `gen_ai.client.token.usage` — de sorte que **n'importe quel agent instrumenté OTel fonctionne sans code spécifique**. Faites écrire votre collector dans un fichier, puis ingérez-le :

```bash
npx carbon-md ingest otel-export.json
```

Voir [Recettes de capture](/fr/guides/capture/) pour une configuration de collector.

## Pourquoi pousser plutôt que scraper

Scraper des transcriptions est fragile : les formats changent, et beaucoup d'agents n'écrivent jamais leurs comptes de tokens sur disque. Un format de push nommé signifie que :

- un agent peut rendre compte de **lui-même** sans que carbon.md sache quoi que ce soit de lui,
- les nouveaux frameworks ne demandent aucun travail de notre côté,
- le même chemin sert la journalisation à l'exécution, les reprises par lots et les pipelines OTel.

## Émettre depuis votre propre agent

N'importe quel langage, n'importe quel framework — la plupart des API compatibles OpenAI renvoient un objet `usage` à chaque réponse. Ajoutez une ligne par appel :

```js
const res = await client.chat.completions.create({ model, messages });
appendFileSync("usage.jsonl", JSON.stringify({
  ts: new Date().toISOString(),
  model: res.model,
  provider: "openai",
  input_tokens: res.usage.prompt_tokens,
  output_tokens: res.usage.completion_tokens,
}) + "\n");
```

C'est là toute l'intégration. Lancez `carbon-md ingest usage.jsonl` périodiquement (ou laissez votre agent le faire).

## Voir aussi

- [ingest](/fr/cli/ingest/) — référence de la commande
- [Recettes de capture](/fr/guides/capture/) — recettes par stack
- [Le fichier carbon.md](/fr/spec/) — comment les événements ingérés sont stockés
