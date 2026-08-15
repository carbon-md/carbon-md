# Concepts

Le modèle qui sous-tend carbon.md, et pourquoi chaque pièce a la forme qu'elle a.

## La boucle

```
mesurer  →  gouverner  →  contribuer  →  prouver
   ↑                                        │
   └──────────────  le registre  ───────────┘
```

**Mesurer.** Les agents émettent par l'inférence. On ne peut pas gouverner ce qu'on ne compte pas : la capture se fait donc aux goulots d'étranglement — une intégration par frontière de fournisseur, pas par application.

**Gouverner.** Un fichier Markdown à la racine du dépôt porte la politique : quelle fraction des émissions compenser, quel portefeuille, combien peut être dépensé par mois, et au-dessus de quel montant un humain doit confirmer. Le fichier est l'interface — lisible par des personnes, analysable par des outils, et ingérable par les agents qu'il gouverne.

**Contribuer.** Les émissions sont compensées par l'achat et le retrait de crédits carbone vérifiés. Mensuellement et de façon agrégée, jamais en micro-transactions par appel.

**Prouver.** Chaque retrait produit un reçu. La page de registre et le badge renvoient aux numéros de série des registres et, sur le rail on-chain, à une transaction que n'importe qui peut vérifier.

## Le fichier est l'interface

Pensez `AGENTS.md`, mais pour l'empreinte environnementale de vos agents — inspiré de l'approche « un fichier Markdown est l'interface » d'[auth.md](https://workos.com/auth-md).

Cela compte plus qu'il n'y paraît. Les agents lisent déjà le Markdown des dépôts. Une politique exprimée sous forme de fichier permet à un agent de *découvrir* ses propres contraintes, d'agir dans leurs limites et de les expliquer — sans appel de SDK, sans connexion à un tableau de bord, et sans un humain dans la boucle à chaque décision.

## Des estimations, pas des mesures

Les fournisseurs d'inférence cloud ne publient pas la consommation énergétique par requête. Quiconque avance un chiffre précis au gramme près devine avec assurance. carbon.md, à la place :

- stocke et affiche partout une fourchette **bas / central / haut**,
- épingle une **méthodologie versionnée** (`carbonmd-factors-2026-08`) pour que les chiffres soient comparables au sein d'une version,
- élargit la fourchette quand un modèle n'a pas de facteur publié, et signale l'estimation comme devinée,
- **exclut les tokens de lecture de cache** des estimations (servir depuis le cache de prompt coûte bien moins cher qu'une passe avant complète), tout en les enregistrant.

Voir [Méthodologie & facteurs](/fr/methodology/).

## Contribution, pas neutralité

carbon.md ne génère délibérément jamais les mots « neutre en carbone » ni « climate positive ». Deux raisons :

1. **Juridique.** La directive européenne ECGT interdit les allégations de neutralité fondées sur la compensation pour les produits destinés aux consommateurs, à partir du 27 septembre 2026.
2. **Honnêteté.** Compenser des émissions par des achats de removal est une *contribution* ; cela ne dés-émet pas le CO₂.

Le texte généré dit : *ce projet mesure les émissions de ses agents et les compense à X % par des crédits carbone vérifiés.* Voir [Claims & conformité](/fr/guides/claims/).

## Removal-weighted par défaut

Le portefeuille par défaut privilégie le **removal durable** (biochar, DAC, alcalinité océanique) aux crédits d'évitement bon marché. Le removal coûte plus cher à la tonne et il est plus difficile à acheter — c'est précisément pour cela qu'il est le défaut. Les pools on-chain riches en évitement sont faciles à acheter et difficiles à défendre.

## Les humains financent, les agents exécutent

La seule chose qu'un agent ne doit jamais faire seul est de déplacer de l'argent. carbon.md l'impose deux fois :

- **Politique (plafond souple)** — la CLI refuse de dépenser au-dessus de `approval_above`, ou au-delà de `monthly_budget_max` sur le mois en cours.
- **Approvisionnement (plafond dur)** — le wallet de l'agent est prépayé. Son solde *est* le rayon d'explosion. Un agent ne peut physiquement pas dépenser ce qui n'a jamais été déposé.

Les retraits sont irréversibles. C'est cette asymétrie qui place le garde-fou humain sur l'approvisionnement et l'approbation, et non sur la mesure.

## Local d'abord

Tout fonctionne sans compte : le registre est un fichier JSONL dans `.carbon-md/`, la politique est un fichier de votre dépôt, et `export` produit du HTML statique que vous pouvez héberger n'importe où. Les services hébergés sont des commodités optionnelles, jamais une dépendance du standard.

## L'échelle de confiance

La vérification n'est pas binaire. Le [Passeport Carbone](/fr/cli/passport/) attribue un niveau que n'importe quel tiers peut re-dériver :

| Niveau | Signifie | Vérifié par |
|---|---|---|
| **L0** Déclaré | un fichier de politique existe | n'importe qui, automatiquement |
| **L1** Mesuré | usage réel enregistré, fourchettes affichées | automatiquement |
| **L2** Contribution vérifiée | les retraits respectent la politique, résolubles on-chain | automatiquement |
| **L3** Certifié | méthodologie + allégations auditées | carbon.md, via un [registre signé](/fr/certification/) |

L0 à L2 sont livrés et restent gratuits et vérifiables par machine, pour toujours — en local avec [`verify`](/fr/cli/verify/), ou via l'[API d'attestation](/fr/api/). Voir [Feuille de route](/fr/roadmap/).
