# Conventions docs

Comment cette documentation est construite et étendue. **Chaque fonctionnalité est livrée avec sa documentation** — c'est la règle que cette page existe pour faire respecter.

## Où vivent les choses

```
docs-site/
├── nav.json          # structure de la barre latérale + registre des pages  ← ajoutez les pages ici
├── nav-fr.json       # idem, pour le français — enregistrez dans LES DEUX
├── build.mjs         # générateur statique sans dépendances
├── style.css         # tout le design system
├── content/          # la doc, en Markdown
│   ├── index.md
│   ├── cli/<commande>.md
│   └── guides/<sujet>.md
├── content-fr/       # les traductions françaises, en miroir de content/
├── functions/        # Cloudflare Pages Functions : middleware de langue + API /v1
├── static/           # copié tel quel dans dist/ (par ex. examples/passport.json)
└── dist/             # sortie de build (gitignorée) — dist/fr/ est le site français
```

## Build

```bash
node build.mjs              # → dist/ (EN) et dist/fr/ (FR)
node build.mjs --locale fr  # français seulement
node build.mjs --out public # sortie personnalisée
```

Un `node build.mjs` nu construit les **deux** langues. Nommer `--locale` ou `--out` ne construit que ce que vous avez nommé — et comme la passe EN épargne `dist/fr` au lieu de le supprimer, un build EN seul laisse le français silencieusement figé au lieu d'échouer.

Aucune dépendance, aucune installation, aucun réseau. Ça se construit sur un portable, en CI, ou depuis un agent sur un VPS sans accès npm. Le sous-ensemble Markdown est délibéré : titres, listes, tableaux, blocs de code, citations, liens, emphase, filets.

## Déploiement

```bash
npx wrangler pages deploy dist --project-name carbonmd-docs
```

Attachez ensuite `docs.carbonmd.dev` au projet Pages et ajoutez un enregistrement **CNAME** `docs → carbonmd-docs.pages.dev` (proxifié).

Le build émet aussi le contrat d'installation pour agents à `/agent`, `/agent.txt` et `/.well-known/carbon-md/agent.txt` (copié depuis `repo/agent.txt`), ainsi que `robots.txt` et `sitemap.xml`.

## Ajouter une page

1. Écrivez `content/<section>/<page>.md` **et** `content-fr/<section>/<page>.md`.
2. Enregistrez-la dans `nav.json` **et** `nav-fr.json`, dans la bonne section :

```json
{ "file": "cli/passport.md", "slug": "cli/passport", "title": "passport" }
```

3. Reconstruisez. La navigation, les liens précédent/suivant, le sitemap et la table des matières de la page se mettent à jour tout seuls.

## La règle : une fonctionnalité n'est pas finie tant qu'elle n'est pas documentée

Quand une fonctionnalité atterrit, le même changement ajoute :

| Type de fonctionnalité | Documentation requise |
|---|---|
| **Nouvelle commande CLI** | une page dans `content/cli/`, plus une ligne dans le tableau de la [vue d'ensemble CLI](/fr/cli/) |
| **Nouvelle source de capture** | une section dans [Recettes de capture](/fr/guides/capture/) + une ligne dans son tableau de compatibilité |
| **Nouveau champ de spéc.** | une sous-section dans [Le fichier carbon.md](/fr/spec/) |
| **Nouveau rail ou chemin d'argent** | une section dans [Retirements & reçus](/fr/guides/retirements/) + le modèle de sécurité |
| **Révision de la table de facteurs** | un incrément de version dans [Méthodologie](/fr/methodology/), les anciens événements gardent leur empreinte |
| **Nouvel endpoint hébergé** | une section dans [API d'attestation](/fr/api/), avec ses codes d'erreur |
| **Tout ce qui est visible pour l'utilisateur** | le retirer de [Feuille de route](/fr/roadmap/) une fois livré |
| **Chacun des points ci-dessus** | la page française, dans le même changement — voir ci-dessous |

## Les deux langues, ou aucune

Une page qui n'existe qu'en anglais est une page que les lecteurs francophones ne peuvent pas utiliser ; une page française en retard est pire, car elle a l'air à jour sans l'être. Un changement atterrit donc dans `content/` et `content-fr/` ensemble, enregistré dans les deux fichiers de navigation.

Traduisez la prose et les en-têtes de tableaux. Laissez les commandes, flags, JSON, YAML et sorties de CLI exactement tels quels — un lecteur les retape. Les liens internes prennent le préfixe `/fr`. Les termes que l'écosystème emploie en anglais (`removal`, `avoidance`, x402, rail) restent en anglais ; pour le reste, *registre*, *retrait*, *ancres*, *fourchettes*.

Si une traduction ne peut vraiment pas être terminée dans le même changement, mieux vaut le dire explicitement sur la page que de livrer de l'anglais sous une bannière et de l'oublier.

## Style de la maison

- **Montrer la commande, puis la sortie.** La vraie sortie, pas une version idéalisée.
- **Énoncer les limites franchement.** Ce qui n'est pas compté, ce qui est deviné, ce qui est supposé. La crédibilité est le produit.
- **Des fourchettes, toujours.** Ne jamais présenter un chiffre d'émission ponctuel comme un fait.
- **Langage de contribution uniquement.** Jamais « neutre » ni « positif » — voir [Claims & conformité](/fr/guides/claims/).
- **Marquer le travail non livré `(prévu)`** et renvoyer vers [Feuille de route](/fr/roadmap/). Ne jamais documenter quelque chose comme si cela existait.
- **Lier latéralement.** Chaque page se termine par des pages liées ; un lecteur ne doit jamais tomber dans une impasse.
- **Deuxième personne, présent, phrases courtes.** Expliquer le *pourquoi* une fois, puis s'effacer.

## Versionnage

La documentation suit la CLI livrée. Quand le comportement change :

- mettez à jour la page dans le même changement que le code,
- si le changement casse la compatibilité, dites-le explicitement sur la page,
- les révisions de table de facteurs reçoivent une nouvelle chaîne de version — jamais une modification silencieuse.

## Contribuer

La documentation vit dans le même dépôt que le code : [github.com/carbon-md/carbon-md](https://github.com/carbon-md/carbon-md). Les corrections sont aussi bienvenues que les fonctionnalités — surtout partout où la doc exagère ce que l'outil fait réellement.
