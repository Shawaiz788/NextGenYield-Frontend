import { Platform } from 'react-native';

// ─── Type Definitions Matching FastAPI Backend ──────────────────────────────

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  device: string;
  device_name: string;
  gpu_memory_allocated_mb: number;
  model_version: string;
  timestamp: string;
}

export interface PredictionProbabilities {
  tillering: number;
  jointing: number;
  booting: number;
  anthesis: number;
  grain_filling: number;
  maturity: number;
}

export interface ModelMetadata {
  backbone: string;
  classifier_head: string;
  version: string;
  device: string;
  inference_latency_ms: number;
}

export interface AgronomicAdvisory {
  display_name: string;
  primary_objective: string;
  summary: string;
  irrigation_guidance: string;
  nutrient_guidance: string;
  protection_guidance: string;
  risk_alerts: string[];
}

export interface GrowthStagePrediction {
  stage_index: number;
  stage_name: string;
  raw_class: string;
  confidence: number;
  confidence_rating: 'high' | 'moderate' | 'low / uncertain' | string;
  field_id?: string;
  crop_type: string;
  probabilities: PredictionProbabilities;
  model_metadata: ModelMetadata;
  advisory: AgronomicAdvisory;
}

export interface PredictionApiResponse {
  status: 'success' | 'error';
  data: GrowthStagePrediction;
  message?: string;
}

// ─── Network Addressing Configuration ───────────────────────────────────────

let customBaseUrl: string | null = null;

export function setCustomBaseUrl(url: string) {
  customBaseUrl = url.trim().replace(/\/+$/, '');
}

export function getCustomBaseUrl(): string | null {
  return customBaseUrl;
}

export function getDefaultBaseUrl(): string {
  if (customBaseUrl) {
    return customBaseUrl;
  }
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return 'https://duykd-202-1-27-175.run.pinggy-free.link';
}

// ─── Offline / Demo Fallback Data ───────────────────────────────────────────

export const MOCK_BOOTING_PREDICTION: GrowthStagePrediction = {
  stage_index: 2,
  stage_name: 'booting',
  raw_class: '2_booting',
  confidence: 0.9421,
  confidence_rating: 'high',
  field_id: 'field_punjab_north_04',
  crop_type: 'wheat',
  probabilities: {
    tillering: 0.0012,
    jointing: 0.0451,
    booting: 0.9421,
    anthesis: 0.0104,
    grain_filling: 0.0011,
    maturity: 0.0001,
  },
  model_metadata: {
    backbone: 'FoMo4Wheat_base (ViT-B/14)',
    classifier_head: 'nextgenyeild_wgsp_head_v1',
    version: 'fomo4wheat-wgsp-v1',
    device: 'cuda',
    inference_latency_ms: 19.75,
  },
  advisory: {
    display_name: 'Booting',
    primary_objective: 'Pollen development and wheat spike protection inside the flag leaf sheath.',
    summary: 'Crop is in the Booting stage. The head is actively swelling inside the sheath of the flag leaf.',
    irrigation_guidance: 'Critical moisture window. Water deficit during booting irreversibly reduces potential spikelet count and head length.',
    nutrient_guidance: 'Avoid heavy granular nitrogen. Apply corrective foliar micronutrients (Zinc, Boron) if micronutrient deficiency symptoms are visible.',
    protection_guidance: 'Protect the flag leaf at all costs (it drives > 50% of eventual grain yield). Spray protective fungicide if stripe rust or powdery mildew is present in the field.',
    risk_alerts: [
      'Flag leaf damage directly slashes ultimate harvest yield by up to 50%.',
      'Moisture stress right before heading causes sterile florets.',
    ],
  },
};

// ─── API Client Methods ─────────────────────────────────────────────────────

/**
 * Fetch server device health and model loaded status
 * Route: GET /api/v1/health or GET /health
 */
export async function fetchServerHealth(baseUrl: string = getDefaultBaseUrl()): Promise<HealthResponse> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${cleanBase}/api/v1/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Fallback try /health without /api/v1 prefix
      const fallbackRes = await fetch(`${cleanBase}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!fallbackRes.ok) {
        throw new Error(`Server returned HTTP ${fallbackRes.status}`);
      }
      return await fallbackRes.json();
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export interface PredictParams {
  imageUri: string;
  fieldId?: string;
  cropType?: string;
  baseUrl?: string;
}

/**
 * Predict Wheat Growth Stage via FoMo4Wheat backend
 * Route: POST /api/v1/ai/growth-stage/predict
 */
export async function predictGrowthStage({
  imageUri,
  fieldId = 'field_01',
  cropType = 'wheat',
  baseUrl = getDefaultBaseUrl(),
}: PredictParams): Promise<GrowthStagePrediction> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const url = `${cleanBase}/api/v1/ai/growth-stage/predict`;

  const formData = new FormData();

  if (Platform.OS === 'web') {
    // For web environment: fetch uri and convert to blob
    try {
      const imgRes = await fetch(imageUri);
      const blob = await imgRes.blob();
      formData.append('image', blob, 'wheat_canopy.jpg');
    } catch {
      // If data uri or local asset fails to blob, try standard append
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'wheat_canopy.jpg',
      } as any);
    }
  } else {
    // Native React Native (iOS & Android)
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'wheat_canopy.jpg',
    } as any);
  }

  if (fieldId) {
    formData.append('field_id', fieldId);
  }
  formData.append('crop_type', cropType);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Prediction API error [${response.status}]: ${errorText || response.statusText}`);
    }

    const json: PredictionApiResponse = await response.json();
    if (json.status !== 'success' || !json.data) {
      throw new Error(json.message || 'Prediction failed to return valid data');
    }

    return json.data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}
