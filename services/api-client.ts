import { Platform } from 'react-native';
import { logger } from './logger';

export class BackendUnreachableError extends Error {
  public baseUrl: string;
  constructor(message: string, baseUrl: string) {
    super(message);
    this.name = 'BackendUnreachableError';
    this.baseUrl = baseUrl;
  }
}

// ==========================================
// User & Auth DTOs
// ==========================================
export interface UserProfileDTO {
  user_id: string;
  full_name: string;
  phone_number: string;
  role: string;
  district: string;
  language_pref: string;
  created_at: string;
}

export interface AuthResponseDTO {
  access_token: string;
  token_type: string;
  user: UserProfileDTO;
}

// ==========================================
// Field DTOs
// ==========================================
export interface FieldCreateDTO {
  field_name: string;
  shape_type: string;
  area_acres: number;
  area_sqm?: number;
  boundary_geojson: any;
  center_latitude?: number;
  center_longitude?: number;
  soil_texture?: string;
}

export interface FieldUpdateDTO {
  field_name?: string;
  shape_type?: string;
  area_acres?: number;
  area_sqm?: number;
  boundary_geojson?: any;
  center_latitude?: number;
  center_longitude?: number;
  soil_texture?: string;
}

export interface FieldResponseDTO {
  field_id: string;
  field_code?: string;
  user_id: string;
  field_name: string;
  shape_type: string;
  area_acres: number;
  area_sqm: number;
  boundary_geojson: any;
  center_latitude: number;
  center_longitude: number;
  soil_texture?: string;
  current_cycle_id?: string | null;
  created_at: string;
}

// ==========================================
// Crop Cycle & Schedule DTOs
// ==========================================
export interface StartCycleDTO {
  field_id: string;
  wheat_variety: string;
  seed_company: string;
  fertilizer_company: string;
  sowing_method?: string;
  sowing_date: string; // ISO YYYY-MM-DD
  target_harvest_date?: string;
}

export interface FertilizerScheduleDTO {
  schedule_id: number;
  cycle_id: string;
  stage_name: string;
  nutrient_type: string;
  dose_per_acre: string;
  target_das: number;
  is_applied: boolean;
  applied_date?: string | null;
}

export interface IrrigationScheduleDTO {
  schedule_id: number;
  cycle_id: string;
  stage_name: string;
  event_name: string;
  target_das: number;
  water_depth_inches: number;
  is_completed: boolean;
  completed_date?: string | null;
}

export interface CycleResponseDTO {
  cycle_id: string;
  field_id: string;
  wheat_variety: string;
  seed_company: string;
  fertilizer_company: string;
  sowing_method: string;
  sowing_date: string;
  target_harvest_date: string;
  is_active: boolean;
  created_at: string;
  fertilizer_schedules: FertilizerScheduleDTO[];
  irrigation_schedules: IrrigationScheduleDTO[];
}

// ==========================================
// Observation DTOs
// ==========================================
export interface ObservationResponseDTO {
  observation_id: string;
  cycle_id: string;
  image_uri: string;
  stage_index: number;
  stage_name: string;
  confidence: number;
  pitch_angle_deg: number;
  blur_score: number;
  das: number;
  created_at: string;
}

export interface UploadObservationParams {
  cycleId: string;
  stageIndex: number;
  stageName: string;
  confidence: number;
  pitchAngleDeg: number;
  blurScore: number;
  das: number;
  imageUri: string;
  filename?: string;
}

// ==========================================
// Advisory DTOs
// ==========================================
export interface AdvisoryRuleDTO {
  rule_id: number;
  stage_index: number;
  stage_name: string;
  primary_action: string;
  primary_action_ur: string;
  secondary_advice: string;
  secondary_advice_ur: string;
  critical_nutrient: string;
  water_recommendation: string;
  weed_management: string;
}

// ==========================================
// Peer Showcase DTOs
// ==========================================
export interface ShowcasePostDTO {
  showcase_id: string;
  field_code?: string;
  district?: string;
  wheat_variety: string;
  seed_company?: string;
  fertilizer_company?: string;
  area_acres?: number;
  shape_type?: string;
  yield_maunds_per_acre?: number;
  yield_kg_sqm?: number;
  sowing_date?: string | null;
  harvest_date?: string | null;
  cycle_event_log?: any[];

  // User submission fields (if any)
  user_id?: string;
  title?: string;
  field_name?: string;
  region?: string;
  actual_yield_maunds?: number;
  harvesting_date?: string | null;
  key_tactics?: string | null;
  photo_url?: string | null;
  created_at?: string;
}

export interface ShowcaseCreateDTO {
  title: string;
  field_name: string;
  region: string;
  wheat_variety: string;
  actual_yield_maunds: number;
  sowing_date?: string;
  harvesting_date?: string;
  key_tactics?: string;
  photo_url?: string;
}

// ==========================================
// Auth Token & URL Management
// ==========================================
let activeAuthToken: string | null = null;
let customBackendUrl: string | null = null;

export function setAuthToken(token: string | null) {
  activeAuthToken = token;
}

export function getAuthToken(): string | null {
  return activeAuthToken;
}

export function setBackendBaseUrl(url: string | null) {
  customBackendUrl = url ? url.trim().replace(/\/+$/, '') : null;
}

export function getBackendBaseUrl(): string {
  if (customBackendUrl) {
    return customBackendUrl;
  }
  const envUrl =
    process.env.EXPO_PUBLIC_BACKEND_API_URL ||
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return 'https://nextgenyield-backend.onrender.com';
}

interface RequestOptions extends RequestInit {
  silent404?: boolean;
}

// ==========================================
// Centralized API Client
// ==========================================
class ApiClient {
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const baseUrl = getBackendBaseUrl();
    const url = `${baseUrl}/api/v1${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (activeAuthToken) {
      headers['Authorization'] = `Bearer ${activeAuthToken}`;
    }

    logger.debug(`API Request: [${options.method || 'GET'}] ${url}`);

    let res: Response;
    try {
      res = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkErr: any) {
      logger.warn(`Network unavailable connecting to backend at ${url}:`, networkErr?.message || networkErr);
      throw new BackendUnreachableError(
        `Unable to reach backend server at ${baseUrl}. Please check your connection or server status.`,
        baseUrl
      );
    }

    if (!res.ok) {
      let errMsg = `Request failed with status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) {
          errMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch (_) { }

      if (res.status === 404 && options.silent404) {
        logger.debug(`API expected 404 handled on ${endpoint}: ${errMsg}`);
      } else {
        logger.warn(`API response status [${res.status}] on ${endpoint}:`, errMsg);
      }

      const error: any = new Error(errMsg);
      error.status = res.status;
      throw error;
    }

    logger.debug(`API Success: [${options.method || 'GET'}] ${url} (${res.status})`);

    // Support HTTP 204 No Content
    if (res.status === 204) {
      return {} as T;
    }

    return res.json() as Promise<T>;
  }

  // --- Auth Endpoints ---
  async register(params: {
    fullName: string;
    phoneNumber: string;
    password: string;
    district?: string;
    role?: string;
    languagePref?: string;
  }): Promise<AuthResponseDTO> {
    return this.request<AuthResponseDTO>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: params.fullName,
        phone_number: params.phoneNumber,
        password: params.password,
        district: params.district || 'Faisalabad',
        role: params.role || 'farmer',
        language_pref: params.languagePref || 'en',
      }),
    });
  }

  async login(phoneNumber: string, pinOrPass: string): Promise<AuthResponseDTO> {
    return this.request<AuthResponseDTO>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber,
        password: pinOrPass,
      }),
    });
  }

  async getMe(): Promise<UserProfileDTO> {
    return this.request<UserProfileDTO>('/auth/me');
  }

  // --- Fields Endpoints ---
  async getFields(): Promise<FieldResponseDTO[]> {
    return this.request<FieldResponseDTO[]>('/fields/');
  }

  async getField(fieldId: string): Promise<FieldResponseDTO> {
    return this.request<FieldResponseDTO>(`/fields/${fieldId}`);
  }

  async createField(field: FieldCreateDTO): Promise<FieldResponseDTO> {
    return this.request<FieldResponseDTO>('/fields/', {
      method: 'POST',
      body: JSON.stringify(field),
    });
  }

  async updateField(fieldId: string, field: FieldUpdateDTO): Promise<FieldResponseDTO> {
    return this.request<FieldResponseDTO>(`/fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify(field),
    });
  }

  async deleteField(fieldId: string): Promise<void> {
    await this.request<void>(`/fields/${fieldId}`, {
      method: 'DELETE',
    });
  }

  // --- Crop Cycles Endpoints ---
  async startCropCycle(cycle: StartCycleDTO): Promise<CycleResponseDTO> {
    return this.request<CycleResponseDTO>('/crop-cycles/start', {
      method: 'POST',
      body: JSON.stringify({
        field_id: cycle.field_id,
        wheat_variety: cycle.wheat_variety,
        seed_company: cycle.seed_company,
        fertilizer_company: cycle.fertilizer_company,
        sowing_method: cycle.sowing_method || 'Drill Sowing',
        sowing_date: cycle.sowing_date,
        target_harvest_date: cycle.target_harvest_date,
      }),
    });
  }

  async getCropCycle(cycleId: string): Promise<CycleResponseDTO> {
    return this.request<CycleResponseDTO>(`/crop-cycles/${cycleId}`);
  }

  async getActiveCropCycle(fieldId: string): Promise<CycleResponseDTO | null> {
    if (!fieldId || fieldId.startsWith('field_0')) {
      return null;
    }
    try {
      return await this.request<CycleResponseDTO>(`/crop-cycles/field/${fieldId}/active`, {
        silent404: true,
      });
    } catch (err: any) {
      if (
        err?.status === 404 ||
        err?.message?.includes('404') ||
        err?.message?.includes('No active crop cycle') ||
        err?.message?.includes('not found')
      ) {
        return null;
      }
      throw err;
    }
  }

  async applyFertilizer(scheduleId: number): Promise<FertilizerScheduleDTO> {
        return this.request<FertilizerScheduleDTO>(`/crop-cycles/fertilizer/${scheduleId}/apply`, {
          method: 'PUT',
        });
      }

  async completeIrrigation(scheduleId: number): Promise<IrrigationScheduleDTO> {
        return this.request<IrrigationScheduleDTO>(`/crop-cycles/irrigation/${scheduleId}/complete`, {
          method: 'PUT',
        });
      }

  // --- Observations Endpoints ---
  async getObservations(cycleId: string): Promise<ObservationResponseDTO[]> {
        return this.request<ObservationResponseDTO[]>(`/observations/cycle/${cycleId}`);
      }

  async uploadObservation(params: UploadObservationParams): Promise<ObservationResponseDTO> {
        const baseUrl = getBackendBaseUrl();
        const url = `${baseUrl}/api/v1/observations/`;

        const formData = new FormData();
        formData.append('cycle_id', params.cycleId);
        formData.append('stage_index', String(params.stageIndex));
        formData.append('stage_name', params.stageName);
        formData.append('confidence', String(params.confidence));
        formData.append('pitch_angle_deg', String(params.pitchAngleDeg));
        formData.append('blur_score', String(params.blurScore));
        formData.append('das', String(params.das));

        const filename = params.filename || `canopy_${Date.now()}.jpg`;

        // React Native FormData file attachment
        formData.append('image', {
          uri: params.imageUri,
          name: filename,
          type: 'image/jpeg',
        } as any);

        const headers: Record<string, string> = {};
        if (activeAuthToken) {
          headers['Authorization'] = `Bearer ${activeAuthToken}`;
        }

        logger.debug(`API Upload Observation: [POST] ${url}`);

        let res: Response;
        try {
          res = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
          });
        } catch (networkErr: any) {
          logger.warn(`Network unavailable during observation upload to ${url}:`, networkErr?.message || networkErr);
          throw new BackendUnreachableError(
            `Unable to reach backend server at ${baseUrl}. Please check your connection or server status.`,
            baseUrl
          );
        }

        if (!res.ok) {
          let errMsg = `Upload failed with status ${res.status}`;
          try {
            const errJson = await res.json();
            if (errJson.detail) {
              errMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
            }
          } catch (_) { }
          logger.warn(`API upload error [${res.status}]:`, errMsg);
          throw new Error(errMsg);
        }

        return res.json() as Promise<ObservationResponseDTO>;
      }

  // --- Agronomic Advisory Endpoints ---
  async getAdvisoryRules(): Promise<AdvisoryRuleDTO[]> {
        return this.request<AdvisoryRuleDTO[]>('/advisory/rules');
      }

  async getAdvisoryRule(stageIndex: number): Promise<AdvisoryRuleDTO> {
        return this.request<AdvisoryRuleDTO>(`/advisory/rules/${stageIndex}`);
      }

  // --- Peer Showcase Endpoints ---
  async getShowcasePosts(): Promise<ShowcasePostDTO[]> {
        return this.request<ShowcasePostDTO[]>('/showcase/');
      }

  async getShowcasePost(showcaseId: string): Promise<ShowcasePostDTO> {
        return this.request<ShowcasePostDTO>(`/showcase/${showcaseId}`);
      }

  async submitShowcase(post: ShowcaseCreateDTO): Promise<ShowcasePostDTO> {
        return this.request<ShowcasePostDTO>('/showcase/', {
          method: 'POST',
          body: JSON.stringify(post),
        });
      }
    }

    export const api = new ApiClient();
    export default api;
