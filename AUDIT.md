# Audit Z. Express — 14 octobre 2026

Audit complet : véracité de la grille tarifaire, cohérence produit/prix, qualité technique.
Périmètre : code de l'application (front + fonctions backend + schémas de données) et état réel
de la base.

---

## 1. Grille tarifaire — chaque ligne vérifiée

| Annonce sur la grille | Statut | Ce qui la rend vraie |
| --- | --- | --- |
| 49 / 89 / 199 $ par mois | Réel | Table de prix unique côté client **et** recalculée côté serveur avant facturation (`base44/shared/pricing.ts`). Prix envoyé par le navigateur : jamais utilisé. |
| −15 % en annuel | Réel | `YEARLY_DISCOUNT = 0.15` appliqué au même endroit. Test : Pro annuel = 1 068 $ → **908 $** facturés, remise −160 $ affichée. |
| 1 mois offert | Réel | `TRIAL_DAYS = 30` ; l'abonnement est créé en `trialing` et le premier paiement est daté à J+30. |
| 4 $ par utilisateur supplémentaire | Réel | Calculateur → paiement → facture : `extra_seats` est transmis et facturé. |
| « Facturé au prix de la formule — sans frais supplémentaires » | Réel | Les frais du prestataire de paiement sont sortis du montant facturé ; ils restent enregistrés en interne pour votre comptabilité. |
| « Sans engagement, résiliable à tout moment » | **Rendu réel aujourd'hui** | La résiliation n'existait pas. Bouton « Résilier l'abonnement » + action serveur : statut `cancelled`, la formule court jusqu'à la fin de la période payée, plus rien n'est facturé. |
| 10 / 50 / 500 utilisateurs inclus | **Rendu réel aujourd'hui** | Le quota n'était affiché que sur la grille. Il est désormais appliqué côté serveur : au-delà du nombre d'utilisateurs vendu, l'ajout d'un membre est refusé avec un message clair (bilingue). |
| « Utilisateurs illimités » (Entreprise) | **Corrigé** | Faux : le code vend 500 utilisateurs. La grille dit maintenant « Jusqu'à 500 utilisateurs · multi-pays ». |
| « 1 ville · 1 hub » (Starter) | **Corrigé** | Cette limite n'est appliquée par rien. Reformulé en « opération mono-ville », sans promettre un verrou inexistant. |
| Zones tarifaires et surcharges | Réel | Entités `Zone` / `Surcharge`, page Portail → Tarification, calcul de devis par `quoteRate`. |
| Page de suivi à votre marque | **Rendu réel aujourd'hui** | Seul le nom de l'agence apparaissait. Le logo et la couleur de l'agence sont maintenant appliqués à la page publique de suivi. |
| Scan hub et caisse COD | Réel | `shipmentOps` (transitions d'état côté serveur) + entité `CodEntry` + page Portail → COD (collecte/règlement réservés aux rôles habilités). |
| Clés API et webhooks | Réel | Entités `ApiKey` / `WebhookEndpoint` / `WebhookDelivery`, API marchand (`merchantApi`), webhooks signés HMAC, limite de débit par clé. |
| Multi-villes / multi-pays | Réel | Les hubs, zones et expéditions ne sont liés à aucun pays en dur (`COUNTRIES` ISO + saisie libre de la ville). |
| SLA sur mesure, responsable dédié, support prioritaire 7j/7 | **Engagement commercial, pas logiciel** | Rien dans le code ne peut le garantir : c'est votre promesse. Le support existe bien (tickets, messages de contact, centre d'aide) mais « SLA » et « responsable dédié » doivent être honorés par vous. À retirer si vous ne les tenez pas. |

Conclusion : la grille ne contient plus aucune promesse logicielle non tenue ; il reste
trois engagements commerciaux (SLA, responsable dédié, support 7j/7) qui vous appartiennent.

---

## 2. Corrections livrées dans cet audit

1. **Facture = abonnement seul.** Le montant facturé incluait les frais du prestataire ; c'est
   corrigé (frais suivis en interne, jamais refacturés).
2. **Résiliation réelle.** Action `cancel` côté serveur + interface bilingue avec confirmation.
3. **Quota d'utilisateurs appliqué.** Le nombre d'utilisateurs vendu est la limite réelle de
   l'équipe ; message bilingue expliquant comment ajouter des utilisateurs.
4. **Grille alignée sur le produit.** Suppression de « illimité » et des limites ville/hub non appliquées.
5. **Page de suivi à votre marque.** Logo + couleur de l'agence sur la page publique de suivi.

---

## 3. Audit technique — points vérifiés

- **Traductions :** 891 clés utilisées dans l'interface, **100 % définies en anglais et en français**,
  aucune clé manquante (aucun texte technique ne peut s'afficher à la place d'une phrase).
- **Isolation des données :** 20 entités, **toutes protégées par des règles d'accès multi-tenant**
  (propriétaire, membres de l'agence ou administrateur plateforme). Seule `User` n'en a pas :
  c'est l'entité gérée par la plateforme, c'est normal.
- **Sécurité des intégrations :** côté navigateur, seuls les dépôts et signatures de fichiers sont
  appelés ; aucune méthode d'intégration réservée au serveur n'est exposée au client.
- **Cohérence front / backend :** 8 fonctions appelées par l'interface, toutes existantes ; 3 autres
  (`merchantApi`, `marketplaceOrder`, `tenantPaymentMethods`) servent les API et webhooks externes.
- **Aucun texte inachevé** (TODO, exemple, brouillon) dans le code, hors exemples dans les champs de formulaire.
- **Point de vigilance :** la page de consentement OAuth (serveur MCP) n'est pas reliée au routeur.
  Sans conséquence tant qu'aucun serveur MCP n'est configuré ; à relier le jour où vous en activez un.

---

## 4. À améliorer ensuite (par priorité)

1. **Brancher l'encaissement.** Aucun prestataire de paiement n'est connecté : l'abonnement et la
   facture sont bien créés, mais la facture reste « en attente ». Il faut les clés API d'un PSP
   (Flutterwave, Paystack, Paddle, Korapay ou Stripe) et son webhook pour marquer les factures payées.
2. **Relance des impayés.** Statut `past_due` + relance automatique à l'échéance.
3. **Emails transactionnels :** facture, rappel à 3 jours de la fin d'essai, confirmation de résiliation.
4. **Découper les gros fichiers** (`i18nPortal.js` 1 405 lignes, `CreateShipment.jsx` ~30 Ko,
   `PortalShipmentDetail.jsx` ~18 Ko) en composants plus petits : ils approchent la limite d'édition.
5. **Carte live** (dispatch/suivi) et **notifications push mobiles**.
6. **Liens App Store / Google Play réels** et **domaine personnalisé** raccordé.

---

## 5. Fichiers touchés par cet audit

- `base44/functions/billingCheckout/entry.ts` — résiliation, montant facturé = abonnement seul.
- `base44/functions/teamMember/entry.ts` — quota d'utilisateurs du plan appliqué.
- `base44/shared/logistics.ts` — marque de l'agence renvoyée avec le suivi public.
- `src/pages/portal/PortalSubscription.jsx` — bouton et confirmation de résiliation.
- `src/pages/portal/PortalTeam.jsx` — message de dépassement de quota.
- `src/pages/Track.jsx` — logo et couleur de l'agence sur la page de suivi.
- `src/lib/i18n.js`, `src/lib/i18nPortal.js` — textes de la grille et nouvelles phrases (EN + FR).