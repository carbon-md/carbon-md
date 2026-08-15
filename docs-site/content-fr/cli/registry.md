# carbon-md registry

Maintient le registre de certification signé. **C'est la commande de l'émetteur** — il faut la clé d'émission pour écrire, et seul carbon.md la détient. Tous les autres utilisent `registry verify` pour lire.

```bash
npx carbon-md registry <init|list|add|revoke|sign|verify>
```

Voir [Certification & registre](/fr/certification/) pour ce que signifie le L3 et pourquoi le registre a cette forme.

## verify

La seule sous-commande que tout le monde peut utilement lancer :

```bash
npx carbon-md registry verify https://docs.carbonmd.dev/.well-known/carbon-md/registry.json
npx carbon-md registry verify --subject did:key:z6Mk…   # et contrôler un sujet
```

Sort avec un code non nul si la signature échoue ou si le registre a expiré : utilisable tel quel comme garde-fou en CI.

## init

```bash
npx carbon-md registry init
```

Crée la clé d'émission à `~/.carbon-md/registry-key.json` (mode `0600`) et écrit un registre vide et signé.

La clé vit **en dehors de tout répertoire de projet**, délibérément : elle signe des affirmations sur autrui, elle ne doit donc jamais être quelque chose qu'un dépôt puisse emporter par accident. La perdre signifie ré-émettre chaque certification sous une nouvelle identité — et changer avec elle le DID épinglé dans la CLI. Sauvegardez-la en privé.

## add

```bash
npx carbon-md registry add \
  --subject did:key:z6Mk… \
  --name "hermes" \
  --tier maker \
  --valid-until 2027-08-15 \
  --certificate-url https://carbonmd.dev/certified/hermes
```

| Flag | Signification |
|---|---|
| `--subject` | **requis** — le `did:key` du sujet, exactement tel qu'il figure dans son passeport |
| `--name` | **requis** — nom lisible pour la liste publique |
| `--tier` | `maker` \| `product` \| `enterprise` (défaut `maker`) |
| `--valid-until` | `AAAA-MM-JJ`, par défaut un an plus tard |
| `--methodology` | version de facteurs couverte par la revue |
| `--certificate-url` | le certificat public |
| `--note` | note de périmètre enregistrée avec l'entrée |

Refuse de certifier un sujet qui a déjà une entrée active — révoquez d'abord.

## revoke

```bash
npx carbon-md registry revoke --subject did:key:z6Mk… --reason "prohibited neutrality claim"
```

Marque l'entrée révoquée et re-signe. La ligne est conservée, pas supprimée.

**Une révocation n'est effective qu'une fois déployée.** Tant que le nouveau fichier n'est pas servi, les vérificateurs récupèrent toujours l'ancien — et l'edge le met en cache 5 minutes par-dessus.

## sign

```bash
npx carbon-md registry sign
```

Re-signe et re-date, prolongeant la validité de 30 jours. À lancer avant chaque déploiement — un registre qui expire en production cesse d'accorder le L3 à tout le monde d'un coup, silencieusement et correctement.

## list

Affiche le registre local avec l'état de la signature et chaque entrée.

## Comment fonctionnent les écritures

Chaque écriture re-signe et re-date le document entier. Il n'existe aucun moyen de modifier une ligne en laissant la preuve intacte — la signature couvre tout le contenu, ce qui rend détectable l'ajout d'une entrée après signature.

## Options

| Flag | Signification |
|---|---|
| `--file <chemin>` | travailler sur un registre autre que `docs-site/static/.well-known/carbon-md/registry.json` |
| `--issuer <did>` | (verify seulement) contrôler avec un autre émetteur — pour tester un registre auto-hébergé |

`CARBON_MD_ISSUER_KEY` remplace le chemin de la clé.

## Voir aussi

- [Certification & registre](/fr/certification/) — le modèle
- [verify](/fr/cli/verify/) — le côté consommateur
