// Careers content: the reasons people join and the roles we are hiring for.
// Written per language, with English as the fallback.

export const CAREER_VALUES = [
  {
    id: 'field',
    icon: 'route',
    title: {
      en: 'Field-first, not slide-first',
      fr: 'Le terrain d’abord, pas les slides',
    },
    body: {
      en: 'Every product decision starts in a hub, a sorting centre or on a motorbike. You will visit the operation you build for.',
      fr: 'Chaque décision produit commence dans un hub, un centre de tri ou sur une moto. Vous visiterez l’opération pour laquelle vous travaillez.',
    },
  },
  {
    id: 'ownership',
    icon: 'target',
    title: {
      en: 'Ownership from day one',
      fr: 'De la responsabilité dès le premier jour',
    },
    body: {
      en: 'Small teams, short decision lines. If a lane is yours, you choose how it is run and you answer for the result.',
      fr: 'Des équipes réduites, des décisions rapides. Si une liaison est à vous, vous décidez comment elle s’opère et vous répondez du résultat.',
    },
  },
  {
    id: 'growth',
    icon: 'trending',
    title: {
      en: 'A continent-wide ladder',
      fr: 'Une progression à l’échelle du continent',
    },
    body: {
      en: 'We promote from the network. Most supervisors here started as dispatchers, scan agents or drivers.',
      fr: 'Nous promouvons depuis le réseau. La plupart de nos superviseurs ont commencé comme dispatcheurs, agents de scan ou chauffeurs.',
    },
  },
  {
    id: 'impact',
    icon: 'heart',
    title: {
      en: 'Work that reaches a doorstep',
      fr: 'Un travail qui arrive jusqu’à la porte',
    },
    body: {
      en: 'A merchant in Douala sells because a parcel arrived in Nairobi. Your work is the last mile between the two.',
      fr: 'Un marchand de Douala vend parce qu’un colis est arrivé à Nairobi. Votre travail est le dernier kilomètre entre les deux.',
    },
  },
];

export const CAREER_ROLES = [
  {
    id: 'hub-supervisor',
    title: { en: 'Hub Supervisor', fr: 'Superviseur de hub' },
    team: { en: 'Operations', fr: 'Exploitation' },
    location: { en: 'Douala, Cameroon', fr: 'Douala, Cameroun' },
    type: { en: 'Full time', fr: 'Temps plein' },
    body: {
      en: 'You run the scan-to-load flow of a sorting centre: inbound scans, load assignment, exceptions and the daily handover to linehaul.',
      fr: 'Vous pilotez le flux scan-à-chargement d’un centre de tri : scans entrants, affectation des tournées, exceptions et passation quotidienne au ligne.',
    },
  },
  {
    id: 'fleet-coordinator',
    title: { en: 'Last-Mile Fleet Coordinator', fr: 'Coordinateur flotte dernier kilomètre' },
    team: { en: 'Operations', fr: 'Exploitation' },
    location: { en: 'Abidjan, Côte d’Ivoire', fr: 'Abidjan, Côte d’Ivoire' },
    type: { en: 'Full time', fr: 'Temps plein' },
    body: {
      en: 'You keep riders moving: availability, load balancing across zones, cash-on-delivery reconciliation and driver onboarding.',
      fr: 'Vous faites avancer les coursiers : disponibilité, équilibrage des charges par zone, rapprochement du paiement à la livraison et intégration des chauffeurs.',
    },
  },
  {
    id: 'integration-engineer',
    title: { en: 'Integration Engineer', fr: 'Ingénieur intégration' },
    team: { en: 'Engineering', fr: 'Ingénierie' },
    location: { en: 'Remote — Africa', fr: 'Télétravail — Afrique' },
    type: { en: 'Full time', fr: 'Temps plein' },
    body: {
      en: 'You connect storefronts and carrier systems to the platform: REST endpoints, webhooks, signature verification and the sandbox merchants test against.',
      fr: 'Vous reliez les boutiques et les systèmes transporteurs à la plateforme : endpoints REST, webhooks, vérification de signature et bac à sable des marchands.',
    },
  },
  {
    id: 'customer-success',
    title: { en: 'Customer Success Lead', fr: 'Responsable succès client' },
    team: { en: 'Customer', fr: 'Clientèle' },
    location: { en: 'Remote — Africa', fr: 'Télétravail — Afrique' },
    type: { en: 'Full time', fr: 'Temps plein' },
    body: {
      en: 'You onboard new agencies end to end: company verification, pricing zones, payment channels, first shipments and the support tickets that follow.',
      fr: 'Vous intégrez les nouvelles agences de bout en bout : vérification, zones tarifaires, canaux de paiement, premiers colis et tickets de support associés.',
    },
  },
  {
    id: 'dispatch-agent',
    title: { en: 'Dispatch Agent', fr: 'Agent de dispatch' },
    team: { en: 'Operations', fr: 'Exploitation' },
    location: { en: 'Nairobi, Kenya', fr: 'Nairobi, Kenya' },
    type: { en: 'Shift work', fr: 'Travail posté' },
    body: {
      en: 'You assign stops, follow live routes and handle the first call on a failed delivery before it becomes a return.',
      fr: 'Vous affectez les arrêts, suivez les tournées en direct et gérez le premier appel d’une livraison échouée avant qu’elle ne devienne un retour.',
    },
  },
];