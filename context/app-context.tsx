import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { useFieldsQuery, FIELD_QUERY_KEYS } from '@/hooks/use-fields';
import { setAuthToken } from '@/services/api-client';
import { sessionStore } from '@/services/session-store';
import { logger } from '@/services/logger';
import { speechService } from '@/services/speech-service';

export const FALLBACK_EMPTY_FIELD: FieldData = {
  id: '',
  code: '',
  displayName: 'No Field Selected',
  areaAcres: 0,
  areaSqm: 0,
  wheatVariety: 'Unplanted',
  sowingDate: 'Not Started',
  sowingMethod: 'Drill Sowing',
  soilTexture: 'Sandy Loam',
  district: 'Faisalabad',
  currentStageIndex: 0,
  stageConfidence: 0.0,
  lastUpdated: 'No data',
  isUserField: true,
  cycleStatus: 'not_started',
  yieldReturnKgSqm: 0.0,
  yieldMaundsPerAcre: 0.0,
  coordinates: { latitude: 31.42, longitude: 73.08 },
  polygonCoords: [],
  history: [],
  fertilizerPlan: [],
  irrigationPlan: [],
  advisory: {
    summary: 'No active cycle found. Demarcate a field or start a crop cycle.',
    irrigationGuidance: '',
    nutrientGuidance: '',
    riskAlerts: [],
    actionRequired: false,
  },
};

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
  id?: string;
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
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  userProfile: UserProfile;
  login: (info?: Partial<UserProfile>, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  // Accessibility features
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: typeof TRANSLATIONS.en;
  fontScale: 'normal' | 'large';
  toggleFontScale: () => void;
  fontMultiplier: number;
  playingAudioId: string | null;
  playAudio: (id: string, textToSpeak?: string) => void;
  stopAudio: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState<FieldData[]>([]);
  const [selectedFieldId, setSelectedFieldIdState] = useState<string>('');
  const [peerShowcase] = useState<PeerShowcaseField[]>(PEER_BENCHMARK_SHOWCASE);
  const [adoptedPlaybooks, setAdoptedPlaybooks] = useState<string[]>([]);
  const [gyroSimulatedAngle, setGyroSimulatedAngle] = useState<number>(64);
  const [mapFields, setMapFields] = useState<MapFieldItem[]>([]);

  // Authentication State
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    fullName: 'Chaudhry Muhammad Akram',
    phoneNumber: '0300 8472910',
    district: 'Punjab, Pakistan',
    role: 'Progressive Wheat & Mustard Farmer',
    wheatAcreage: 18.5,
    totalFields: 3,
    seasonYieldMaunds: 840,
    cnicNumber: '35201-1984729-1',
  });

  // Restore secure persistent session on app start
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      try {
        const storedToken = await sessionStore.getToken();
        const storedProfile = await sessionStore.getUserProfile();

        if (storedToken && storedToken.trim() !== '') {
          setAuthToken(storedToken);
          if (isMounted) {
            setIsAuthenticated(true);
            if (storedProfile) {
              setUserProfile((prev) => ({ ...prev, ...storedProfile }));
            }
          }
          // Actively invalidate and trigger fresh query fetch for restored user
          queryClient.invalidateQueries({ queryKey: FIELD_QUERY_KEYS.all });
          logger.info('Restored authenticated session from secure storage.');
        } else {
          logger.info('No active session token found in secure storage.');
        }
      } catch (err: any) {
        logger.warn('Error while restoring session:', err?.message || err);
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    }
    restoreSession();
    return () => {
      isMounted = false;
    };
  }, [queryClient]);

  const { data: backendFields } = useFieldsQuery();

  // Sync backend fields to AppContext
  useEffect(() => {
    if (backendFields && Array.isArray(backendFields)) {
      if (backendFields.length === 0) {
        setFields([]);
        setSelectedFieldIdState('');
      } else {
        setFields((prevFields) => {
          return backendFields.map((bf) => {
            const existing = prevFields.find((f) => f.id === bf.field_id);
            let lat = 31.42;
            let lng = 73.08;
            let coordsArr: [number, number][] = [];
            try {
              if (bf.boundary_geojson?.type === 'Polygon' && bf.boundary_geojson.coordinates?.[0]) {
                coordsArr = bf.boundary_geojson.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
                if (coordsArr.length > 0) {
                  lat = coordsArr[0][0];
                  lng = coordsArr[0][1];
                }
              }
            } catch (_) {}

            return {
              id: bf.field_id,
              code: bf.field_code || 'PK-FSD-01',
              displayName: bf.field_name,
              areaAcres: bf.area_acres,
              areaSqm: bf.area_acres * 4046.86,
              wheatVariety: existing?.wheatVariety || (bf.current_cycle_id ? 'Akbar-2019' : 'Unplanted'),
              seedCompany: existing?.seedCompany || '',
              fertilizerCompany: existing?.fertilizerCompany || '',
              sowingDate: existing?.sowingDate || (bf.current_cycle_id ? 'In Season' : 'Not Started'),
              sowingMethod: existing?.sowingMethod || 'Drill Sowing (9 inch)',
              soilTexture: bf.soil_texture || 'Sandy Loam',
              district: 'Faisalabad',
              currentStageIndex: existing?.currentStageIndex ?? 0,
              stageConfidence: existing?.stageConfidence ?? 0.0,
              lastUpdated: existing?.lastUpdated || 'Recently updated',
              isUserField: true,
              cycleStatus: (existing?.cycleStatus || (bf.current_cycle_id ? 'active' : 'not_started')) as any,
              yieldReturnKgSqm: existing?.yieldReturnKgSqm || 0.0,
              yieldMaundsPerAcre: existing?.yieldMaundsPerAcre || 0.0,
              coordinates: { latitude: lat, longitude: lng },
              polygonCoords: [
                { x: 50, y: 50 },
                { x: 120, y: 50 },
                { x: 120, y: 120 },
                { x: 50, y: 120 },
              ],
              history: existing?.history || [],
              fertilizerPlan: existing?.fertilizerPlan || [],
              irrigationPlan: existing?.irrigationPlan || [],
              advisory: existing?.advisory || {
                summary: bf.current_cycle_id
                  ? 'Active wheat crop cycle in progress.'
                  : 'Cycle not started. Field boundary is demarcated and land is prepared for sowing.',
                irrigationGuidance: 'Perform Rauni (pre-sowing irrigation) before drilling.',
                nutrientGuidance: 'Select your wheat seed variety and fertilizer company to start cycle tracking.',
                riskAlerts: ['Ensure soil moisture check before sowing.'],
                actionRequired: !bf.current_cycle_id,
              },
            };
          });
        });

        setSelectedFieldIdState((prevId) => {
          const exists = backendFields.some((f) => f.field_id === prevId);
          if (exists) return prevId;
          return backendFields[0].field_id;
        });
      }
    }
  }, [backendFields]);

  const login = async (info?: Partial<UserProfile>, token?: string) => {
    setIsAuthenticated(true);
    if (token) {
      setAuthToken(token);
      await sessionStore.saveToken(token);
    }
    if (info) {
      setUserProfile((prev) => {
        const next = { ...prev, ...info };
        sessionStore.saveUserProfile(next);
        return next;
      });
    }
    queryClient.invalidateQueries({ queryKey: FIELD_QUERY_KEYS.all });
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setAuthToken(null);
    await sessionStore.clearSession();
    setFields([]);
    setSelectedFieldIdState('');
    queryClient.clear();
  };

  // Farmer Accessibility State
  const [language, setLanguage] = useState<Language>('en');
  const [fontScale, setFontScale] = useState<'normal' | 'large'>('normal');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const selectedField = fields.find((f) => f.id === selectedFieldId) || fields[0] || FALLBACK_EMPTY_FIELD;

  const setSelectedFieldId = (id: string) => {
    setSelectedFieldIdState(id);
  };

  const toggleLanguage = () => {
    speechService.stop();
    setPlayingAudioId(null);
    setLanguage((prev) => (prev === 'en' ? 'ur' : 'en'));
  };

  const toggleFontScale = () => {
    setFontScale((prev) => (prev === 'normal' ? 'large' : 'normal'));
  };

  const playAudio = (id: string, textToSpeak?: string) => {
    // If user taps the active playing audio button, toggle off and stop speech
    if (playingAudioId === id) {
      speechService.stop();
      setPlayingAudioId(null);
      return;
    }

    setPlayingAudioId(id);

    // Resolve text to speak offline based on active language and displayed content
    let speechContent = textToSpeak;
    if (!speechContent || speechContent.trim() === '') {
      const isUrdu = language === 'ur';
      if (id === 'camera_guidance') {
        speechContent = isUrdu
          ? 'کیمرے کو گندم کی فصل کی طرف پینتالیس سے ساٹھ ڈگری کے زاویے پر نیچے جھکائیں۔ جب زاویہ درست ہو جائے تو تصویر بنائیں۔'
          : 'Tilt the camera forty-five to sixty degrees down towards the wheat canopy. When the indicator turns green, capture the photo.';
      } else if (id === 'dashboard_advice') {
        const water = selectedField.advisory.irrigationGuidance;
        const nutrient = selectedField.advisory.nutrientGuidance;
        const alertMsg = selectedField.advisory.riskAlerts?.[0] || '';
        speechContent = isUrdu
          ? `فصل کی رہنمائی۔ آبپاشی: ${water}۔ کھاد: ${nutrient}۔ ${alertMsg}`
          : `Crop guidance. Irrigation: ${water}. Fertilizer: ${nutrient}. ${alertMsg}`;
      } else {
        speechContent = isUrdu ? 'زرعی فیصلہ سازی کی رہنمائی' : 'Agricultural decision support guidance';
      }
    }

    speechService.speak(speechContent, {
      language,
      onDone: () => setPlayingAudioId(null),
      onStopped: () => setPlayingAudioId(null),
      onError: () => setPlayingAudioId(null),
    });
  };

  const stopAudio = () => {
    speechService.stop();
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
    const newId = input.id || `field_${Date.now()}`;
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

    setFields((prev) => [newField, ...prev.filter((f) => f.id !== newId)]);
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
      coordinates: input.coordinates,
    };
    setMapFields((prev) => [newMapField, ...prev.filter((m) => m.id !== newId)]);
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
        isAuthLoading,
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
