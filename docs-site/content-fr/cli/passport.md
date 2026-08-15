# carbon-md passport

Signe un **Passeport Carbone** — le résumé de registre que vous publiez déjà, rendu vérifiable par un inconnu.

```bash
npx carbon-md passport [--out <dir>] [--kind agent|project|fleet] [--url <url-publique>]
```

Écrit `public/passport.json`, `public/passport.html` et `public/passport-badge.svg`, aux côtés des artefacts d'[`export`](/fr/cli/export/).

## Ce qu'il produit

```
Carbon Passport 0.1
  subject     hermes (agent)
  identity    did:key:z6Mko2Bjf9Tn9yAnwGEHToX4hyk2iJRcuFp2ZQB7KeiBg4kV
  emissions   285.0 gCO2e (93.0 gCO2e – 930.0 gCO2e)
  contributed 0.005 tCO2e · credited 0.005 · target 0.000314
  anchors     1
  expires     2026-11-13
```

## Le document

Le JSON signé porte votre identité, la période, la méthodologie épinglée, votre politique, les fourchettes d'émissions et — la partie qui compte — les **ancres** : une par retrait, avec le hash de transaction, la classe de crédit, la méthode et l'URL du certificat.

```jsonc
{
  "carbon_passport": "0.1",
  "subject": { "id": "did:key:z6Mk…", "name": "hermes", "kind": "agent" },
  "methodology": "carbonmd-factors-2026-08",
  "policy": { "contribution_target": 1.1, "portfolio": "removal-only" },
  "estimated_gco2e": { "low": 93, "central": 285, "high": 930, "calls": 2, "tokens": 306000 },
  "contribution": {
    "target_tonnes": 0.000314, "contributed_tonnes": 0.005,
    "credited_tonnes": 0.005, "met": true,
    "anchors": [{ "rail": "x402:klima", "chain_id": 8453, "tx_hash": "0x…",
                  "method": "removal", "tonnes": 0.005, "certificate_url": "https://…" }]
  },
  "trust_level": "L2",
  "proof": { "type": "eddsa-jcs-2022", "verification_method": "did:key:z6Mk…#z6Mk…", "signature": "z…" }
}
```

> **Le `trust_level` inscrit dans le document est indicatif.** [`verify`](/fr/cli/verify/) le re-dérive à partir des preuves et ne fait jamais confiance à la revendication — un « L3 » falsifié n'est tout simplement pas soutenu par les faits.

## Identité

Le premier lancement crée une paire de clés **Ed25519** exprimée en `did:key`. La clé publique voyage à l'intérieur du DID lui-même : n'importe qui détenant le passeport peut donc vérifier la signature **hors ligne** — sans compte, sans registre, sans serveur.

La clé vit dans `.carbon-md/passport-key.json` (mode `0600`, ignoré par git). **Sauvegardez-la en privé** : la perdre signifie ré-émettre sous une nouvelle identité.

## Fraîcheur

Les passeports expirent après **90 jours**. C'est délibéré : une revendication de contribution que personne n'a réaffirmée depuis trois mois ne devrait pas continuer à s'affirmer toute seule. Relancez la commande pour ré-émettre.

## La page publique

`passport.html` est une page autonome (aucun JS, aucune ressource externe) qui affiche le niveau, les fourchettes, la position de contribution, chaque ancre avec son lien vers le certificat ou la transaction — et un encadré **« Vérifiez par vous-même »** avec la commande exacte. Utilisez `--url` pour y inscrire l'adresse publique définitive du passeport.

## Notes

- Sans retrait, un passeport reste honnête mais plafonné à **L1 (mesuré)** — la commande le dit à la génération.
- `credited_tonnes` respecte votre portefeuille : sous `removal-only`, les achats d'évitement sont déclarés mais n'acquittent pas la cible. Voir [Le fichier carbon.md](/fr/spec/).
- La signature couvre tout le document sauf la preuve, canonicalisé (clés triées, aucun espace superflu) afin que signataire et vérificateur s'accordent octet par octet.

## Voir aussi

- [verify](/fr/cli/verify/) — vérifier un passeport
- [export](/fr/cli/export/) — la page publique et le badge qu'il complète
