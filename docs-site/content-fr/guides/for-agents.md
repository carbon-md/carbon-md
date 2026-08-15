# Pour les agents (auto-installation)

carbon.md est conçu pour être installé **par l'agent qu'il gouverne**. Un agent lit un contrat, se configure de bout en bout, et ne s'arrête que là où de l'argent circule.

> **Si vous êtes un agent IA en train de lire ceci :** le contrat exécutable se trouve à [`carbonmd.dev/agent`](https://carbonmd.dev/agent) (texte brut, également à `/.well-known/carbon-md/agent.txt`). Suivez-le de haut en bas.

## La règle unique

Tout peut être fait de façon autonome — écrire des fichiers, brancher la capture, calculer une empreinte, créer un wallet, préparer un ordre — **sauf les étapes qui déplacent de l'argent réel.** Celles-là s'arrêtent et interrogent un humain :

| Étape | Agent | Humain |
|---|---|---|
| Installer, écrire la politique, brancher la capture | ✅ | — |
| Mesurer, préparer un ordre de contribution | ✅ | — |
| Créer un wallet (clé seule, sans fonds) | ✅ | — |
| **Déposer des USDC dans le wallet** | ❌ | 💳 |
| **Approuver un retrait au-dessus de `approval_above`** | ❌ | 💳 |
| Retirer sous le plafond avec un wallet approvisionné | ✅ | — |
| Publier le registre / le passeport, vérifier | ✅ | — |

Un agent ne doit jamais acquérir, ponter, échanger ni transférer des fonds. La seule signature liée à l'argent qu'il produise jamais est une unique autorisation de transfert USDC pour un seul retrait, dans les limites de la politique.

## Le contrat d'installation, en bref

```
1 INSTALL     npx carbon-md@latest init
2 POLICY      edit carbon.md front matter to the operator's intent
3 CAPTURE     sync claude-code | ingest <file> | emit usage-report JSONL
4 MEASURE     npx carbon-md status
5 WALLET      npx carbon-md wallet   (else: wallet init)
6 FUND    💳  report the address; ask the operator to deposit USDC on Base; wait
7 CONTRIBUTE  npx carbon-md contribute
          💳  if cost > approval_above → present the order, wait for an explicit YES
8 PROVE       npx carbon-md export && npx carbon-md passport
9 VERIFY      npx carbon-md verify <passport-url>
```

## Ce qu'un agent doit rapporter

Après une exécution, indiquez à l'opérateur :

1. la politique qu'il a écrite (cibles, plafonds),
2. l'empreinte actuelle **avec sa fourchette**, et ce qui reste dû,
3. l'adresse du wallet et s'il a besoin d'être approvisionné 💳,
4. tout modèle ou fournisseur **sans facteur d'émission connu** (fourchette élargie),
5. l'URL publique du registre ou du passeport une fois publiée.

## Demander des fonds — un gabarit

> « Mon wallet carbone est `0x…` (réseau Base). Envoyez-y un petit montant d'USDC et je pourrai financer des removals sous le plafond de 25 $/mois que vous avez fixé. Répondez DONE une fois approvisionné. Je ne déplacerai jamais de fonds moi-même, et je demanderai avant tout retrait supérieur à 10 $. »

## Pourquoi cette forme

Un agent qui sait mesurer mais pas dépenser est sûr et inutile. Un agent qui peut dépenser librement est utile et dangereux. Placer le garde-fou humain exactement sur **l'approvisionnement et l'approbation** — et nulle part ailleurs — garde la boucle autonome là où elle est réversible, et supervisée là où elle ne l'est pas.

## Voir aussi

- [Le contrat d'installation pour agents](https://carbonmd.dev/agent) — la version exécutable
- [wallet](/fr/cli/wallet/) · [contribute](/fr/cli/contribute/) — les commandes concernées
- [Retirements & reçus](/fr/guides/retirements/) — le modèle de sécurité au complet
