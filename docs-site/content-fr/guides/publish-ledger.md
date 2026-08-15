# Publier votre ledger

`export` produit un dossier statique autonome. Hébergez-le où vous voulez — l'important est qu'un inconnu puisse contrôler votre affirmation sans avoir à vous faire confiance.

```bash
npx carbon-md export
```

## Cloudflare Pages

```bash
npx wrangler pages deploy public --project-name my-carbon-ledger
```

Attachez un domaine personnalisé dans les réglages du projet Pages. Si vous utilisez un sous-domaine du type `carbon.example.com`, ajoutez un enregistrement **CNAME** pointant vers `<projet>.pages.dev` (proxifié).

## GitHub Pages

Committez le dossier de sortie et activez Pages sur ce répertoire :

```bash
npx carbon-md export --out docs
git add docs && git commit -m "Publish carbon ledger" && git push
# puis : Settings → Pages → Deploy from branch → /docs
```

## Vercel / Netlify / tout hébergeur statique

Pointez l'hébergeur sur le répertoire de sortie. Il n'y a aucune étape de build, aucun framework et aucun runtime — juste du HTML, un SVG et un fichier JSON.

## Le badge

```markdown
![carbon.md](https://votre-url-de-registre/badge.svg)
```

Liez-le à la page du registre, pour que le badge soit une porte et non une décoration :

```markdown
[![carbon.md](https://votre-url-de-registre/badge.svg)](https://votre-url-de-registre/)
```

## Le garder à jour

La page est un instantané. Régénérez-la après avoir synchronisé l'usage ou enregistré une contribution — un registre périmé est pire que pas de registre, car il exagère en silence l'actualité de votre preuve.

```bash
npx carbon-md sync claude-code && npx carbon-md export
```

Automatisez-le à côté de votre cron de capture :

```bash
0 3 * * * cd /chemin/vers/projet && npx carbon-md sync claude-code && npx carbon-md export && npx wrangler pages deploy public --project-name my-carbon-ledger
```

## Avant de publier

- Vérifiez `reporting.public_ledger: true` dans votre politique — `export` vous avertit sinon.
- Assurez-vous qu'aucune information sensible ne figure dans le nom du projet ni dans les libellés de sources (ils apparaissent sur la page).
- Relisez une fois le texte généré. Il doit dire *mesuré et contribué*, jamais *neutre*. Voir [Claims & conformité](/fr/guides/claims/).
