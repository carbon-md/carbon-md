# Claims & conformité

Ce que vous pouvez dire d'un registre carbon.md — et ce que vous ne devez pas dire. C'est une contrainte de conception du standard, pas un avertissement juridique ajouté après coup.

> **Ceci n'est pas un conseil juridique.** Si vous formulez des allégations environnementales à titre commercial dans l'UE, faites-les relire.

## La règle

**Ne revendiquez jamais la neutralité.** Dites ce qui s'est réellement passé :

| ✅ À dire | ❌ À ne jamais dire |
|---|---|
| « mesure les émissions de ses agents et contribue à hauteur de 110 % via du removal carbone vérifié » | « neutre en carbone » |
| « compensé par des crédits carbone vérifiés » | « climate positive » |
| « émissions estimées, avec fourchettes d'incertitude » | « compense vos émissions » |
| « a financé le retrait de X tCO₂e » | « IA zéro émission » |

## Pourquoi

**Juridiquement** — la directive européenne *Empowering Consumers for the Green Transition* (ECGT) interdit les allégations environnementales, sur les produits destinés aux consommateurs, qui reposent sur la compensation ; elle s'applique à partir du **27 septembre 2026**. « Neutre en carbone grâce à la compensation » devient interdit, et pas seulement mal vu.

**Sur le fond** — compenser des émissions par un achat de removal est une *contribution*. Le CO₂ a tout de même été émis. Le removal prend du temps et porte sa propre incertitude. Appeler cela « neutre » exagère ce qui s'est produit — or toute la valeur de ce projet repose sur le fait de ne pas exagérer.

## Ce que l'outillage fait pour vous

carbon.md est construit pour que la formulation honnête soit celle par défaut et la malhonnête difficile à produire :

- Les pages et badges générés n'emploient qu'un langage de contribution.
- Chaque valeur est livrée avec une **fourchette bas–central–haut** — aucune fausse précision.
- Les pages indiquent **« estimé, non mesuré »** et nomment la version de la méthodologie.
- Les reçus renvoient aux numéros de série des registres et, sur le rail on-chain, à une transaction.
- Rien dans la spécification ne vous permet de déclarer un résultat que vous ne pouvez pas prouver.

## Rédiger votre propre texte

Un gabarit sûr :

> *`<projet>` mesure les émissions d'inférence de ses agents IA selon `<version de méthodologie>` (estimations avec fourchettes d'incertitude) et en contribue `<X>` % via du removal carbone vérifié. Registre et reçus de retrait : `<lien>`.*

Restez précis : nommez la méthodologie, montrez les fourchettes, liez les reçus.

## Pour le reporting d'entreprise

Les données du registre alimentent un reporting de type scope 3 pour les charges de travail IA, mais décrivez-les fidèlement : émissions **estimées** issues d'une **méthodologie ouverte et versionnée**, avec des contributions enregistrées séparément des émissions elles-mêmes. Les contributions ne se soustraient jamais de vos émissions déclarées — elles sont communiquées à côté. Un export orienté CSRD plus poussé est [prévu](/fr/roadmap/).

## Voir aussi

- [Concepts — contribution, pas neutralité](/fr/concepts/)
- [Méthodologie & facteurs](/fr/methodology/) — l'incertitude que vous devez communiquer
