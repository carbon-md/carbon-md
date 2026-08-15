# carbon-md init

Met en place la comptabilité carbone dans le répertoire courant.

```bash
npx carbon-md init
```

## Ce qu'il fait

1. **Détecte votre stack** — Claude Code, configurations LiteLLM/OpenRouter, projets LangGraph — afin de suggérer le bon chemin de capture.
2. **Écrit `carbon.md`** à la racine du répertoire courant, avec une politique de départ (contribution à 110 %, removal-weighted, plafond de 25 $/mois, seuil d'approbation à 10 $).
3. **Crée `.carbon-md/`** — le stockage local — et l'ajoute au `.gitignore`.

Rien n'est envoyé. Aucun compte n'est créé.

## Sortie

```
✔ Wrote carbon.md
✔ Created .carbon-md/ (gitignored)

  Policy    110% contribution · removal-weighted
  Budget    max $25/month · confirm above $10

  Next:  npx carbon-md sync claude-code
         npx carbon-md status
```

## Après l'exécution

Modifiez `carbon.md` pour qu'il corresponde à votre intention — voir [la référence du fichier](/fr/spec/) pour chaque champ. Puis branchez la capture : [Recettes de capture](/fr/guides/capture/).

## Notes

- **Peut-on le relancer sans risque ?** `init` refuse d'écraser un `carbon.md` existant. Supprimez ou modifiez le fichier à la place.
- **Où doit-il vivre ?** À la racine de ce dont vous rendez compte : la racine d'un dépôt pour un projet, ou le répertoire personnel d'un agent (par ex. `~/.hermes/`) pour un agent persistant.
- **Monorepos.** Un `carbon.md` par unité de comptabilité. Les commandes remontent l'arborescence depuis le répertoire de travail jusqu'au fichier de politique le plus proche.
