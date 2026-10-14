// Help Center content. Each article carries both languages so the page follows
// the language switch without a network round trip.
export const HELP_TOPICS = [
  { id: 'partners', label: { en: 'New partners', fr: 'Nouveaux partenaires' } },
  { id: 'operations', label: { en: 'Operations', fr: 'Opérations' } },
  { id: 'api', label: { en: 'API & integrations', fr: 'API et intégrations' } },
  { id: 'merchants', label: { en: 'Merchants', fr: 'Marchands' } },
];

export const HELP_ARTICLES = [
  {
    id: 'launch-agency',
    topic: 'partners',
    updated: '2026-10-01',
    title: {
      en: 'Launch your agency in five steps',
      fr: 'Lancer votre agence en cinq étapes',
    },
    body: {
      en: [
        'Create your workspace from the onboarding form with your company name, country and contact details. Your agency space is created immediately and starts on a trial subscription.',
        'Add your hubs and agencies next, then your delivery zones. A zone holds the country it covers, its cities and the base rate, per-kilo and per-kilometre pricing your quotes are calculated from.',
        'Invite your dispatchers, hub supervisors and drivers from Permissions. Each role only sees the modules it needs.',
        'Generate an API key if your merchants will book through their own systems, or connect a marketplace so orders land in the portal automatically.',
        'Finally, book a test shipment to confirm pricing and tracking before you go live.',
      ],
      fr: [
        'Créez votre espace depuis le formulaire d’inscription avec le nom de votre entreprise, votre pays et vos coordonnées. Votre espace agence est créé immédiatement et démarre sur une offre d’essai.',
        'Ajoutez ensuite vos hubs et agences, puis vos zones de livraison. Une zone contient le pays couvert, ses villes et les tarifs de base, au kilo et au kilomètre utilisés pour vos devis.',
        'Invitez vos dispatchers, superviseurs de hub et chauffeurs depuis Permissions. Chaque rôle ne voit que les modules dont il a besoin.',
        'Générez une clé API si vos marchands réservent depuis leurs propres systèmes, ou connectez une marketplace pour que les commandes arrivent automatiquement dans le portail.',
        'Enfin, réservez une expédition de test pour valider la tarification et le suivi avant la mise en production.',
      ],
    },
  },
  {
    id: 'zones-pricing',
    topic: 'partners',
    updated: '2026-10-01',
    title: {
      en: 'How zones and surcharges build a price',
      fr: 'Comment les zones et surcharges composent un prix',
    },
    body: {
      en: [
        'A quote starts from the chargeable weight: the greater of the real weight and the volumetric weight (length × width × height ÷ 5000).',
        'The destination city is matched against your zones. If no city matches, the zone flagged as a remote area for that country is used.',
        'The zone pricing model then applies: flat, per kilo, per kilometre or tiered by weight. The minimum charge always wins if it is higher.',
        'Surcharges are added on top. Each rule can apply always, above a chargeable weight, above a volumetric weight, or on one specific zone — and can be a flat amount or a percentage of the base price.',
      ],
      fr: [
        'Un devis part du poids facturable : le plus élevé entre le poids réel et le poids volumétrique (longueur × largeur × hauteur ÷ 5000).',
        'La ville de destination est comparée à vos zones. Si aucune ville ne correspond, la zone marquée comme enclavée pour ce pays est utilisée.',
        'Le modèle tarifaire de la zone s’applique ensuite : forfait, au kilo, au kilomètre ou par paliers de poids. Le montant minimum l’emporte s’il est plus élevé.',
        'Les surcharges s’ajoutent au total. Chaque règle peut s’appliquer toujours, au-delà d’un poids facturable, au-delà d’un poids volumétrique ou sur une zone précise — en montant fixe ou en pourcentage du prix de base.',
      ],
    },
  },
  {
    id: 'hub-scanning',
    topic: 'operations',
    updated: '2026-09-24',
    title: {
      en: 'Scanning parcels in and out of a hub',
      fr: 'Scanner les colis à l’entrée et à la sortie d’un hub',
    },
    body: {
      en: [
        'Open Hubs and enter the tracking number in the scanning panel. A scan-in records that the parcel is on site and sets the shipment to “at hub”.',
        'A scan-out marks the parcel as in transit towards the next hub or the delivery round, and writes a public timeline event the customer can see on the tracking page.',
        'Every scan is timestamped with your hub name, which is what the activity log reports on.',
      ],
      fr: [
        'Ouvrez Hubs et saisissez le numéro de suivi dans le panneau de scan. Un scan d’entrée enregistre la présence du colis et passe l’expédition en « au hub ».',
        'Un scan de sortie marque le colis en transit vers le hub suivant ou la tournée de livraison, et ajoute un événement public visible par le client sur la page de suivi.',
        'Chaque scan est horodaté avec le nom de votre hub, ce que reprend le journal d’activité.',
      ],
    },
  },
  {
    id: 'proof-of-delivery',
    topic: 'operations',
    updated: '2026-09-24',
    title: {
      en: 'Proof of delivery: OTP, signature and photo',
      fr: 'Preuve de livraison : OTP, signature et photo',
    },
    body: {
      en: [
        'Each shipment carries a delivery OTP generated at booking. The driver asks the recipient for it before closing the stop — it is the first proof of a correct delivery.',
        'The driver then captures the recipient name, a handwritten signature and a photo of the parcel or the premises. The photo is stored privately and only opens through a signed link, valid for a few minutes.',
        'All four proofs, with their timestamp, are grouped on the Proof of delivery page where you can browse them as a gallery or as a list.',
        'Failed attempts record the reason as an NDR, which is what creates the follow-up task in your operational overview.',
      ],
      fr: [
        'Chaque expédition porte un OTP de livraison généré à la réservation. Le chauffeur le demande au destinataire avant de clôturer l’arrêt — c’est la première preuve d’une livraison correcte.',
        'Le chauffeur saisit ensuite le nom du destinataire, une signature manuscrite et une photo du colis ou des lieux. La photo est stockée en privé et ne s’ouvre que via un lien signé, valable quelques minutes.',
        'Les quatre preuves, avec leur horodatage, sont regroupées sur la page Preuve de livraison, consultable en galerie ou en liste.',
        'Les tentatives échouées enregistrent le motif en NDR, ce qui crée la tâche de relance dans votre vue opérationnelle.',
      ],
    },
  },
  {
    id: 'cod-settlement',
    topic: 'operations',
    updated: '2026-09-24',
    title: {
      en: 'Cash on delivery: collection and settlement',
      fr: 'Paiement à la livraison : encaissement et reversement',
    },
    body: {
      en: [
        'When a shipment is booked with cash on delivery, a ledger entry is created automatically for the exact amount the driver must collect.',
        'The driver marks the cash as collected when handing over the parcel. The entry then moves to settled once the money is handed to the agency, with a settlement reference.',
        'The COD module shows what is pending, what was collected and what still has to be paid back to each merchant.',
      ],
      fr: [
        'Lorsqu’une expédition est réservée en paiement à la livraison, une ligne de registre est créée automatiquement pour le montant exact à encaisser par le chauffeur.',
        'Le chauffeur marque l’encaissement lors de la remise du colis. La ligne passe ensuite en « réglé » lorsque les fonds sont remis à l’agence, avec une référence de règlement.',
        'Le module COD affiche ce qui est en attente, ce qui a été encaissé et ce qui reste à reverser à chaque marchand.',
      ],
    },
  },
  {
    id: 'api-keys',
    topic: 'api',
    updated: '2026-10-01',
    title: {
      en: 'Generate an API key and call the merchant API',
      fr: 'Générer une clé API et appeler l’API marchand',
    },
    body: {
      en: [
        'Open API integrations and create a key for the merchant or the channel that will call you. Copy it once — it is the credential that authenticates every call.',
        'Every request carries the header x-api-key and a JSON body with an action: rate to get prices, create to book a shipment, track to read the timeline, pod to fetch the proof of delivery.',
        'Pricing is always calculated server-side from your zones and surcharges, so a caller can never send a price of its own.',
        'The request and response shapes are listed on the API page and on the developers page of the public site.',
      ],
      fr: [
        'Ouvrez Intégrations API et créez une clé pour le marchand ou le canal qui vous appellera. Copiez-la une fois : c’est l’identifiant qui authentifie chaque appel.',
        'Chaque requête porte l’en-tête x-api-key et un corps JSON avec une action : rate pour obtenir les prix, create pour réserver, track pour lire la chronologie, pod pour récupérer la preuve de livraison.',
        'La tarification est toujours calculée côté serveur à partir de vos zones et surcharges : un appelant ne peut jamais imposer son prix.',
        'Les formats de requête et de réponse sont documentés sur la page API et sur la page développeurs du site public.',
      ],
    },
  },
  {
    id: 'marketplace-bridge',
    topic: 'api',
    updated: '2026-10-01',
    title: {
      en: 'Connect a marketplace or storefront',
      fr: 'Connecter une marketplace ou une boutique',
    },
    body: {
      en: [
        'Add a connection in Marketplaces, choose the platform, then copy the inbound webhook URL and its token into the platform’s settings.',
        'From then on every order the platform posts creates a priced shipment and returns the tracking number and waybill in the response.',
        'The connection card shows how many orders arrived, when the last one landed and any error the last order produced.',
      ],
      fr: [
        'Ajoutez une connexion dans Marketplaces, choisissez la plateforme, puis copiez l’URL de webhook entrante et son token dans les réglages de la plateforme.',
        'Dès lors, chaque commande envoyée crée une expédition tarifée et renvoie le numéro de suivi et le bordereau dans la réponse.',
        'La fiche de connexion indique le nombre de commandes reçues, la date de la dernière et l’éventuelle erreur de la dernière commande.',
      ],
    },
  },
  {
    id: 'webhook-events',
    topic: 'api',
    updated: '2026-10-01',
    title: {
      en: 'Subscribe to shipment events with webhooks',
      fr: 'S’abonner aux événements d’expédition avec des webhooks',
    },
    body: {
      en: [
        'Open Webhooks and add an endpoint: give it a label and the HTTPS URL of your own system, then pick the events it should receive.',
        'Available events are shipment.created, shipment.status_changed, shipment.delivered, shipment.failed and pod.created. If you subscribe to none, you receive everything.',
        'Every POST carries an X-Express-Event header and a JSON body with the tracking number, status and amounts. A signing secret is sent as X-Express-Signature when you set one.',
        'The delivery log next to the endpoints records the HTTP status, the response and the duration of each attempt, so you can see exactly what your systems received.',
      ],
      fr: [
        'Ouvrez Webhooks et ajoutez un endpoint : donnez-lui un libellé et l’URL HTTPS de votre système, puis choisissez les événements à recevoir.',
        'Les événements disponibles sont shipment.created, shipment.status_changed, shipment.delivered, shipment.failed et pod.created. Sans sélection, vous recevez tout.',
        'Chaque POST porte un en-tête X-Express-Event et un corps JSON avec le numéro de suivi, le statut et les montants. Un secret de signature est envoyé dans X-Express-Signature si vous en définissez un.',
        'Le journal de livraison enregistre le code HTTP, la réponse et la durée de chaque tentative : vous voyez exactement ce que vos systèmes ont reçu.',
      ],
    },
  },
  {
    id: 'merchant-tracking',
    topic: 'merchants',
    updated: '2026-09-24',
    title: {
      en: 'Follow your orders as a merchant',
      fr: 'Suivre vos commandes en tant que marchand',
    },
    body: {
      en: [
        'Sign in and open your merchant dashboard to see active orders, delivered volumes for the month and the channels your orders arrive from.',
        'The shipment updates panel lists the latest scan, delivery or NDR event on your parcels, newest first.',
        'Your public tracking page accepts several tracking numbers at once, so you can check several orders in one go.',
      ],
      fr: [
        'Connectez-vous et ouvrez votre tableau de bord marchand pour voir les commandes actives, les volumes livrés du mois et les canaux d’où viennent vos commandes.',
        'Le panneau des mises à jour liste le dernier scan, la livraison ou l’NDR de vos colis, du plus récent au plus ancien.',
        'Votre page de suivi publique accepte plusieurs numéros à la fois : vous pouvez vérifier plusieurs commandes d’un coup.',
      ],
    },
  },
];