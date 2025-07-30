export interface DefaultPhase {
  name: string;
  checklist: string[];
}

export const defaultPhases: DefaultPhase[] = [
  {
    name: 'Bouwtekening',
    checklist: [
      'Indelingen: Badkamer, Slaapkamer, Wasruimte, Meterkast, Woonkamer, Keuken',
      'Installaties: WCD, afvoeren, waterleidingen, elektra, vloerverwarmingsverdelers, spotjes, deurbel, thermostaat, TV, UTP-kabel, ventilatiekanalen, afzuigkap (inbouw of opbouw)',
      'AI-indeling via styling',
    ],
  },
  {
    name: 'Sloop / Strip',
    checklist: [
      'Vloeren, tegels en muren verwijderen',
      'Nieuwe indeling aanhouden',
      'Leidingen afdoppen',
      'WC en water werkend houden',
    ],
  },
  {
    name: 'Styling & Opmeten',
    checklist: [
      'Alles opmeten',
      'Rekening houden met verhoogde vloeren, tegel/lijmdikte, verlaagd plafond',
      'Keukenmaten bepalen voor afvoer en water',
    ],
  },
  {
    name: 'Uitbouw / Opbouw',
    checklist: [
      'Bouwkundige tekening',
      'Fundering',
      'Staalconstructie',
      'Balkon',
    ],
  },
  {
    name: 'Indeling Ruwe Afbouw',
    checklist: [
      'Wanden van hout of gipsblokken plaatsen',
      'Isolatie aanbrengen',
      'Deuropeningen op standaardmaten houden',
    ],
  },
  {
    name: 'Betonboren & Sleuven',
    checklist: [
      'Sleuven maken voor installaties',
      'Gaten boren voor afvoeren',
      'Alles gereed voor installatie',
    ],
  },
  {
    name: 'Checkpoint',
    checklist: [
      'Indelingen controleren',
      'Voorwerk installaties controleren',
    ],
  },
  {
    name: 'Verlaagde Plafonds',
    checklist: [
      'Latjes, balken, schroeven en beugels monteren',
      'Hoogte controleren',
      'Plafondranden met PUR afdichten tegen scheurvorming',
    ],
  },
  {
    name: 'Kozijnen',
    checklist: [
      'Afmetingen controleren',
      'Materiaal: hout of staal bepalen',
    ],
  },
  {
    name: 'Ventilatie',
    checklist: [
      'Duco-ventilatie plaatsen',
      'WTW-unit installeren',
      'Luchtkanalen leggen',
    ],
  },
  {
    name: 'Afvoer',
    checklist: [
      'Afvoerleidingen aanleggen (PVC 40/50/110)',
      'Sanibroyeur overwegen',
      'Standleiding in kaart brengen',
      'Hoogtes controleren (inbouw of opbouw)',
      'Ruimtes: washok, badkamer, WC, keuken',
    ],
  },
  {
    name: 'Waterleidingen',
    checklist: [
      'Koud- en warmwaterleidingen leggen',
      'Isolatie aanbrengen',
      'Punten: Badkamer, WC, Keuken, Washok',
    ],
  },
  {
    name: 'Elektra',
    checklist: [
      'Hoogtes en routes bepalen',
      'Voorzetwanden vs. beton vs. gips markeren',
      'Standaard afmetingen en hoogtes toepassen',
      'Nieuwe keuken-afmetingen verwerken',
      'Spiegelverlichting badkamer',
      'Groepenkast (1- of 3-fasig) bepalen',
      'Kabels & buizen trekken',
      'Brandwerende WCD en spotjes gebruiken',
      'Afmetingen badkamermeubels checken',
    ],
  },
  {
    name: 'WC Vervangen',
    checklist: [
      'Oude WC verwijderen',
      'Nieuwe WC plaatsen',
    ],
  },
  {
    name: 'Vloerverwarming',
    checklist: [
      'Vloer leeg en waterpas maken',
      'Fermacell of noppenplaat leggen / direct frezen',
      'Locatie verdeler bepalen',
      'Afsmeren en egaliseren',
    ],
  },
  {
    name: 'Checkpoint',
    checklist: [
      'Installatie controleren vóór dichtmaken',
    ],
  },
  {
    name: 'Ruwe Afbouw Dichtmaken',
    checklist: [
      'Isolatie plaatsen',
      'Gipsplaten monteren',
      'Groene gipsplaten in badkamer',
      'Blauwe gipsplaten voor extra isolatie',
      'Stuc-klaar opleveren',
    ],
  },
  {
    name: 'Tegelen',
    checklist: [
      'Muren op vlakheid controleren',
      'Afvoer aangesloten',
      'Inbouw- of opbouwkranen checken',
      'Elektra op juiste posities',
      'Kimbanden en tegellijm toepassen',
      'Juiste tegels volgens tekening',
      'Voegen aanbrengen',
      'Plaats meubels bepalen',
    ],
  },
  {
    name: 'Badkamer Kitten',
    checklist: [
      'Alle naden in badkamer afkitten',
    ],
  },
  {
    name: 'Stuccen',
    checklist: [
      'Wanden en plafonds stukadoren',
    ],
  },
  {
    name: 'Plinten',
    checklist: [
      'Plinten plaatsen',
      'Kitnaden afwerken',
      'Aflakken',
    ],
  },
  {
    name: 'Lakken',
    checklist: [
      'Alle houtdelen lakken',
    ],
  },
  {
    name: 'Schilderen',
    checklist: [
      'Eerst lakken, dan schilderen',
      'Primer aanbrengen',
      'Houtwerk (kozijnen) lakken',
      'Wanden en plafonds verven',
      'Kleuren RAL 4040 toepassen',
    ],
  },
  {
    name: 'Deuren',
    checklist: [
      'Deuren afhangen',
      'Beslag monteren',
    ],
  },
  {
    name: 'Afmontage',
    checklist: [
      'Badkamermeubels plaatsen',
      'Spots en WCD aansluiten',
      'Thermostaat installeren',
      'Intercom aansluiten',
      'Schakelaars monteren',
    ],
  },
  {
    name: 'Keuken Installatie',
    checklist: [
      'Keukenmeubels plaatsen',
      'Apparatuur aansluiten',
    ],
  },
  {
    name: 'Kitten (Eindfase)',
    checklist: [
      'Plinten, keuken, badkamermeubels en WC afkitten',
    ],
  },
  {
    name: 'Vloeren',
    checklist: [
      'Ondervloer leggen',
      'PVC of laminaat plaatsen',
    ],
  },
  {
    name: 'Checkpoint',
    checklist: [
      'Offerte en opleverlijst doornemen',
      'Laatste punten inventariseren',
    ],
  },
  {
    name: 'Oplevering',
    checklist: [
      'Laatste punten nalopen',
      'Eventuele reparaties uitvoeren',
      'Project mooi afronden',
    ],
  },
];