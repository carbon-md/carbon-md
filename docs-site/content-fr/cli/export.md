# carbon-md export

Construit les artefacts publics : une page de registre, un badge pour le README, et l'export exploitable par machine.

```bash
npx carbon-md export [--out <dir>]
```

Le répertoire de sortie par défaut est `public/`.

## Ce qu'il écrit

| Fichier | Rôle |
|---|---|
| `index.html` | page de registre autonome (aucun JS, aucune ressource externe) |
| `badge.svg` | badge statique pour votre README |
| `ledger.json` | l'export de données vérifiable |

```
✔ Exported public ledger to /path/public
  index.html · badge.svg · ledger.json

Publish it:
  Cloudflare Pages:  wrangler pages deploy public --project-name carbon-md-ledger
  GitHub Pages:      commit the folder and enable Pages
  Badge in README:   ![carbon.md](https://YOUR-LEDGER-URL/badge.svg)
```

## La page

Elle affiche les émissions du mois et depuis toujours (avec les fourchettes), la position de contribution vis-à-vis de la politique, une ventilation par modèle et par source, et chaque contribution avec un lien vers son reçu. Elle indique clairement que les émissions sont **estimées, et non mesurées**, nomme la version de la méthodologie, et ne formule aucune revendication de neutralité. Voir [Claims & conformité](/fr/guides/claims/).

## `ledger.json`

Le résumé exploitable par machine — ce qu'un tiers peut contrôler :

```jsonc
{
  "project": "my-project",
  "generated_at": "2026-08-01 09:12 UTC",
  "methodology": "carbonmd-factors-2026-08",
  "policy": { "contribution_target": 1.1, "portfolio": "removal-weighted", … },
  "totals": {
    "estimated_gco2e": { "low": 810, "central": 1510, "high": 2900, "calls": 128, "tokens": 873412 },
    "contributed_tonnes": 0.005,
    "target_tonnes": 0.0017,
    "met": true
  },
  "contributions": [ … ],
  "events_count": 412
}
```

> Ce fichier est le germe du **Passeport Carbone** : le même résumé, signé et ancré à des reçus on-chain, pour qu'un inconnu puisse le vérifier par programme. Voir [`passport`](/fr/cli/passport/) et [Feuille de route](/fr/roadmap/).

## Badge

```markdown
![carbon.md](https://votre-url-de-registre/badge.svg)
```

Le badge reflète la réalité : `X matched ✔` une fois la cible de contribution atteinte, sinon `X tracked`.

## Notes

- **Régénérez après chaque contribution** — la page est un instantané statique.
- Si `reporting.public_ledger` vaut `false` dans votre politique, `export` vous avertit avant publication.
- Tout est autonome : aucune analytique, aucune police externe, aucune requête tierce.

Voir [Publier votre ledger](/fr/guides/publish-ledger/) pour l'hébergement.
