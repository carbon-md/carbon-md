# carbon-md wallet

Le wallet prépayé de l'agent, utilisé pour les retraits autonomes. Une clé dédiée sur Base, approvisionnée d'un petit montant d'USDC — **son solde constitue le plafond de dépense absolu.**

```bash
npx carbon-md wallet          # afficher l'adresse + le solde
npx carbon-md wallet init     # en créer un (clé uniquement, aucun fonds)
```

## Créer

```bash
npx carbon-md wallet init
```

```
✔ Agent wallet created (Base)
  address  0xAbC…123
  key file .carbon-md/agent-wallet.json
  Fund it with USDC on Base (small amounts — its balance is the blast radius).
  Back the key file up privately. Never commit it; .carbon-md/ is gitignored.
```

Créer un wallet ne déplace aucun argent. Cela génère une clé, rien de plus. `init` refuse d'écraser un wallet existant.

## Inspecter

```bash
npx carbon-md wallet
```

```
Agent wallet (Base · x402 retirements only)
  address  0xAbC…123
  USDC     4.812
  key file .carbon-md/agent-wallet.json
```

## L'approvisionner

Envoyez de l'**USDC sur le réseau Base** (chain ID 8453) à cette adresse. Rien d'autre n'est nécessaire :

- **Pas d'ETH requis.** Le gas du retrait est relayé par le rail ; le wallet signe une unique autorisation de transfert USDC.
- **Approvisionnez petit.** Déposez à peu près ce que votre `monthly_budget_max` autorise. Un solde prépayé est un plafond physique qu'aucun bug logiciel ni aucune injection de prompt ne peut dépasser.
- **C'est une étape humaine.** Un agent peut créer le wallet et en communiquer l'adresse, mais ne doit jamais acquérir, ponter ni déplacer des fonds. Voir [Pour les agents](/fr/guides/for-agents/).

## Modèle de sécurité

| Propriété | Conception |
|---|---|
| Stockage de la clé | `.carbon-md/agent-wallet.json`, mode fichier `0600`, gitignoré |
| Finalité | retraits uniquement — jamais un wallet polyvalent |
| Rayon d'explosion | le solde déposé, par construction |
| Signatures | exactement une par retrait : une autorisation de transfert USDC EIP-712 |
| Garde-fous de politique | `approval_above` et `monthly_budget_max` vérifiés avant signature |

> **Sauvegardez le fichier de clé en privé** et ne le committez jamais. En cas de fuite, la perte maximale est le solde — ce qui est précisément la raison de l'approvisionner petit.

## Voir aussi

- [contribute](/fr/cli/contribute/) — ce qui dépense depuis ce wallet
- [Retirements & reçus](/fr/guides/retirements/) — le rail complet, les filtres de qualité et les reçus
