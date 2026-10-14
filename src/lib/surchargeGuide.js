// How a delivery price is built on the platform: the surcharge families each
// agency can switch on, the calculation order, and a worked example.
//
// The example is written in USD, like every price the platform advertises; an
// agency still publishes its own rate card in the currency it bills in.

export const SURCHARGE_RULES = [
  {
    id: 'fuel',
    title: { en: 'Fuel surcharge', fr: 'Supplément carburant' },
    paragraphs: {
      en: [
        'A percentage of the base rate that follows fuel prices on the lanes a carrier operates. The agency reviews it and it applies to every shipment in the zones where it is switched on.',
        'Set as a percentage, computed on the base rate, and applied before the flat surcharges so a change in fuel price never changes the flat amounts.',
      ],
      fr: [
        'Un pourcentage du tarif de base qui suit le prix du carburant sur les liaisons exploitées par le transporteur. L’agence le révise et il s’applique à chaque envoi dans les zones où il est activé.',
        'Défini en pourcentage, calculé sur le tarif de base et appliqué avant les surcharges forfaitaires, afin qu’une variation du carburant ne modifie jamais les montants fixes.',
      ],
    },
  },
  {
    id: 'remote-area',
    title: { en: 'Remote area surcharge', fr: 'Supplément zone enclavée' },
    paragraphs: {
      en: [
        'Some destinations sit beyond a carrier’s regular round: low density, unpaved access or a distant border post. They are flagged as remote areas in the pricing zone, so the extra cost is quoted up front instead of being negotiated on the phone.',
        'Configured as a flat amount — the common case — or as a percentage, either always applied in that zone or only above a weight threshold.',
      ],
      fr: [
        'Certaines destinations sortent de la tournée habituelle d’un transporteur : faible densité, accès non bitumé ou poste frontière éloigné. Elles sont signalées comme zones enclavées dans la zone tarifaire, afin que le coût supplémentaire soit annoncé d’avance plutôt que négocié au téléphone.',
        'Configuré en montant forfaitaire — le cas courant — ou en pourcentage, appliqué soit systématiquement dans cette zone, soit seulement au-delà d’un seuil de poids.',
      ],
    },
  },
  {
    id: 'other',
    title: { en: 'Oversize, express and peak season', fr: 'Hors format, express et pointe saisonnière' },
    paragraphs: {
      en: [
        'The same rule engine covers the other cases a carrier needs: oversize parcels above a dimension or weight threshold, an express uplift when a shipment must move faster than the standard lane, and a peak-season surcharge for the weeks around end-of-year volume.',
        'Each rule can be limited to one service type (express, standard, freight or fulfilment), to cash-on-delivery shipments only, or to a single zone.',
      ],
      fr: [
        'Le même moteur de règles couvre les autres cas utiles au transporteur : les colis hors format au-delà d’un seuil de dimension ou de poids, la majoration express lorsqu’un envoi doit aller plus vite que la liaison standard, et la surcharge de pointe autour des volumes de fin d’année.',
        'Chaque règle peut être limitée à un type de service (express, standard, fret ou préparation de commandes), aux seuls envois payés à la livraison, ou à une seule zone.',
      ],
    },
  },
];

export const RATE_STEPS = [
  {
    id: 'weight',
    title: { en: 'Chargeable weight', fr: 'Poids taxable' },
    body: {
      en: 'Actual weight is compared with the volumetric weight (length × width × height ÷ 5000) and the heavier of the two is billed.',
      fr: 'Le poids réel est comparé au poids volumétrique (longueur × largeur × hauteur ÷ 5000) et le plus élevé des deux est facturé.',
    },
  },
  {
    id: 'zone',
    title: { en: 'Zone lookup', fr: 'Recherche de zone' },
    body: {
      en: 'Origin and destination resolve to a pricing zone, which carries the model (flat, weight, tiered or distance), the base rate, the per-kilogram rate and a minimum charge.',
      fr: 'L’origine et la destination correspondent à une zone tarifaire qui porte le modèle (forfait, poids, paliers ou distance), le tarif de base, le prix au kilo et un minimum de facturation.',
    },
  },
  {
    id: 'surcharges',
    title: { en: 'Surcharges', fr: 'Surcharges' },
    body: {
      en: 'The active surcharges of that zone are applied in order: a percentage one is computed on the base rate, a flat one is added as-is, and a surcharge limited by weight, volume or zone applies only when the parcel matches.',
      fr: 'Les surcharges actives de cette zone s’appliquent dans l’ordre : une surcharge en pourcentage est calculée sur le tarif de base, une surcharge forfaitaire est ajoutée telle quelle, et une surcharge limitée par le poids, le volume ou la zone ne s’applique que si le colis correspond.',
    },
  },
  {
    id: 'total',
    title: { en: 'Total and payment', fr: 'Total et paiement' },
    body: {
      en: 'The cash-on-delivery amount and the declared value are added to the quote; the total is shown before you confirm. The API returns the same breakdown through its rate action.',
      fr: 'Le montant à encaisser à la livraison et la valeur déclarée sont ajoutés au devis ; le total est affiché avant confirmation. L’API renvoie le même détail via son action de tarification.',
    },
  },
];

export const RATE_EXAMPLE_LINES = [
  {
    id: 'chargeable',
    label: { en: 'Chargeable weight (2 kg actual, 1.4 kg volumetric)', fr: 'Poids taxable (2 kg réels, 1,4 kg volumétrique)' },
    value: '2 kg',
  },
  {
    id: 'base',
    label: { en: 'Zone base rate, Douala → Yaoundé', fr: 'Tarif de base de zone, Douala → Yaoundé' },
    value: '$6.00',
  },
  {
    id: 'fuel',
    label: { en: 'Fuel surcharge, 8 % of base', fr: 'Supplément carburant, 8 % du base' },
    value: '$0.48',
  },
  {
    id: 'remote',
    label: { en: 'Remote area surcharge, flat', fr: 'Supplément zone enclavée, forfaitaire' },
    value: '$2.50',
  },
];

export const RATE_EXAMPLE_TOTAL = '$8.98';