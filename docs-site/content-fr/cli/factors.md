# carbon-md factors

Affiche la table de facteurs active — ce sur quoi les estimations reposent réellement.

```bash
npx carbon-md factors
```

## Sortie

```
carbonmd-factors-2026-08
gCO2e per 1k output tokens · input weighted 0.2x

  class      low    central   high
  frontier   1.5      4.5     15
  large      0.8      2.5      8
  medium     0.2      0.8      2.5
  small      0.03     0.15     0.6

  Derived from EcoLogits methodology + public provider disclosures,
  ~400 gCO2e/kWh world-average grid. Estimates, not measurements.
```

Exemples de correspondance modèle → classe (catalogue vivant) : voir [Catalogue modèles](/fr/models/).

## Pourquoi c'est une commande

Parce que les chiffres doivent être inspectables sans lire le code source. Si quelqu'un conteste une valeur de votre registre, voici la réponse — la version, les bandes et la dérivation, à la demande.

## S'en servir pour auditer son propre registre

Chaque événement du registre porte la version des facteurs avec laquelle il a été calculé. Comparez :

```bash
npx carbon-md factors
grep -o '"factors":"[^"]*"' .carbon-md/ledger.jsonl | sort | uniq -c
```

Si plusieurs versions apparaissent, votre registre couvre une révision de méthodologie — c'est attendu avec le temps, et c'est précisément la raison d'être de cette empreinte. Les anciens événements ne sont jamais recalculés rétroactivement.

## Voir aussi

- [Méthodologie & facteurs](/fr/methodology/) — la dérivation complète, les règles de comptage des tokens et les limites
- [Contribuer aux facteurs](https://github.com/carbon-md/carbon-md) — nouveaux modèles et meilleures sources bienvenus
