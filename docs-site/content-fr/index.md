# Documentation carbon.md

**Un standard ouvert pour des agents IA gouvernés côté carbone.** Un fichier `carbon.md` à la racine de votre dépôt déclare la politique carbone de vos agents : comment leurs émissions sont estimées, quelle part est compensée par des contributions à du removal carbone vérifié, ce qu'ils ont le droit de dépenser, et où se trouve la preuve.

Les humains fixent la politique. Les agents l'exécutent. Tout est prouvable.

```bash
npx carbon-md init
```

> **Vous débarquez ?** Commencez par le [Démarrage rapide](/fr/quickstart/) — cinq minutes de l'installation à votre première empreinte. Lisez ensuite [Concepts](/fr/concepts/) pour comprendre la boucle.

## Ce que c'est

Les agents IA lancent des milliers d'appels LLM par jour. Leurs opérateurs ont trois mauvaises options : ignorer l'empreinte, souscrire à de lourdes suites carbone d'entreprise, ou formuler des allégations de compensation qui seront illégales dans l'UE à partir de septembre 2026. `carbon.md` est la quatrième option — une primitive petite, honnête et vérifiable :

1. **Mesurer** — la consommation de tokens est capturée aux goulots d'étranglement (Claude Code, LiteLLM, OpenTelemetry, n'importe quel journal d'usage) et convertie en estimations de CO₂e *avec des fourchettes d'incertitude explicites*.
2. **Gouverner** — un fichier de politique rédigé par un humain fixe les cibles de contribution, les plafonds budgétaires et les seuils d'approbation que les agents doivent respecter.
3. **Contribuer** — les émissions sont compensées par des achats de removal carbone vérifié (mensuellement, avec confirmation d'abord par défaut — les agents ne dépensent jamais sans surveillance au-dessus de votre seuil).
4. **Prouver** — chaque retrait obtient un reçu public ; le badge renvoie à un registre, pas à une impression.

## Ce que ce n'est pas

- **Pas une entreprise de tableaux de bord.** Le standard et la CLI sont gratuits et sous licence MIT, local d'abord, et fonctionnent sans aucun compte.
- **Pas une revendication de neutralité.** carbon.md ne dit jamais « neutre en carbone » ni « climate positive ». Il dit : *cet agent a mesuré X, et a contribué Y % via du removal vérifié — voici le reçu.* Voir [Claims & conformité](/fr/guides/claims/).
- **Pas de fausse précision.** L'inférence cloud est une boîte noire. Chaque chiffre est livré avec une fourchette bas–central–haut, et la [méthodologie](/fr/methodology/) est versionnée au grand jour.

## Où aller ensuite

| Si vous voulez… | Lisez |
|---|---|
| Être opérationnel en cinq minutes | [Démarrage rapide](/fr/quickstart/) |
| Comprendre le modèle | [Concepts](/fr/concepts/) |
| Écrire ou lire un fichier de politique | [Le fichier carbon.md](/fr/spec/) |
| Alimenter l'usage depuis votre stack | [Recettes de capture](/fr/guides/capture/) |
| Retrouver une commande | [Référence CLI](/fr/cli/) |
| Financer et prouver un retrait | [Retirements & reçus](/fr/guides/retirements/) |
| Faire vérifier un passeport sans rien installer | [API d'attestation](/fr/api/) |
| Laisser un agent l'installer lui-même | [Pour les agents](/fr/guides/for-agents/) |
| Savoir ce qui arrive ensuite | [Feuille de route](/fr/roadmap/) |

## Statut

La spécification est en **v0.1 (brouillon)** et la CLI de référence est publiée sur npm sous le nom [`carbon-md`](https://www.npmjs.com/package/carbon-md). Ce qui est étiqueté *prévu* dans cette documentation est conçu mais pas encore livré — nous documentons une fonctionnalité au moment où elle atterrit, et la documentation est versionnée avec le code. Voir [Conventions docs](/fr/docs-conventions/).
