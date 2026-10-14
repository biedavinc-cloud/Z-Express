// The three policy documents published from the site footer. Each section holds
// its heading and paragraphs per language, with English as the fallback.

export const PRIVACY_DOC = {
  updated: { en: 'October 2026', fr: 'Octobre 2026' },
  sections: [
    {
      id: 'who-we-are',
      heading: { en: 'Who is responsible', fr: 'Qui est responsable' },
      paragraphs: {
        en: [
          'Z. Express operates the logistics platform used by carriers, agencies and merchants on this network. Each carrier decides how the shipments it carries are handled; Z. Express processes shipment data on the carrier’s behalf to run the platform.',
          'For any question about this policy or about your data, write to express@zanldo.com.',
        ],
        fr: [
          'Z. Express exploite la plateforme logistique utilisée par les transporteurs, les agences et les marchands de ce réseau. Chaque transporteur décide du traitement des colis qu’il achemine ; Z. Express traite les données d’expédition pour le compte de ce transporteur afin de faire fonctionner la plateforme.',
          'Pour toute question sur cette politique ou sur vos données, écrivez à express@zanldo.com.',
        ],
      },
    },
    {
      id: 'what-we-collect',
      heading: { en: 'Data we collect', fr: 'Données que nous collectons' },
      paragraphs: {
        en: [
          'Account and company data: name, email, phone, country, company details, and the registration, tax or identity documents uploaded during verification.',
          'Shipment data: sender and receiver names, phone numbers, addresses or map pins, parcel description, weight and declared value, plus the scan history of the shipment.',
          'Delivery data: what the driver captures as proof of delivery — recipient name, signature, photo and the delivery code.',
          'Payment data: the mobile-money or bank reference used to settle a shipment or an invoice, and the subscription record. Card details are handled by the payment provider and are never stored on our servers.',
          'Technical data: connection logs, device type and IP address, used to secure accounts and to diagnose incidents.',
        ],
        fr: [
          'Données de compte et d’entreprise : nom, e-mail, téléphone, pays, informations de société et documents d’immatriculation, fiscaux ou d’identité téléversés lors de la vérification.',
          'Données d’expédition : noms et téléphones de l’expéditeur et du destinataire, adresses ou points sur carte, description du colis, poids et valeur déclarée, ainsi que l’historique des scans.',
          'Données de livraison : ce que le chauffeur capture comme preuve de livraison — nom du destinataire, signature, photo et code de livraison.',
          'Données de paiement : la référence mobile money ou bancaire utilisée pour régler un envoi ou une facture, et l’enregistrement de l’abonnement. Les données de carte sont traitées par le prestataire de paiement et ne sont jamais stockées sur nos serveurs.',
          'Données techniques : journaux de connexion, type d’appareil et adresse IP, utilisés pour sécuriser les comptes et diagnostiquer les incidents.',
        ],
      },
    },
    {
      id: 'how-we-use-it',
      heading: { en: 'How we use it', fr: 'Ce que nous en faisons' },
      paragraphs: {
        en: [
          'To carry out the delivery you asked for: quoting, booking, assignment to a driver, tracking, proof of delivery and the return of a parcel that could not be delivered.',
          'To settle cash-on-delivery money collected by a driver, to invoice subscriptions and to keep the carrier’s ledger accurate.',
          'To verify company accounts, prevent fraud and misuse, and meet customs and transport record-keeping obligations.',
          'To answer your support requests and send service messages about a shipment or your account.',
          'We do not sell personal data and we do not use shipment data for advertising.',
        ],
        fr: [
          'Pour réaliser la livraison demandée : devis, enregistrement, affectation à un chauffeur, suivi, preuve de livraison et retour d’un colis non livrable.',
          'Pour reverser les sommes encaissées à la livraison par un chauffeur, facturer les abonnements et tenir la caisse du transporteur à jour.',
          'Pour vérifier les comptes d’entreprise, prévenir la fraude et les usages abusifs, et respecter les obligations douanières et de tenue de registres de transport.',
          'Pour répondre à vos demandes de support et envoyer les messages de service liés à une expédition ou à votre compte.',
          'Nous ne vendons aucune donnée personnelle et n’utilisons pas les données d’expédition à des fins publicitaires.',
        ],
      },
    },
    {
      id: 'who-sees-it',
      heading: { en: 'Who sees your data', fr: 'Qui voit vos données' },
      paragraphs: {
        en: [
          'The carrying agency and the hub, dispatch and driver teams involved in the shipment — they see what is needed to deliver the parcel and to answer the recipient.',
          'The storefronts and marketplaces you connect: an order pushed into the platform carries the data required to create the shipment.',
          'Payment providers and banks, for subscription billing and cash-on-delivery settlement.',
          'Hosting, storage and email providers that process data on our instructions, under contract.',
        ],
        fr: [
          'L’agence qui transporte le colis et ses équipes de hub, de dispatch et de livraison — elles voient ce qui est nécessaire pour livrer et pour répondre au destinataire.',
          'Les boutiques et marketplaces que vous connectez : une commande transmise à la plateforme contient les données nécessaires à la création de l’expédition.',
          'Les prestataires de paiement et les banques, pour la facturation des abonnements et le reversement du paiement à la livraison.',
          'Les prestataires d’hébergement, de stockage et d’e-mail qui traitent les données sur nos instructions et sous contrat.',
        ],
      },
    },
    {
      id: 'retention',
      heading: { en: 'How long we keep it', fr: 'Durée de conservation' },
      paragraphs: {
        en: [
          'Shipment and tracking history stays available while the shipment is active and for 12 months of public tracking afterwards.',
          'Accounting records, invoices and cash-on-delivery settlements are kept for the period required by tax law, up to 10 years.',
          'Verification documents are kept for the life of the account and deleted or anonymised when the account closes.',
        ],
        fr: [
          'L’historique d’expédition et de suivi reste disponible tant que l’expédition est active, puis pendant 12 mois de suivi public.',
          'Les pièces comptables, factures et reversements de paiement à la livraison sont conservés pendant la durée exigée par la loi fiscale, jusqu’à 10 ans.',
          'Les documents de vérification sont conservés pendant la vie du compte, puis supprimés ou anonymisés à sa fermeture.',
        ],
      },
    },
    {
      id: 'your-rights',
      heading: { en: 'Your rights', fr: 'Vos droits' },
      paragraphs: {
        en: [
          'You may ask for a copy of your data, have it corrected, object to a processing operation, or ask for its deletion. Carriers and merchants can export their own shipment lists from their portal at any time.',
          'Write to express@zanldo.com from the email address attached to the account; we answer within 30 days.',
          'A recipient who wants to know what we hold about a delivery can contact the carrier that handled it, or our team.',
        ],
        fr: [
          'Vous pouvez demander une copie de vos données, les faire corriger, vous opposer à un traitement ou en demander la suppression. Les transporteurs et les marchands peuvent exporter leurs listes d’expéditions depuis leur portail à tout moment.',
          'Écrivez à express@zanldo.com depuis l’adresse e-mail rattachée au compte ; nous répondons sous 30 jours.',
          'Un destinataire qui souhaite savoir ce que nous conservons sur une livraison peut contacter le transporteur qui l’a acheminée ou notre équipe.',
        ],
      },
    },
    {
      id: 'security',
      heading: { en: 'Security', fr: 'Sécurité' },
      paragraphs: {
        en: [
          'Data is encrypted in transit, access is scoped to the role of each staff member, and every carrier’s records are isolated from the others.',
          'API keys and webhook secrets are credentials: keep them in a secret manager and rotate them if they are exposed.',
          'If a personal-data breach occurs, we notify the affected carriers and the competent authority as required by law.',
        ],
        fr: [
          'Les données sont chiffrées en transit, les accès sont limités au rôle de chaque membre du personnel et les dossiers de chaque transporteur sont isolés des autres.',
          'Les clés API et les secrets de webhook sont des identifiants : conservez-les dans un gestionnaire de secrets et renouvelez-les en cas d’exposition.',
          'En cas de violation de données personnelles, nous informons les transporteurs concernés et l’autorité compétente comme la loi l’exige.',
        ],
      },
    },
    {
      id: 'changes',
      heading: { en: 'Changes to this policy', fr: 'Modifications de cette politique' },
      paragraphs: {
        en: [
          'We update this policy when the service changes. The date at the top of this page always reflects the version in force.',
        ],
        fr: [
          'Nous mettons cette politique à jour lorsque le service évolue. La date en haut de cette page correspond toujours à la version en vigueur.',
        ],
      },
    },
  ],
};

export const TERMS_DOC = {
  updated: { en: 'October 2026', fr: 'Octobre 2026' },
  sections: [
    {
      id: 'agreement',
      heading: { en: 'The agreement', fr: 'L’accord' },
      paragraphs: {
        en: [
          'These terms govern the use of the Z. Express platform — the website, the mobile applications and the merchant API. Creating an account or booking a shipment means accepting them.',
          'A carrier or agency account is additionally governed by the agreement signed during onboarding; where the two differ on carriage, the onboarding agreement applies.',
        ],
        fr: [
          'Ces conditions régissent l’utilisation de la plateforme Z. Express — le site, les applications mobiles et l’API marchande. Créer un compte ou réserver une expédition vaut acceptation.',
          'Un compte transporteur ou agence est en plus régi par le contrat signé lors de l’intégration ; en cas de divergence sur le transport, ce contrat prévaut.',
        ],
      },
    },
    {
      id: 'accounts',
      heading: { en: 'Accounts and roles', fr: 'Comptes et rôles' },
      paragraphs: {
        en: [
          'An individual account is free and lets you send parcels through any carrier on the network.',
          'A company account runs on a subscription; the plan chosen sets the number of staff seats and the features available.',
          'You are responsible for the accuracy of your details, for the staff you invite, and for keeping your login credentials and API keys confidential.',
          'We may ask for registration, tax or identity documents before activating a company account, and may suspend an account whose documents are invalid or expired.',
        ],
        fr: [
          'Un compte particulier est gratuit et permet d’envoyer des colis via n’importe quel transporteur du réseau.',
          'Un compte entreprise fonctionne par abonnement ; la formule choisie détermine le nombre d’utilisateurs et les fonctionnalités disponibles.',
          'Vous êtes responsable de l’exactitude de vos informations, des membres que vous invitez et de la confidentialité de vos identifiants et clés API.',
          'Nous pouvons demander des documents d’immatriculation, fiscaux ou d’identité avant d’activer un compte entreprise, et suspendre un compte dont les documents sont invalides ou expirés.',
        ],
      },
    },
    {
      id: 'acceptable-use',
      heading: { en: 'Acceptable use', fr: 'Usage acceptable' },
      paragraphs: {
        en: [
          'Do not use the network for illegal goods, dangerous goods, counterfeit items, cash or bearer instruments, or anything a carrier refuses in its own conditions.',
          'Do not attempt to access another carrier’s records, resell access to the platform, or send traffic designed to degrade the service.',
        ],
        fr: [
          'N’utilisez pas le réseau pour des marchandises illégales, dangereuses, contrefaites, des espèces ou des titres au porteur, ni pour ce qu’un transporteur refuse dans ses propres conditions.',
          'Ne tentez pas d’accéder aux dossiers d’un autre transporteur, ne revendez pas l’accès à la plateforme et n’envoyez pas de trafic visant à dégrader le service.',
        ],
      },
    },
    {
      id: 'rates-and-payment',
      heading: { en: 'Rates and payment', fr: 'Tarifs et paiement' },
      paragraphs: {
        en: [
          'The price of a shipment is the base rate of the pricing zone covering the lane, plus the surcharges that apply at that moment — fuel, remote area, oversize or peak season.',
          'Payment is either prepaid at booking or collected from the recipient as cash on delivery. Where a carrier publishes mobile-money or bank channels, payment is made directly to that carrier and confirmed by it.',
          'Cash-on-delivery amounts are recorded in the carrier’s ledger; the carrier settles them with the merchant under the terms it publishes.',
        ],
        fr: [
          'Le prix d’une expédition correspond au tarif de base de la zone couvrant la liaison, majoré des surcharges applicables à ce moment — carburant, zone enclavée, hors format ou pointe saisonnière.',
          'Le paiement est soit prépayé à la réservation, soit encaissé auprès du destinataire à la livraison. Lorsqu’un transporteur publie des canaux mobile money ou bancaires, le paiement lui est versé directement et confirmé par lui.',
          'Les montants encaissés à la livraison sont enregistrés dans la caisse du transporteur ; celui-ci les reverse au marchand selon les conditions qu’il publie.',
        ],
      },
    },
    {
      id: 'subscription',
      heading: { en: 'Subscription and billing', fr: 'Abonnement et facturation' },
      paragraphs: {
        en: [
          'Company plans are billed monthly or yearly; a yearly cycle includes a 15 % discount and every plan starts with one free month.',
          'The plan price, the number of seats and the billing cycle are shown before checkout, and the invoice is issued at the moment you confirm.',
          'A subscription cancelled during a paid period stays active until that period ends and then stops renewing. Periods already started are not refunded.',
        ],
        fr: [
          'Les formules entreprise sont facturées au mois ou à l’année ; le cycle annuel inclut une remise de 15 % et chaque formule commence par un mois offert.',
          'Le prix de la formule, le nombre d’utilisateurs et le cycle de facturation sont affichés avant le paiement, et la facture est émise au moment de la confirmation.',
          'Un abonnement résilié pendant une période payée reste actif jusqu’à la fin de celle-ci, puis ne se renouvelle plus. Les périodes déjà commencées ne sont pas remboursées.',
        ],
      },
    },
    {
      id: 'carriage-and-claims',
      heading: { en: 'Carriage, liability and claims', fr: 'Transport, responsabilité et réclamations' },
      paragraphs: {
        en: [
          'The physical carriage is performed by the carrying agency, which is responsible for the parcel from pickup to delivery.',
          'Compensation for loss or damage is limited to the declared value or to the carrier’s published liability limit, whichever applies.',
          'Report a problem through a support ticket within 30 days of the delivery date, quoting the tracking number. Proof-of-delivery records and the scan history decide the dispute.',
        ],
        fr: [
          'Le transport physique est assuré par l’agence qui achemine le colis, responsable de celui-ci de l’enlèvement à la livraison.',
          'L’indemnisation d’une perte ou d’un dommage est limitée à la valeur déclarée ou au plafond de responsabilité publié par le transporteur, selon le cas applicable.',
          'Signalez un problème via un ticket de support dans les 30 jours suivant la livraison, en indiquant le numéro de suivi. La preuve de livraison et l’historique des scans tranchent le litige.',
        ],
      },
    },
    {
      id: 'availability-and-api',
      heading: { en: 'Availability and API', fr: 'Disponibilité et API' },
      paragraphs: {
        en: [
          'We aim for continuous availability but the service is provided as-is; scheduled maintenance is announced in the portal.',
          'API keys carry rate limits — 60 requests per minute by default, configurable per key — and a key used to abuse the service may be suspended.',
          'Webhooks must be verified with the signature we send; an integration that cannot verify a signature should reject the payload rather than trust it.',
        ],
        fr: [
          'Nous visons une disponibilité continue, mais le service est fourni en l’état ; les maintenances planifiées sont annoncées dans le portail.',
          'Les clés API sont soumises à des limites de débit — 60 requêtes par minute par défaut, configurables par clé — et une clé utilisée pour abuser du service peut être suspendue.',
          'Les webhooks doivent être vérifiés avec la signature que nous envoyons ; une intégration incapable de la vérifier doit rejeter la charge utile plutôt que s’y fier.',
        ],
      },
    },
    {
      id: 'suspension',
      heading: { en: 'Suspension and termination', fr: 'Suspension et résiliation' },
      paragraphs: {
        en: [
          'We may suspend or terminate an account for fraud, non-payment, illegal shipments or repeated abuse of the service, after notice where notice is possible.',
          'You may close your account at any time. Outstanding cash-on-delivery amounts and invoices remain due, and data is handled as described in the privacy policy.',
        ],
        fr: [
          'Nous pouvons suspendre ou résilier un compte en cas de fraude, de non-paiement, d’expéditions illégales ou d’abus répétés du service, après notification lorsque celle-ci est possible.',
          'Vous pouvez fermer votre compte à tout moment. Les montants encaissés à la livraison et les factures restent dus, et les données sont traitées comme décrit dans la politique de confidentialité.',
        ],
      },
    },
    {
      id: 'changes-and-law',
      heading: { en: 'Changes and applicable law', fr: 'Modifications et droit applicable' },
      paragraphs: {
        en: [
          'We may update these terms; the new version is published on this page with its date, and continued use of the platform means acceptance.',
          'These terms are governed by the law of the jurisdiction where the operating entity is incorporated. The parties will first try to resolve a dispute through support and a written exchange.',
        ],
        fr: [
          'Nous pouvons mettre à jour ces conditions ; la nouvelle version est publiée sur cette page avec sa date, et la poursuite de l’utilisation vaut acceptation.',
          'Ces conditions sont régies par le droit du ressort où l’entité d’exploitation est immatriculée. Les parties cherchent d’abord à résoudre un litige via le support et un échange écrit.',
        ],
      },
    },
  ],
};

export const SDK_DOC = {
  updated: { en: 'October 2026', fr: 'Octobre 2026' },
  sections: [
    {
      id: 'keys-and-environments',
      heading: { en: 'Keys and environments', fr: 'Clés et environnements' },
      paragraphs: {
        en: [
          'Every company account gets test and live keys. A key is a credential: keep it on your server, never in a public front-end or a mobile build.',
          'Use one key per integration — storefront, ERP or middleware — with a label of your own, so a key can be revoked without stopping the others.',
          'Replace a key from the portal as soon as it is exposed; the old one stops working immediately.',
        ],
        fr: [
          'Chaque compte entreprise dispose de clés de test et de production. Une clé est un identifiant : conservez-la sur votre serveur, jamais dans un front-end public ni dans une application mobile.',
          'Utilisez une clé par intégration — boutique, ERP ou intergiciel — avec un nom qui vous est propre, afin de pouvoir en révoquer une sans interrompre les autres.',
          'Remplacez une clé depuis le portail dès qu’elle est exposée ; l’ancienne cesse immédiatement de fonctionner.',
        ],
      },
    },
    {
      id: 'limits',
      heading: { en: 'Rate limits and fair use', fr: 'Limites de débit et usage loyal' },
      paragraphs: {
        en: [
          'Each key carries a per-minute request limit — 60 by default, configurable in the portal — and a batch create accepts at most 500 shipments per call.',
          'Traffic above the limit is answered with a 429 status. Sustained abuse leads to the key being suspended and, in the worst case, to the account being reviewed.',
          'Do not poll tracking more than a few times per minute for the same shipment; a webhook is the right way to follow a delivery.',
        ],
        fr: [
          'Chaque clé est soumise à une limite de requêtes par minute — 60 par défaut, configurable dans le portail — et une création par lot accepte au maximum 500 colis par appel.',
          'Le trafic au-delà de la limite reçoit un statut 429. Un abus prolongé entraîne la suspension de la clé et, dans le pire des cas, la revue du compte.',
          'N’interrogez pas le suivi plus de quelques fois par minute pour une même expédition ; le webhook est la bonne façon de suivre une livraison.',
        ],
      },
    },
    {
      id: 'data-you-send',
      heading: { en: 'The data you send', fr: 'Les données que vous envoyez' },
      paragraphs: {
        en: [
          'Send only shipment data you are entitled to share: the recipient’s name, phone and address are personal data for which you are responsible as the merchant.',
          'Do not use the API to store or relay unrelated customer lists, and never put personal data in a callback URL.',
        ],
        fr: [
          'N’envoyez que les données d’expédition que vous êtes en droit de partager : le nom, le téléphone et l’adresse du destinataire sont des données personnelles dont vous répondez en tant que marchand.',
          'N’utilisez pas l’API pour stocker ou relayer des listes de clients sans lien avec l’expédition, et ne placez jamais de données personnelles dans une URL de retour.',
        ],
      },
    },
    {
      id: 'webhooks',
      heading: { en: 'Webhooks', fr: 'Webhooks' },
      paragraphs: {
        en: [
          'Register a webhook URL on your key and we POST shipment.created, shipment.status, shipment.delivered and shipment.pod events.',
          'Each delivery carries an HMAC signature computed with your webhook secret; verify it before trusting the payload.',
          'Answer with a 2xx status within a few seconds. Failures are retried with backoff and recorded in the portal with their status code and response.',
        ],
        fr: [
          'Enregistrez une URL de webhook sur votre clé et nous envoyons les événements shipment.created, shipment.status, shipment.delivered et shipment.pod.',
          'Chaque envoi porte une signature HMAC calculée avec votre secret de webhook ; vérifiez-la avant de faire confiance à la charge utile.',
          'Répondez par un statut 2xx en quelques secondes. Les échecs sont réessayés de façon progressive et enregistrés dans le portail avec leur code de statut et leur réponse.',
        ],
      },
    },
    {
      id: 'versioning',
      heading: { en: 'Versioning and deprecation', fr: 'Versionnage et dépréciation' },
      paragraphs: {
        en: [
          'The API evolves by addition: new fields and new optional parameters never break an existing call.',
          'A breaking change is announced at least 90 days before it takes effect, by email to the key owners and on the developer page, with a migration note.',
        ],
        fr: [
          'L’API évolue par ajout : les nouveaux champs et paramètres optionnels ne cassent jamais un appel existant.',
          'Un changement incompatible est annoncé au moins 90 jours avant son entrée en vigueur, par e-mail aux titulaires des clés et sur la page développeurs, avec une note de migration.',
        ],
      },
    },
    {
      id: 'security-and-reporting',
      heading: { en: 'Security and reporting', fr: 'Sécurité et signalement' },
      paragraphs: {
        en: [
          'Report a vulnerability, a suspicious call or a leaked key to express@zanldo.com. We acknowledge within two working days and ask that you do not disclose the issue publicly before a fix is available.',
        ],
        fr: [
          'Signalez une vulnérabilité, un appel suspect ou une clé divulguée à express@zanldo.com. Nous accusons réception sous deux jours ouvrés et vous demandons de ne pas divulguer le problème publiquement avant qu’un correctif soit disponible.',
        ],
      },
    },
  ],
};