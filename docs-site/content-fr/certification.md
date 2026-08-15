# Certification & registre

**Le L3 est le seul niveau que vous ne pouvez pas vous délivrer vous-même.** Les niveaux L0 à L2 se dérivent de votre passeport : n'importe qui peut les recalculer, aucune permission n'intervient, et ils sont gratuits pour toujours. Le L3 affirme qu'un humain a examiné la méthodologie, les reçus et les allégations publiques — et cette affirmation ne vaut quelque chose que parce qu'elle peut être retirée.

> **Personne n'est certifié à ce jour.** Le registre est en ligne et signé, et il contient zéro entrée. C'est l'état de départ honnête, et cette page ne prétendra pas le contraire.

## Le registre

Un document unique et signé, servi à :

```
https://docs.carbonmd.dev/.well-known/carbon-md/registry.json
```

```bash
npx carbon-md registry verify https://docs.carbonmd.dev/.well-known/carbon-md/registry.json
```

Il liste chaque sujet certifié, le palier, la fenêtre de validité et chaque révocation. Il est committé dans le dépôt public : l'historique de qui a été certifié — et pourquoi une certification a pris fin — est donc auditable, et pas seulement son état courant.

## Ce qui le rend digne de confiance

Trois propriétés, chacune fermant un trou précis :

**L'émetteur est épinglé dans le code, pas lu dans le document.** Un registre qui nommerait son propre émetteur ne certifierait rien : n'importe qui pourrait signer un fichier disant « je suis l'émetteur, et je suis certifié ». Le vérificateur connaît le DID de l'émetteur et l'URL du registre sans que les données qu'il contrôle le lui apprennent. Passer `--registry` ou `--registry-issuer` les remplace, et la CLI annonce alors clairement que le résultat n'est pas une certification carbon.md.

**Le registre expire, indépendamment de chacune de ses entrées.** Trente jours. Sans cela, une copie mise en cache la veille d'une révocation continuerait indéfiniment de se porter garante d'un sujet révoqué, et la révocation ne serait qu'indicative. Le pire cas est désormais borné : un registre périmé n'accorde rien.

**Un contrôle qui échoue n'est jamais un succès.** Inaccessible, non signé, mauvais émetteur, expiré, altéré — tout se résout en `unchecked`, ce qui plafonne le résultat à L2. « Nous n'avons pas pu regarder » ne doit jamais se lire « nous avons regardé et n'avons rien trouvé », et ne doit surtout jamais accorder un niveau.

## Ce que la certification atteste

| Certifié | Jamais certifié |
|---|---|
| Conformité de méthodologie — bonne version de facteurs, fourchettes affichées | « neutre en carbone » |
| Les retraits de la période correspondent réellement à la cible de la politique | « climate positive » |
| Les revendications de removal sont adossées à de vrais crédits de removal | que les émissions ont été effacées |
| Discipline des allégations — le texte public emploie un langage de contribution | tout résultat que vous ne pouvez pas prouver |
| Contrôle de l'identité et des clés | |

Le certificat énonce : *« Vérifié : cet agent mesure ses émissions selon `<méthodologie>` et en contribue ≥`<cible>` % via du removal carbone vérifié pour `<période>`. »* Conforme à l'ECGT par construction — voir [Claims & conformité](/fr/guides/claims/).

## Paliers

| Palier | Pour | Revue | Prix indicatif |
|---|---|---|---|
| **Verified** (L2) | tout le monde | automatisée | **gratuit** |
| **Certified · Maker** | un projet indépendant ou un agent unique | méthodologie, reçus, examen des allégations | ~500 $/an |
| **Certified · Product** | un produit en production ou une petite flotte | ci-dessus + rattachement organisation + revue de méthodologie publiée | ~1,5–2 k$/an |
| **Certified · Enterprise** | flottes, liées CSRD | ci-dessus + export scope 3 + piste d'audit + SLA | sur mesure |

Renouvelé annuellement, car les retraits et les allégations sont re-contrôlés — la fraîcheur est tout l'intérêt d'un tampon à durée limitée.

## Le L3 ne remplace jamais les preuves

La certification se pose **par-dessus** un L2 authentique. Un sujet certifié dont les ancres cessent de se résoudre, ou dont la contribution s'avère être de l'évitement sous une politique removal, ne reste pas en L3 — il redescend au niveau que les preuves soutiennent. Le tampon atteste d'un processus ; il ne tient jamais lieu de reçus.

## Révocation

Révoquez en cas de retraits périmés, d'allégations interdites ou de compromission de clé :

```bash
npx carbon-md registry revoke --subject did:key:z6Mk… --reason "prohibited neutrality claim"
```

La ligne reste, marquée révoquée, plutôt que d'être supprimée — la trace publique de ce qui a pris fin et pourquoi *est* la responsabilité. Une entrée révoquée prime sur une entrée active pour le même sujet : un retrait ne peut donc pas être neutralisé en ajoutant une nouvelle ligne à côté.

En aval, la révocation est bruyante : [`/v1/badge`](/fr/api/) affiche `revoked` en rouge au lieu de retomber discrètement sur `L2 verified`, car un badge rassurant sur une certification retirée est précisément la défaillance que cette conception existe pour empêcher.

## Se faire certifier

1. Atteindre le **L2** — `carbon-md verify` doit être au vert sur votre passeport publié.
2. Postuler avec l'URL de votre passeport.
3. Revue humaine : méthodologie, reçus, et les allégations de vos pages publiques.
4. Votre DID sujet est ajouté au registre, qui est re-signé puis déployé.

L'essentiel de l'étape 3 est le même contrôle automatisé que vous pouvez lancer vous-même ; ce que vous payez, c'est le jugement — et la disposition à le retirer.

## Hors ligne

Le L3 ne peut pas être établi sans le registre : `verify --offline` plafonne donc à L2 et le dit. Les contrôles de signature, de fraîcheur et de mesure tournent toujours sans réseau — une CI isolée continue de fonctionner, elle ne peut simplement pas confirmer une certification.

## Voir aussi

- [registry](/fr/cli/registry/) — la référence de commande côté émetteur
- [verify](/fr/cli/verify/) — comment un niveau est re-dérivé
- [API d'attestation](/fr/api/) — les mêmes contrôles, hébergés
