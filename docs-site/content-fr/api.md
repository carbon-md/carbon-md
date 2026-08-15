# API d'attestation

Un vérificateur hébergé pour les Carbon Passports, et un badge qui se re-vérifie à chaque requête.

URL de base : **`https://docs.carbonmd.dev`** · lecture seule · sans authentification · CORS ouvert.

> **L'API est une commodité, jamais l'autorité.** Un passeport se vérifie à partir du document lui-même : [`carbon-md verify`](/fr/cli/verify/) sur votre machine rend le même verdict, sans serveur. Un test de parité dans le dépôt garantit que les deux implémentations concordent — canonicalisation, signatures, et chaque barreau de l'échelle.

## `GET /v1/verify`

Récupère un passeport et le vérifie.

```bash
curl "https://docs.carbonmd.dev/v1/verify?url=https://votre-ledger/passport.json"
```

| Paramètre | Signification |
|---|---|
| `url` | **requis** — où se trouve le JSON du passeport |
| `offline=1` | ignore la vérification on-chain des ancres (le résultat plafonne alors à L1) |

## `POST /v1/verify`

Vérifier un document que vous détenez, sans le publier au préalable.

```bash
curl -X POST https://docs.carbonmd.dev/v1/verify \
  -H "content-type: application/json" \
  --data @public/passport.json
```

## Réponse

```jsonc
{
  "subject": "did:key:z6Mko2Bjf9Tn…",
  "subject_name": "hermes",
  "verdict": "verified",          // verified | invalid | stale
  "trust_level": "L2",            // re-dérivé des preuves
  "claimed_trust_level": "L2",    // ce que le document affirmait
  "signature_valid": true,
  "policy_target_met": true,
  "removal_ok": true,
  "anchors": 1,
  "anchors_resolved": "resolved", // resolved | none | offline
  "methodology": "carbonmd-factors-2026-08",
  "warnings": [],
  "verified_at": "2026-08-15T10:00:00Z"
}
```

`trust_level` est ce que les preuves soutiennent ; `claimed_trust_level` est ce que le document affirmait. Quand les deux diffèrent, croyez le premier — cet écart est précisément la raison d'être d'un vérificateur public.

| Statut | Quand |
|---|---|
| `200` | le document a été contrôlé (un verdict `invalid` reste un `200` — le contrôle a réussi, pas le passeport) |
| `400` | `url` manquante ou invalide, ou passeport inaccessible |
| `422` | la charge utile n'est pas un passeport carbon.md |
| `405` | méthode non autorisée |

Les réponses sont mises en cache 5 minutes : un verdict peut changer quand les ancres se confirment ou qu'un passeport expire.

## `GET /v1/badge`

Un badge qui **se re-vérifie à chaque requête** : un passeport altéré ou périmé retourne son propre badge. Une image statique peut dériver du réel ; celui-ci ne le peut pas.

```markdown
![carbon.md](https://docs.carbonmd.dev/v1/badge?url=https://votre-ledger/passport.json)
```

| Paramètre | Signification |
|---|---|
| `url` | **requis** — le JSON du passeport |
| `label` | texte de gauche (défaut `carbon.md`) |

| État | Affiche | Couleur |
|---|---|---|
| Contribution vérifiée | `L2 verified` | mousse |
| Mesure seule | `L1 verified` | vert sourd |
| Déclaré / sans preuve | `L0 verified` | ambre |
| Signature invalide | `unverified` | rouge |
| Expiré | `L1 stale` | ambre |
| Inaccessible | `unreachable` | gris |

Liez-le à votre page passeport, pour que le badge soit une porte et non une décoration :

```markdown
[![carbon.md](https://docs.carbonmd.dev/v1/badge?url=…/passport.json)](https://votre-ledger/passport.html)
```

## Un exemple vivant

Un vrai passeport signé est publié comme fixture, pour que chaque exemple de cette page soit exécutable :

```bash
curl "https://docs.carbonmd.dev/v1/verify?url=https://docs.carbonmd.dev/examples/passport.json"
```

![exemple](https://docs.carbonmd.dev/v1/badge?url=https://docs.carbonmd.dev/examples/passport.json)

C’est un **exemple** : usage synthétique, clé jetable, aucun retirement — il se vérifie donc en **L1**, jamais en L2. Il expire aussi, comme tout passeport. Le moment venu, le badge ci-dessus affichera `stale` au lieu de continuer à affirmer le contraire en silence ; c’est ce comportement qui mérite d’être vu.

## Ce qui est contrôlé

À l'identique du CLI :

1. **Signature** — Ed25519 sur le document canonicalisé (Web Crypto côté edge, `node:crypto` en local).
2. **Fraîcheur** — les passeports expirent après 90 jours.
3. **Mesure** — usage présent, fourchettes bien formées, méthodologie épinglée.
4. **Ancres** — chaque transaction est récupérée sur Base ; elle doit exister et ne pas avoir échoué.
5. **Politique** — tonnes créditées ≥ cible, et sous une politique removal chaque ancre comptée doit réellement être du removal.

## Pas encore disponible

Le **registre de certification signé** (`/.well-known/carbon-md/registry.json`), et donc le **L3**, ne sont pas livrés. D'ici là, un document revendiquant L3 est rapporté au niveau que ses preuves soutiennent. Voir [Feuille de route](/fr/roadmap/).

## Voir aussi

- [verify](/fr/cli/verify/) — les mêmes contrôles, en local
- [passport](/fr/cli/passport/) — en émettre un
