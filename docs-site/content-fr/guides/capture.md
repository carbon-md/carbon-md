# Recettes de capture

Faire entrer la consommation de tokens dans le registre, stack par stack. Le principe : **capturer aux goulots d'étranglement**, pas application par application. Une intégration à la frontière d'un fournisseur couvre tout ce qui se trouve derrière.

## Claude Code

Intégré — rien à configurer.

```bash
npx carbon-md sync claude-code
```

Lit les transcriptions locales, déduplique par id de message, conserve un état pour que les relances soient sans danger. Voir [`sync`](/fr/cli/sync/).

## LiteLLM

LiteLLM voit chaque fournisseur que vous routez à travers lui. Ajoutez un callback qui écrit une ligne d'usage :

```python
import json, datetime, litellm

def log_usage(kwargs, response, start, end):
    u = response.usage
    with open("usage.jsonl", "a") as f:
        f.write(json.dumps({
            "ts": datetime.datetime.utcnow().isoformat() + "Z",
            "model": response.model,
            "provider": kwargs.get("custom_llm_provider"),
            "input_tokens": u.prompt_tokens,
            "output_tokens": u.completion_tokens,
        }) + "\n")

litellm.success_callback = [log_usage]
```

```bash
npx carbon-md ingest usage.jsonl
```

## OpenRouter / toute API compatible OpenAI

Chaque réponse porte un objet `usage`. Une ligne par appel, et l'intégration est faite :

```js
const res = await client.chat.completions.create({ model, messages });
appendFileSync("usage.jsonl", JSON.stringify({
  ts: new Date().toISOString(),
  model: res.model,
  provider: "openrouter",
  input_tokens: res.usage.prompt_tokens,
  output_tokens: res.usage.completion_tokens,
}) + "\n");
```

## OpenTelemetry (tout agent instrumenté)

Si votre agent exporte des métriques OTel, c'est déjà fait — `ingest` aplatit `*.token.usage` et `gen_ai.client.token.usage`.

```yaml
# configuration du collector — écrire les métriques dans un fichier lisible par carbon-md
exporters:
  file:
    path: /var/log/otel/usage.json
service:
  pipelines:
    metrics:
      receivers: [otlp]
      exporters: [file]
```

```bash
npx carbon-md ingest /var/log/otel/usage.json
```

## Hermes (agent persistant auto-hébergé)

Intégré. Hermes enregistre déjà sa propre consommation de tokens par session, modèle et fournisseur de facturation — `sync hermes` lit cette base en **lecture seule** et n'ingère que ce qui est nouveau.

```bash
npx carbon-md sync hermes              # par défaut ~/.hermes/state.db
npx carbon-md sync hermes --db /chemin/vers/state.db --dry-run
```

Comme les compteurs de l'agent sont des totaux cumulés et non des événements en append-only, l'ingestion se fait **par delta** : sans danger à lancer toutes les heures depuis le cron de Hermes, en cours de session, sans double comptage. Les configurations multi-fournisseurs (Nous Research, OpenAI/Codex, Kimi, OpenRouter…) sont attribuées automatiquement par fournisseur. Voir [`sync`](/fr/cli/sync/) pour ce qui compte et ce qui ne compte pas.

## Votre propre agent

Émettez le [format usage-report](/fr/usage-report/) et ingérez-le. Quatre champs — `ts`, `model`, `input_tokens`, `output_tokens` — suffisent.

C'est aussi le chemin pour un agent qui veut rendre compte de **lui-même** : écrire une ligne par appel, ingérer périodiquement. Voir [Pour les agents](/fr/guides/for-agents/).

## Compatibilité des agents

| Agent / outil | Chemin de capture | Notes |
|---|---|---|
| Claude Code | `sync claude-code` | natif, livré |
| LiteLLM | callback → `ingest` | couvre tous les fournisseurs derrière lui |
| OpenRouter | `usage` de la réponse → `ingest` | |
| LangGraph / CrewAI | callback → `ingest` | callback SDK Python prévu |
| Tout agent OTel | OTLP → `ingest` | aucun code spécifique |
| Codex CLI | `ingest` depuis les logs de session | journalise des événements `token_count` dans `~/.codex/sessions` |
| Hermes | `sync hermes` | natif — lit sa propre base d'usage, en lecture seule, par delta |
| Cursor | Admin API uniquement | pas de journal d'usage local |
| Assistants fermés | non capturable | aucun usage exposé |

## Choisir une granularité

Les événements par appel donnent les ventilations les plus riches. Des lignes agrégées (par session, par modèle, par jour) conviennent aussi — le registre s'en moque, et `status` rapportera simplement moins d'événements, plus gros.

## Éviter le double comptage

Utilisez **un seul** chemin par flux de trafic. Si LiteLLM journalise déjà un appel, n'ingérez pas en plus l'export du même appel par le fournisseur. Les sources sont suivies séparément dans `.carbon-md/sources/`, mais deux sources différentes décrivant le même trafic compteront toutes les deux.
