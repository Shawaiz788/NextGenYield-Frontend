export interface GrowthStageInfo {
  index: number;
  key: string;
  name: string;
  color: string;
  lightColor: string;
  daysFromSowing: string;
  summary: string;
}

export interface AgronomicAdvice {
  summary: string;
  irrigationGuidance: string;
  nutrientGuidance: string;
  riskAlerts: string[];
  actionRequired: boolean;
}

export interface FieldObservation {
  id: string;
  date: string;
  daysAgo: string;
  stageIndex: number;
  stageName: string;
  confidence: number;
  imageUri: string;
  sharpnessScore: number;
  angleScore: number;
}

export interface FertilizerEntry {
  stage: string;
  type: string;
  dosePerAcre: string;
  date: string;
  applied: boolean;
}

export interface IrrigationEntry {
  event: string;
  source: string;
  date: string;
  completed: boolean;
}

export interface FieldData {
  id: string;
  code: string;
  displayName: string;
  areaAcres: number;
  areaSqm: number;
  wheatVariety: string;
  sowingDate: string;
  sowingMethod: string;
  soilTexture: string;
  district: string;
  currentStageIndex: number;
  stageConfidence: number;
  lastUpdated: string;
  isUserField: boolean;
  cycleStatus?: 'not_started' | 'active' | 'completed';
  seedCompany?: string;
  fertilizerCompany?: string;
  yieldReturnKgSqm: number;
  yieldMaundsPerAcre: number;
  coordinates: { latitude: number; longitude: number };
  polygonCoords: { x: number; y: number }[];
  history: FieldObservation[];
  fertilizerPlan: FertilizerEntry[];
  irrigationPlan: IrrigationEntry[];
  advisory: AgronomicAdvice;
}

export interface CropCycleEvent {
  day: number;
  date: string;
  stageName: string;
  title: string;
  category: 'water' | 'fertilizer' | 'filter' | 'sow' | 'harvest';
  companyOrSource: string;
  description: string;
}

export interface PeerShowcaseField {
  rank: number;
  fieldId: string;
  code: string;
  district: string;
  wheatVariety: string;
  seedCompany: string;
  soilTexture: string;
  areaAcres: number;
  areaSqm: number;
  shapeType: 'rectangle' | 'square' | 'polygon' | 'circle';
  shapeDescription: string;
  yieldKgSqm: number;
  yieldMaundsPerAcre: number;
  vsRegionalAvg: string;
  sowingDate: string;
  harvestDate: string;
  irrigationMethod: string;
  fertilizerCompany: string;
  successFactors: string[];
  cropCycle: CropCycleEvent[];
  playbookAvailable: boolean;
}

export const DETERMINISTIC_ADVISORY: Record<number, AgronomicAdvice> = {
  0: {
    summary: 'Crop in Tillering stage. Plants are initiating lateral crown roots and secondary tillers.',
    irrigationGuidance: 'Crown Root Initiation (CRI) 1st irrigation is critical. Apply 20-25 days after sowing.',
    nutrientGuidance: 'Apply 1st split Urea (1 bag/acre) + 5kg Zinc Sulfate (33%) with 1st irrigation.',
    riskAlerts: ['Inspect for early weed competition (broadleaf & grassy weeds).'],
    actionRequired: true,
  },
  1: {
    summary: 'Jointing stage initiated. Nodes are elongating rapidly above soil surface.',
    irrigationGuidance: 'Maintain adequate moisture; avoid waterlogging during stem extension.',
    nutrientGuidance: 'Apply 2nd split Nitrogen (1 bag Urea/acre). Do not delay past node detection.',
    riskAlerts: ['Watch for early aphid colonies on lower canopy stems.'],
    actionRequired: true,
  },
  2: {
    summary: 'Booting stage confirmed. Flag leaf sheath is swollen, encasing the developing spike.',
    irrigationGuidance: 'Most water-sensitive phase. Water stress now permanently reduces spikelet count.',
    nutrientGuidance: 'Avoid heavy granular nitrogen to prevent lodging; inspect flag leaf vitality.',
    riskAlerts: ['Monitor flag leaf closely for yellow stripe rust (Puccinia striiformis) pustules.'],
    actionRequired: true,
  },
  3: {
    summary: 'Anthesis / Flowering underway. Delicate yellow/cream anthers extruded for pollination.',
    irrigationGuidance: 'Ensure light irrigation before peak heat; never irrigate during high winds.',
    nutrientGuidance: 'No root fertilizer needed. Optional micronutrient foliar spray (Boron) if deficient.',
    riskAlerts: ['Avoid heavy chemical spraying while anthers are shedding pollen.'],
    actionRequired: false,
  },
  4: {
    summary: 'Grain Filling stage active. Grains progressing from watery to soft dough consistency.',
    irrigationGuidance: 'Final terminal irrigation before physiological maturity to maximize 1000-grain weight.',
    nutrientGuidance: 'Nutrient uptake complete; plant mobilizing reserves to grains.',
    riskAlerts: ['Watch for lodging if unexpected spring rainstorms occur.'],
    actionRequired: false,
  },
  5: {
    summary: 'Maturity / Senescence reached. Crop dry, golden-brown, moisture under 12%.',
    irrigationGuidance: 'Cease all irrigation. Allow field to dry completely for combine harvester.',
    nutrientGuidance: 'Crop is fully mature. Prepare storage bags and clean threshing equipment.',
    riskAlerts: ['Harvest promptly to prevent shattering loss from hot terminal winds.'],
    actionRequired: true,
  },
};

export const MOCK_FIELDS: FieldData[] = [
  {
    id: 'field_01',
    code: 'PK-FSD-04',
    displayName: 'North Canal Parcel · Chak 45-JB',
    areaAcres: 4.0,
    areaSqm: 16187.4,
    wheatVariety: 'Akbar-2019',
    sowingDate: '12 Nov 2025',
    sowingMethod: 'Drill Sowing (9 inch row spacing)',
    soilTexture: 'Sandy Loam',
    district: 'Faisalabad',
    currentStageIndex: 2,
    stageConfidence: 0.884,
    lastUpdated: 'Today, 09:30 AM',
    isUserField: true,
    cycleStatus: 'active',
    seedCompany: 'Punjab Seed Corporation',
    fertilizerCompany: 'FFC (Fauji Fertilizer Company)',
    yieldReturnKgSqm: 0.62,
    yieldMaundsPerAcre: 62.0,
    coordinates: { latitude: 31.418, longitude: 73.079 },
    polygonCoords: [
      { x: 30, y: 40 },
      { x: 120, y: 35 },
      { x: 135, y: 110 },
      { x: 38, y: 120 },
    ],
    history: [
      {
        id: 'obs_101',
        date: 'Today, 09:30 AM',
        daysAgo: 'Today',
        stageIndex: 2,
        stageName: 'Booting',
        confidence: 0.884,
        imageUri: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
        sharpnessScore: 94.2,
        angleScore: 68.5,
      },
      {
        id: 'obs_102',
        date: '10 Jan 2026',
        daysAgo: '18 days ago',
        stageIndex: 1,
        stageName: 'Jointing',
        confidence: 0.912,
        imageUri: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
        sharpnessScore: 91.0,
        angleScore: 62.0,
      },
      {
        id: 'obs_103',
        date: '08 Dec 2025',
        daysAgo: '50 days ago',
        stageIndex: 0,
        stageName: 'Tillering',
        confidence: 0.945,
        imageUri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
        sharpnessScore: 96.5,
        angleScore: 75.0,
      },
    ],
    fertilizerPlan: [
      { stage: 'Sowing (Basal)', type: 'DAP (Diammonium Phosphate)', dosePerAcre: '1.5 bags (75 kg)', date: '12 Nov 2025', applied: true },
      { stage: 'Tillering (1st Split)', type: 'Urea + Zinc Sulfate 33%', dosePerAcre: '1 bag Urea + 5 kg Zinc', date: '08 Dec 2025', applied: true },
      { stage: 'Jointing (2nd Split)', type: 'Urea (Nitrogen top-dress)', dosePerAcre: '1 bag Urea (50 kg)', date: '10 Jan 2026', applied: true },
      { stage: 'Booting (Foliar)', type: 'Potassium / Micronutrients', dosePerAcre: 'Foliar spray check', date: 'Pending advisory', applied: false },
    ],
    irrigationPlan: [
      { event: 'Rouni (Pre-sowing flooding)', source: 'Canal Supply', date: '05 Nov 2025', completed: true },
      { event: '1st Irrigation (CRI Stage)', source: 'Canal Supply', date: '08 Dec 2025', completed: true },
      { event: '2nd Irrigation (Jointing)', source: 'Tube-well + Solar', date: '12 Jan 2026', completed: true },
      { event: '3rd Irrigation (Booting)', source: 'Canal Supply (Upcoming)', date: 'Expected 05 Feb 2026', completed: false },
    ],
    advisory: DETERMINISTIC_ADVISORY[2],
  },
  {
    id: 'field_02',
    code: 'PK-FSD-02',
    displayName: 'Tubewell Square · Chak 42-JB',
    areaAcres: 2.5,
    areaSqm: 10117.1,
    wheatVariety: 'Dilkash-20',
    sowingDate: '24 Nov 2025',
    sowingMethod: 'Broadcasting with Rotavator',
    soilTexture: 'Clay Loam',
    district: 'Faisalabad',
    currentStageIndex: 1,
    stageConfidence: 0.891,
    lastUpdated: 'Yesterday, 04:15 PM',
    isUserField: true,
    cycleStatus: 'active',
    seedCompany: 'Punjab Seed Corporation',
    fertilizerCompany: 'Engro Fertilizers',
    yieldReturnKgSqm: 0.54,
    yieldMaundsPerAcre: 54.0,
    coordinates: { latitude: 31.425, longitude: 73.065 },
    polygonCoords: [
      { x: 170, y: 80 },
      { x: 250, y: 70 },
      { x: 260, y: 150 },
      { x: 175, y: 155 },
    ],
    history: [
      {
        id: 'obs_201',
        date: 'Yesterday, 04:15 PM',
        daysAgo: 'Yesterday',
        stageIndex: 1,
        stageName: 'Jointing',
        confidence: 0.891,
        imageUri: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
        sharpnessScore: 89.4,
        angleScore: 58.0,
      },
    ],
    fertilizerPlan: [
      { stage: 'Sowing (Basal)', type: 'DAP + SOP (Potash)', dosePerAcre: '1 bag DAP + 0.5 bag SOP', date: '24 Nov 2025', applied: true },
      { stage: 'Tillering (1st Split)', type: 'Urea', dosePerAcre: '1 bag Urea', date: '20 Dec 2025', applied: true },
      { stage: 'Jointing (2nd Split)', type: 'Urea (Due now)', dosePerAcre: '1 bag Urea', date: 'Due this week', applied: false },
    ],
    irrigationPlan: [
      { event: 'Rouni (Pre-sowing)', source: 'Tube-well', date: '18 Nov 2025', completed: true },
      { event: '1st Irrigation (CRI)', source: 'Tube-well', date: '22 Dec 2025', completed: true },
      { event: '2nd Irrigation (Jointing)', source: 'Canal Supply', date: 'Due in 3 days', completed: false },
    ],
    advisory: DETERMINISTIC_ADVISORY[1],
  },
  {
    id: 'field_03',
    code: 'PK-FSD-06',
    displayName: 'East Tube-well Block · Chak 51-JB',
    areaAcres: 5.0,
    areaSqm: 20234.3,
    wheatVariety: 'Unplanted',
    sowingDate: 'Not Sown',
    sowingMethod: 'Drill Sowing (9 inch)',
    soilTexture: 'Clay Loam',
    district: 'Faisalabad',
    currentStageIndex: 0,
    stageConfidence: 0.0,
    lastUpdated: 'Boundary Added',
    isUserField: true,
    cycleStatus: 'not_started',
    seedCompany: '',
    fertilizerCompany: '',
    yieldReturnKgSqm: 0.0,
    yieldMaundsPerAcre: 0.0,
    coordinates: { latitude: 31.43, longitude: 73.09 },
    polygonCoords: [
      { x: 140, y: 160 },
      { x: 220, y: 160 },
      { x: 220, y: 220 },
      { x: 140, y: 220 },
    ],
    history: [],
    fertilizerPlan: [],
    irrigationPlan: [],
    advisory: {
      summary: 'Cycle not started. Field boundary is demarcated and land is prepared for sowing.',
      irrigationGuidance: 'Perform Rauni (pre-sowing irrigation) 4-6 days before planned drilling.',
      nutrientGuidance: 'Select your wheat seed variety and fertilizer company to start cycle tracking.',
      riskAlerts: ['Ensure soil moisture check before sowing.'],
      actionRequired: true,
    },
  },
];

export const PEER_BENCHMARK_SHOWCASE: PeerShowcaseField[] = [
  {
    rank: 1,
    fieldId: 'peer_field_01',
    code: 'PK-FSD-04 (Benchmark)',
    district: 'Faisalabad (Samundri Zone)',
    wheatVariety: 'Akbar-2019',
    seedCompany: 'Punjab Seed Corporation (PSC Certified)',
    soilTexture: 'Sandy Loam',
    areaAcres: 4.0,
    areaSqm: 16187.4,
    shapeType: 'rectangle',
    shapeDescription: 'Rectangular Cadastral Parcel (220m × 73m)',
    yieldKgSqm: 0.62,
    yieldMaundsPerAcre: 62.0,
    vsRegionalAvg: '+38% vs District Average (45 Maunds/Acre)',
    sowingDate: '12 Nov 2025',
    harvestDate: '02 Apr 2026',
    irrigationMethod: 'Canal + Solar Tube-well',
    fertilizerCompany: 'FFC (Fauji Fertilizer) & Engro',
    successFactors: [
      'Sown on Nov 12 using 9-inch seed drill (Akbar-2019)',
      '1st watering applied strictly at Day 22 (Crown root emergence)',
      'Combined broadleaf weed filtering with 1st irrigation',
      'Zero moisture stress allowed during Day 75-90 (Booting & Flowering)',
    ],
    cropCycle: [
      {
        day: 0,
        date: '12 Nov 2025',
        stageName: 'Sowing & Pre-emergence',
        title: 'Drill Sowing + Basal Fertilizer',
        category: 'sow',
        companyOrSource: 'Punjab Seed Corp + Engro',
        description: 'Sown with certified Akbar-2019 seed (50 kg/acre). Basal dose: 1.5 bags Engro DAP incorporated into seed bed.',
      },
      {
        day: 22,
        date: '04 Dec 2025',
        stageName: 'Tillering (CRI)',
        title: '1st Watering + Weed Filter + Urea',
        category: 'water',
        companyOrSource: 'Gugera Canal + FFC',
        description: '1st canal flush (3 inches). Applied 1 bag FFC Sona Urea + broadleaf weed filtering spray to eradicate competition.',
      },
      {
        day: 55,
        date: '06 Jan 2026',
        stageName: 'Jointing (Stem Elongation)',
        title: '2nd Watering + Top-Dress Nitrogen',
        category: 'water',
        companyOrSource: 'Solar Tube-well + FFC',
        description: '2nd watering via tube-well. Broadcasted 1 bag FFC Sona Urea top-dress before node elongation.',
      },
      {
        day: 80,
        date: '31 Jan 2026',
        stageName: 'Booting (Head Formation)',
        title: '3rd Watering (Critical Moisture Window)',
        category: 'water',
        companyOrSource: 'Canal Supply',
        description: 'Critical canal flush. Ensured root zone never dried to maximize spikelet and head grain capacity.',
      },
      {
        day: 108,
        date: '28 Feb 2026',
        stageName: 'Grain Filling (Milky/Dough)',
        title: '4th Terminal Watering',
        category: 'water',
        companyOrSource: 'Solar Tube-well',
        description: 'Light terminal irrigation to plump kernel weight during warm terminal weather before combine desiccation.',
      },
      {
        day: 142,
        date: '02 Apr 2026',
        stageName: 'Maturity & Harvest',
        title: 'Combine Harvest & Yield Weighing',
        category: 'harvest',
        companyOrSource: 'Case IH Combine Harvester',
        description: 'Crop harvested at 11.5% moisture. Verified yield: 62.0 Maunds / Acre (0.62 kg/m²).',
      },
    ],
    playbookAvailable: true,
  },
  {
    rank: 2,
    fieldId: 'peer_field_02',
    code: 'PK-TT-11 (Gojra Plot)',
    district: 'Toba Tek Singh (Gojra)',
    wheatVariety: 'Dilkash-20',
    seedCompany: 'ICI Pakistan Seeds',
    soilTexture: 'Clay Loam',
    areaAcres: 6.5,
    areaSqm: 26304.5,
    shapeType: 'polygon',
    shapeDescription: '6-Vertex Irregular Field Polygon (Laser Leveled)',
    yieldKgSqm: 0.59,
    yieldMaundsPerAcre: 59.2,
    vsRegionalAvg: '+32% vs District Average',
    sowingDate: '15 Nov 2025',
    harvestDate: '06 Apr 2026',
    irrigationMethod: 'Laser-leveled Canal Bed',
    fertilizerCompany: 'Fatima Fertilizer (Sarsabz)',
    successFactors: [
      'Dilkash-20 heat-tolerant variety planted after cotton harvest',
      'Laser leveling eliminated water pooling spots',
      'Fatima Sarsabz CAN applied in 3 micro-splits',
    ],
    cropCycle: [
      {
        day: 0,
        date: '15 Nov 2025',
        stageName: 'Sowing',
        title: 'Laser Bed Sowing + Basal Fertilizer',
        category: 'sow',
        companyOrSource: 'ICI Seeds + Fatima Fertilizer',
        description: 'Sown on laser-leveled bed with Dilkash-20. 1 bag Fatima Sarsabz Nitrophos basal application.',
      },
      {
        day: 24,
        date: '09 Dec 2025',
        stageName: 'Tillering',
        title: '1st Irrigation + Weed Filtering',
        category: 'water',
        companyOrSource: 'Canal Supply',
        description: '1st canal flush. Selective grassy weed herbicide filter applied 48 hours before watering.',
      },
      {
        day: 58,
        date: '12 Jan 2026',
        stageName: 'Jointing',
        title: '2nd Irrigation + CAN Split',
        category: 'fertilizer',
        companyOrSource: 'Tube-well + Fatima Sarsabz',
        description: 'Tube-well irrigation with 1 bag Sarsabz Calcium Ammonium Nitrate (CAN).',
      },
      {
        day: 85,
        date: '08 Feb 2026',
        stageName: 'Booting',
        title: '3rd Canal Watering',
        category: 'water',
        companyOrSource: 'Canal Supply Line #2',
        description: 'Uninterrupted canal watering to safeguard head development.',
      },
      {
        day: 143,
        date: '06 Apr 2026',
        stageName: 'Harvest',
        title: 'Harvest Verified',
        category: 'harvest',
        companyOrSource: 'Field Weighbridge',
        description: 'Final harvest: 59.2 Maunds / Acre (0.59 kg/m²).',
      },
    ],
    playbookAvailable: true,
  },
  {
    rank: 3,
    fieldId: 'peer_field_03',
    code: 'PK-JHG-09 (Shorkot)',
    district: 'Jhang (Shorkot Tehsil)',
    wheatVariety: 'Faisalabad-2008',
    seedCompany: 'Syngenta Seeds Pakistan',
    soilTexture: 'Silt Loam',
    areaAcres: 5.0,
    areaSqm: 20234.3,
    shapeType: 'square',
    shapeDescription: 'Square 4-Acre Agricultural Killa Grid',
    yieldKgSqm: 0.56,
    yieldMaundsPerAcre: 56.5,
    vsRegionalAvg: '+26% vs District Average',
    sowingDate: '18 Nov 2025',
    harvestDate: '10 Apr 2026',
    irrigationMethod: 'Furrow Bed Irrigation',
    fertilizerCompany: 'Engro Fertilizers',
    successFactors: [
      'Furrow beds prevented crown waterlogging',
      'Engro Zarkhez balanced fertilizer applied at sowing',
    ],
    cropCycle: [
      {
        day: 0,
        date: '18 Nov 2025',
        stageName: 'Sowing',
        title: 'Furrow Sowing + Engro Zarkhez',
        category: 'sow',
        companyOrSource: 'Syngenta + Engro',
        description: 'Planted on raised furrows with Engro Zarkhez (NPK).',
      },
      {
        day: 26,
        date: '14 Dec 2025',
        stageName: 'Tillering',
        title: '1st Furrow Watering + Weed Filter',
        category: 'water',
        companyOrSource: 'Canal Furrow',
        description: 'Water flowed along furrows without inundating the crowns. Weed control filter applied.',
      },
      {
        day: 62,
        date: '19 Jan 2026',
        stageName: 'Jointing',
        title: '2nd Watering + Engro Urea',
        category: 'water',
        companyOrSource: 'Tube-well + Engro',
        description: '2nd furrow irrigation with 1 bag Engro Urea.',
      },
      {
        day: 144,
        date: '10 Apr 2026',
        stageName: 'Harvest',
        title: 'Harvest Verified',
        category: 'harvest',
        companyOrSource: 'Harvester',
        description: '56.5 Maunds / Acre (0.56 kg/m²).',
      },
    ],
    playbookAvailable: true,
  },
];

export const REGIONAL_MAP_FIELDS = [
  {
    id: 'field_01',
    code: 'PK-FSD-04',
    name: 'North Canal Parcel · Mustafa Town',
    stageIndex: 2,
    stageName: 'Booting',
    variety: 'Akbar-2019',
    yieldKgSqm: 0.62,
    color: '#4F46E5',
    acres: 4.0,
    isMine: true,
    shapeType: 'rectangle',
    cycleStatus: 'active',
    pos: { top: 38, left: 24, w: 100, h: 75 },
    coordinates: [
      [31.4982, 74.2680],
      [31.4996, 74.2681],
      [31.4995, 74.2703],
      [31.4981, 74.2702],
    ],
  },
  {
    id: 'field_02',
    code: 'PK-FSD-02',
    name: 'Tubewell Square · Mustafa Town South',
    stageIndex: 1,
    stageName: 'Jointing',
    variety: 'Dilkash-20',
    yieldKgSqm: 0.54,
    color: '#0D9488',
    acres: 2.5,
    isMine: true,
    shapeType: 'square',
    cycleStatus: 'active',
    pos: { top: 52, left: 45, w: 85, h: 90 },
    coordinates: [
      [31.4965, 74.2680],
      [31.4979, 74.2681],
      [31.4978, 74.2698],
      [31.4964, 74.2697],
    ],
  },
  {
    id: 'field_03',
    code: 'PK-FSD-06',
    name: 'East Tube-well Block · Mustafa Town',
    stageIndex: 0,
    stageName: 'Fallow / Ready',
    variety: 'Unplanted',
    yieldKgSqm: 0.0,
    color: '#64748B',
    acres: 5.0,
    isMine: true,
    shapeType: 'rectangle',
    cycleStatus: 'not_started',
    pos: { top: 62, left: 34, w: 100, h: 72 },
    coordinates: [
      [31.4964, 74.2704],
      [31.4980, 74.2705],
      [31.4979, 74.2730],
      [31.4963, 74.2729],
    ],
  },
  {
    id: 'f_03',
    code: 'PK-FSD-07',
    name: 'Malik Farm East · Mustafa Town',
    stageIndex: 2,
    stageName: 'Booting',
    variety: 'Akbar-2019',
    yieldKgSqm: 0.61,
    color: '#4F46E5',
    acres: 8.0,
    isMine: false,
    shapeType: 'polygon',
    cycleStatus: 'active',
    pos: { top: 22, left: 52, w: 115, h: 70 },
    coordinates: [
      [31.5002, 74.2681],
      [31.5022, 74.2682],
      [31.5021, 74.2712],
      [31.5001, 74.2710],
    ],
  },
  {
    id: 'f_04',
    code: 'PK-FSD-12',
    name: 'Rehman Agro Unit',
    stageIndex: 0,
    stageName: 'Tillering',
    variety: 'Ghazi-19',
    yieldKgSqm: 0.48,
    color: '#16A34A',
    acres: 5.2,
    isMine: false,
    shapeType: 'rectangle',
    cycleStatus: 'active',
    pos: { top: 18, left: 16, w: 80, h: 65 },
    coordinates: [
      [31.4982, 74.2645],
      [31.4997, 74.2646],
      [31.4996, 74.2673],
      [31.4981, 74.2672],
    ],
  },
  {
    id: 'f_05',
    code: 'PK-FSD-19',
    name: 'Chaudhry Bio Plot',
    stageIndex: 3,
    stageName: 'Anthesis',
    variety: 'Dilkash-20',
    yieldKgSqm: 0.57,
    color: '#D97706',
    acres: 6.0,
    isMine: false,
    shapeType: 'circle',
    cycleStatus: 'active',
    pos: { top: 35, left: 68, w: 95, h: 80 },
    coordinates: [
      [31.5002, 74.2718],
      [31.5020, 74.2719],
      [31.5019, 74.2746],
      [31.5000, 74.2744],
    ],
  },
  {
    id: 'f_06',
    code: 'PK-FSD-23',
    name: 'Kisan Model Farm',
    stageIndex: 4,
    stageName: 'Grain Filling',
    variety: 'Akbar-2019',
    yieldKgSqm: 0.64,
    color: '#EA580C',
    acres: 10.0,
    isMine: false,
    shapeType: 'polygon',
    cycleStatus: 'active',
    pos: { top: 58, left: 18, w: 110, h: 85 },
    coordinates: [
      [31.4955, 74.2644],
      [31.4976, 74.2645],
      [31.4975, 74.2675],
      [31.4954, 74.2674],
    ],
  },
  {
    id: 'f_07',
    code: 'PK-FSD-31',
    name: 'Sultan Agro West',
    stageIndex: 1,
    stageName: 'Jointing',
    variety: 'Faisalabad-08',
    yieldKgSqm: 0.51,
    color: '#0D9488',
    acres: 3.5,
    isMine: false,
    shapeType: 'square',
    cycleStatus: 'active',
    pos: { top: 72, left: 52, w: 90, h: 75 },
    coordinates: [
      [31.4940, 74.2680],
      [31.4958, 74.2681],
      [31.4957, 74.2700],
      [31.4939, 74.2699],
    ],
  },
  {
    id: 'f_08',
    code: 'PK-FSD-40',
    name: 'Canal Vista Plot',
    stageIndex: 5,
    stageName: 'Maturity',
    variety: 'Sehar-06',
    yieldKgSqm: 0.52,
    color: '#B45309',
    acres: 4.8,
    isMine: false,
    shapeType: 'rectangle',
    cycleStatus: 'active',
    pos: { top: 68, left: 74, w: 85, h: 80 },
    coordinates: [
      [31.4940, 74.2705],
      [31.4958, 74.2706],
      [31.4957, 74.2730],
      [31.4939, 74.2729],
    ],
  },
];
