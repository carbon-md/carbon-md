# Retirements & reçus

Comment des émissions deviennent du removal carbone financé et retiré — et comment n'importe qui peut vérifier que cela a bien eu lieu.

> **Un retrait est irréversible.** Un crédit retiré est définitivement sorti de la circulation, en votre nom. Toutes les propriétés de sécurité de carbon.md découlent de ce fait.

## Deux rails

| | **On-chain (x402 / Klima, Base)** | **Fiat (Carbonmark, CNaught…)** |
|---|---|---|
| Autonomie | totale — un agent peut régler sous plafond | l'humain achète, l'agent enregistre |
| Rapidité | quelques secondes | de quelques minutes à quelques jours |
| Reçu | transaction on-chain + URL de certificat | certificat depuis le tableau de bord |
| Qualité des crédits | **filtrer par méthodologie** — les pools on-chain penchent vers de l'évitement de millésime ancien | sélectionnés, de qualité removal |
| Mise en place | wallet USDC prépayé | une carte et un compte |

La plupart des premiers retraits se font en fiat. C'est très bien et c'est honnête — enregistrez-le avec `contribute --record` et le registre reste véridique.

## Le rail on-chain

Le rail de référence de carbon.md est l'endpoint **x402** de Klima sur Base (chaîne 8453).

```
discover → quote (methodology-filtered) → prepare-auth → sign → retire → certificate
```

Ce qui le rend utilisable par un agent :

- **Une seule signature.** Le wallet signe un unique `TransferWithAuthorization` USDC en EIP-712. Un exécuteur Klima soumet le retrait et prend le gas à sa charge.
- **USDC uniquement.** Pas d'ETH, pas d'approbation préalable, pas de smart account à configurer.
- **Preuve publique immédiate.** Vous obtenez un hash de transaction et une URL de certificat.

```bash
npx carbon-md wallet init     # créer la clé (sans fonds)
# → l'approvisionner d'un petit montant d'USDC sur Base (étape humaine)
npx carbon-md contribute --auto
```

## La qualité des crédits — la partie qui compte

Les marchés carbone on-chain rendent facile l'achat de la *mauvaise* chose : des crédits d'évitement bon marché, de millésime ancien. Si votre politique dit `removal-weighted`, l'autonomie sans filtre de qualité la trahirait en silence.

Donc : **filtrer par méthodologie au moment du devis**, privilégier le removal durable (biochar, DAC, alcalinité océanique), et toujours publier le numéro de série au registre et le millésime sur le reçu. Un retrait que vous ne pouvez pas relier à une entrée de registre n'est pas une preuve.

## Comment un crédit est classé

Le rail nomme ce qu'il vend ; carbon.md fait correspondre cela à une **méthode** et la stocke sur la contribution :

| Méthode | Signification |
|---|---|
| `removal` | la tonne a été retirée de l'atmosphère (biochar, DAC, alcalinité océanique, removal forestier) |
| `avoidance` | une émission a été évitée, pas retirée |
| `mixed` | un portefeuille couvrant les deux |
| `unspecified` | la description du rail ne le dit pas clairement — **jamais comptée comme removal** |

Deux règles rendent cela digne de confiance :

1. **L'évitement est testé en premier.** « Déforestation évitée » contient le mot *forêt* et ne doit pas se lire comme un removal forestier. Le cas ambigu se résout vers la revendication la plus faible, pas la plus forte.
2. **L'inconnu reste inconnu.** Une classe non reconnue est classée `unspecified` plutôt que devinée dans la colonne removal — car cette colonne porte toute la revendication du projet.

Sous `portfolio: removal-only`, seul `removal` acquitte la cible, et `contribute` refuse les classes non-removal avant même de demander un devis. Voir [contribute](/fr/cli/contribute/).

## Modèle de sécurité

Trois limites indépendantes, de la plus souple à la plus dure :

1. **Politique** — `approval_above` bloque toute dépense non surveillée au-dessus de votre seuil ; `monthly_budget_max` plafonne le mois.
2. **Solde prépayé** — le wallet ne contient que ce que vous y avez déposé. C'est de la physique, pas une promesse.
3. **Confirmation humaine** — au-dessus du seuil, un oui explicite est exigé, toujours.

Un agent peut créer un wallet, préparer un ordre et signaler ce dont il a besoin. Il ne doit jamais acquérir, ponter ni transférer des fonds. Voir [Pour les agents](/fr/guides/for-agents/).

## Enregistrer un achat effectué vous-même

```bash
npx carbon-md contribute --record \
  --tonnes 0.05 --cost 12.50 --currency USD \
  --rail carbonmark \
  --receipt "https://www.carbonmark.com/retirements/…"
```

Puis régénérez les artefacts publics :

```bash
npx carbon-md export
```

## Ce que montre un bon reçu

- le **tonnage** retiré et le **bénéficiaire** (vous ou votre agent),
- le **projet** et son **numéro de série au registre**, ainsi que l'année de **millésime**,
- un **lien que n'importe qui peut ouvrir** — un certificat on-chain ou une page de registre,
- la **version de méthodologie** utilisée pour dimensionner l'achat.

Moins que cela, c'est une affirmation, pas un reçu.

## Voir aussi

- [contribute](/fr/cli/contribute/) · [wallet](/fr/cli/wallet/) — référence des commandes
- [Claims & conformité](/fr/guides/claims/) — comment décrire tout ceci sans enfreindre la loi
