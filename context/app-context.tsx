import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  MOCK_FIELDS,
  PEER_BENCHMARK_SHOWCASE,
  REGIONAL_MAP_FIELDS,
  FieldData,
  PeerShowcaseField,
  DETERMINISTIC_ADVISORY,
  FieldObservation,
} from '@/constants/mock-data';
import { TRANSLATIONS, Language } from '@/constants/translations';

export interface MapFieldItem {
  id: string;
  code: string;
  name: string;
  stageIndex: number;
  stageName: string;
  variety: string;
  yieldKgSqm: number;
  color: string;
  acres: number;
  isMine: boolean;
  shapeType?: 'rectangle' | 'square' | 'polygon' | 'circle';
  cycleStatus?: 'not_started' | 'active' | 'completed';
  fertilizerCompany?: string;
  pos?: { top: number; left: number; w: number; h: number };
  coordinates?: [number, number][];
}

export interface NewFieldInput {
  code: string;
  displayName: string;
  areaAcres: number;
  shapeType: 'rectangle' | 'square' | 'polygon' | 'circle';
  soilTexture?: string;
  pos?: { top: number; left: number; w: number; h: number };
  coordinates?: [number, number][];
}

export interface StartCycleInput {
  fieldId: string;
  wheatVariety: string;
  seedCompany: string;
  fertilizerCompany: string;
  sowingDate: string;
  sowingMethod?: string;
  targetYieldMaunds?: number;
}

export interface UserProfile {
  fullName: string;
  phoneNumber: string;
  district: string;
  role: string;
  wheatAcreage: number;
  totalFields: number;
  seasonYieldMaunds: number;
  avatarUri?: string;
  cnicNumber?: string;
}

interface AppContextType {
  fields: FieldData[];
  selectedField: FieldData;
  setSelectedFieldId: (id: string) => void;
  selectedFieldId: string;
  addScanObservation: (observation: Omit<FieldObservation, 'id' | 'date' | 'daysAgo'>) => void;
  peerShowcase: PeerShowcaseField[];
  adoptedPlaybooks: string[];
  adoptPlaybook: (peerFieldId: string) => void;
  gyroSimulatedAngle: number;
  setGyroSimulatedAngle: (angle: number) => void;
  mapFields: MapFieldItem[];
  addNewField: (input: NewFieldInput) => void;
  startCropCycle: (input: StartCycleInput) => void;
  // Authentication & Profile
  isAuthenticated: boolean;
  userProfile: UserProfile;
  login: (info?: Partial<UserProfile>) => void;
  logout: () => void;
  // Accessibility features
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: typeof TRANSLATIONS.en;
  fontScale: 'normal' | 'large';
  toggleFontScale: () => void;
  fontMultiplier: number;
  playingAudioId: string | null;
  playAudio: (id: string) => void;
  stopAudio: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [fields, setFields] = useState<FieldData[]>(MOCK_FIELDS);
  const [selectedFieldId, setSelectedFieldIdState] = useState<string>('field_01');
  const [peerShowcase] = useState<PeerShowcaseField[]>(PEER_BENCHMARK_SHOWCASE);
  const [adoptedPlaybooks, setAdoptedPlaybooks] = useState<string[]>([]);
  const [gyroSimulatedAngle, setGyroSimulatedAngle] = useState<number>(64);
  const [mapFields, setMapFields] = useState<MapFieldItem[]>(REGIONAL_MAP_FIELDS as MapFieldItem[]);

  // Authentication State (defaults to false so login screen is shown first)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    fullName: 'Chaudhry Muhammad Akram',
    phoneNumber: '0300 8472910',
    district: 'Lahore / Mustafa Town',
    role: 'Progressive Wheat & Mustard Farmer',
    wheatAcreage: 18.5,
    totalFields: 3,
    seasonYieldMaunds: 840,
    cnicNumber: '35201-1984729-1',
  });

  const login = (info?: Partial<UserProfile>) => {
    setIsAuthenticated(true);
    if (info) {
      setUserProfile((prev) => ({ ...prev, ...info }));
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  // Farmer Accessibility State
  const [language, setLanguage] = useState<Language>('en');
  const [fontScale, setFontScale] = useState<'normal' | 'large'>('normal');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const selectedField = fields.find((f) => f.id === selectedFieldId) || fields[0];

  const setSelectedFieldId = (id: string) => {
    setSelectedFieldIdState(id);
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ur' : 'en'));
  };

  const toggleFontScale = () => {
    setFontScale((prev) => (prev === 'normal' ? 'large' : 'normal'));
  };

  const playAudio = (id: string) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
      setTimeout(() => {
        setPlayingAudioId((current) => (current === id ? null : current));
      }, 6000);
    }
  };

  const stopAudio = () => {
    setPlayingAudioId(null);
  };

  const addScanObservation = (observation: Omit<FieldObservation, 'id' | 'date' | 'daysAgo'>) => {
    const newObs: FieldObservation = {
      ...observation,
      id: `obs_${Date.now()}`,
      date: 'Just now',
      daysAgo: 'Today',
    };

    setFields((prev) =>
      prev.map((f) => {
        if (f.id === selectedFieldId) {
          return {
            ...f,
            currentStageIndex: observation.stageIndex,
            stageConfidence: observation.confidence,
            lastUpdated: 'Just now',
            history: [newObs, ...f.history],
            advisory: DETERMINISTIC_ADVISORY[observation.stageIndex] || f.advisory,
          };
        }
        return f;
      })
    );
  };

  const adoptPlaybook = (peerFieldId: string) => {
    if (!adoptedPlaybooks.includes(peerFieldId)) {
      setAdoptedPlaybooks((prev) => [...prev, peerFieldId]);
    }
  };

  const addNewField = (input: NewFieldInput) => {
    const newId = `field_${Date.now()}`;
    const newField: FieldData = {
      id: newId,
      code: input.code,
      displayName: input.displayName,
      areaAcres: input.areaAcres,
      areaSqm: input.areaAcres * 4046.86,
      wheatVariety: 'Unplanted',
      seedCompany: '',
      fertilizerCompany: '',
      sowingDate: 'Not Started',
      sowingMethod: 'Drill Sowing (9 inch)',
      soilTexture: input.soilTexture || 'Sandy Loam',
      district: 'Faisalabad',
      currentStageIndex: 0,
      stageConfidence: 0.0,
      lastUpdated: 'Boundary Added',
      isUserField: true,
      cycleStatus: 'not_started',
      yieldReturnKgSqm: 0.0,
      yieldMaundsPerAcre: 0.0,
      coordinates: { latitude: 31.42, longitude: 73.08 },
      polygonCoords: [
        { x: 50, y: 50 },
        { x: 120, y: 50 },
        { x: 120, y: 120 },
        { x: 50, y: 120 },
      ],
      history: [],
      fertilizerPlan: [],
      irrigationPlan: [],
      advisory: {
        summary: 'Cycle not started. Field boundary is demarcated and land is prepared for sowing.',
        irrigationGuidance: 'Perform Rauni (pre-sowing irrigation) before drilling.',
        nutrientGuidance: 'Select your wheat seed variety and fertilizer company to start cycle tracking.',
        riskAlerts: ['Ensure soil moisture check before sowing.'],
        actionRequired: true,
      },
    };

    setFields((prev) => [newField, ...prev]);
    setSelectedFieldIdState(newId);

    // Add to map
    const defaultPos = input.pos || { top: 42, left: 32, w: 95, h: 80 };
    const newMapField: MapFieldItem = {
      id: newId,
      code: input.code,
      name: input.displayName,
      stageIndex: 0,
      stageName: 'Fallow / Ready',
      variety: 'Unplanted',
      yieldKgSqm: 0.0,
      color: '#94A3B8',
      acres: input.areaAcres,
      isMine: true,
      shapeType: input.shapeType,
      cycleStatus: 'not_started',
      pos: defaultPos,
      coordinates: input.coordinates || [
        [31.4970, 74.2650],
        [31.4985, 74.2651],
        [31.4984, 74.2670],
        [31.4969, 74.2669],
      ],
    };
    setMapFields((prev) => [newMapField, ...prev]);
  };

  const startCropCycle = (input: StartCycleInput) => {
    const yieldMaunds = input.targetYieldMaunds || 55.0;
    const yieldKg = yieldMaunds / 100;

    setFields((prev) =>
      prev.map((f) => {
        if (f.id === input.fieldId) {
          return {
            ...f,
            cycleStatus: 'active',
            wheatVariety: input.wheatVariety,
            seedCompany: input.seedCompany,
            fertilizerCompany: input.fertilizerCompany,
            sowingDate: input.sowingDate,
            sowingMethod: input.sowingMethod || 'Drill Sowing (9 inch)',
            yieldMaundsPerAcre: yieldMaunds,
            yieldReturnKgSqm: yieldKg,
            currentStageIndex: 0,
            stageConfidence: 0.95,
            lastUpdated: 'Cycle started today',
            advisory: DETERMINISTIC_ADVISORY[0],
            fertilizerPlan: [
              {
                stage: 'Sowing (Basal)',
                type: `${input.fertilizerCompany} DAP (1.5 bags)`,
                dosePerAcre: '75 kg / Acre',
                date: input.sowingDate,
                applied: true,
              },
              {
                stage: 'Tillering (1st Split)',
                type: `${input.fertilizerCompany} Urea + Zinc Sulfate 33%`,
                dosePerAcre: '1 bag Urea (50 kg) + 5 kg Zinc',
                date: 'Due Day 22',
                applied: false,
              },
              {
                stage: 'Jointing (2nd Split)',
                type: `${input.fertilizerCompany} Urea (Nitrogen top-dress)`,
                dosePerAcre: '1 bag Urea (50 kg)',
                date: 'Due Day 55',
                applied: false,
              },
              {
                stage: 'Booting (Foliar)',
                type: 'Potassium / Micronutrients',
                dosePerAcre: 'Foliar spray check',
                date: 'Due Day 80',
                applied: false,
              },
            ],
            irrigationPlan: [
              {
                event: 'Rouni (Pre-sowing flooding)',
                source: 'Canal Supply',
                date: input.sowingDate,
                completed: true,
              },
              {
                event: '1st Irrigation (CRI Stage)',
                source: 'Canal Supply',
                date: 'Expected Day 22',
                completed: false,
              },
              {
                event: '2nd Irrigation (Jointing)',
                source: 'Tube-well + Solar',
                date: 'Expected Day 55',
                completed: false,
              },
              {
                event: '3rd Irrigation (Booting)',
                source: 'Canal Supply',
                date: 'Expected Day 80',
                completed: false,
              },
            ],
            history: [
              {
                id: `obs_sow_${Date.now()}`,
                date: input.sowingDate,
                daysAgo: 'Today',
                stageIndex: 0,
                stageName: 'Tillering',
                confidence: 0.95,
                imageUri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
                sharpnessScore: 96,
                angleScore: 70,
              },
            ],
          };
        }
        return f;
      })
    );

    setMapFields((prev) =>
      prev.map((mf) => {
        if (mf.id === input.fieldId) {
          return {
            ...mf,
            cycleStatus: 'active',
            variety: input.wheatVariety,
            fertilizerCompany: input.fertilizerCompany,
            stageIndex: 0,
            stageName: 'Tillering',
            color: '#10B981',
            yieldKgSqm: yieldKg,
          };
        }
        return mf;
      })
    );

    setSelectedFieldIdState(input.fieldId);
  };

  const t = TRANSLATIONS[language];
  const fontMultiplier = fontScale === 'large' ? 1.15 : 1.0;

  return (
    <AppContext.Provider
      value={{
        fields,
        selectedField,
        selectedFieldId,
        setSelectedFieldId,
        addScanObservation,
        peerShowcase,
        adoptedPlaybooks,
        adoptPlaybook,
        gyroSimulatedAngle,
        setGyroSimulatedAngle,
        mapFields,
        addNewField,
        startCropCycle,
        isAuthenticated,
        userProfile,
        login,
        logout,
        language,
        toggleLanguage,
        setLanguage,
        t,
        fontScale,
        toggleFontScale,
        fontMultiplier,
        playingAudioId,
        playAudio,
        stopAudio,
      }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
