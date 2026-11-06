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

export interface FieldCreateDTO {
  field_name: string;
  shape_type: string;
  area_acres: number;
  area_sqm?: number;
  boundary_geojson: any;
  center_latitude?: number;
  center_longitude?: number;
}

export interface FieldResponseDTO {
  field_id: string;
  user_id: string;
  field_name: string;
  shape_type: string;
  area_acres: number;
  area_sqm: number;
  boundary_geojson: any;
  center_latitude: number;
  center_longitude: number;
  current_cycle_id?: string;
  created_at: string;
}

export interface StartCycleDTO {
  field_id: string;
  wheat_variety: string;
  seed_company: string;
  fertilizer_company: string;
  sowing_method?: string;
  sowing_date: string;
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
  fertilizer_schedules: any[];
  irrigation_schedules: any[];
}

let activeAuthToken: string | null = null;

export function setAuthToken(token: string | null) {
  activeAuthToken = token;
}

export function getAuthToken(): string | null {
  return activeAuthToken;
}

export function getBackendBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_API_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return 'http://10.250.174.230:8000';
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      } catch (_) {}
      logger.warn(`API response status [${res.status}] on ${endpoint}:`, errMsg);
      throw new Error(errMsg);
    }

    logger.debug(`API Success: [${options.method || 'GET'}] ${url} (${res.status})`);
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

  async createField(field: FieldCreateDTO): Promise<FieldResponseDTO> {
    return this.request<FieldResponseDTO>('/fields/', {
      method: 'POST',
      body: JSON.stringify(field),
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
      }),
    });
  }

  // --- Agronomic Advisory & Rules ---
  async getAdvisoryRules(): Promise<any[]> {
    return this.request<any[]>('/advisory/rules');
  }

  // --- Peer Benchmarks ---
  async getShowcaseFields(): Promise<any[]> {
    return this.request<any[]>('/showcase/');
  }
}

export const api = new ApiClient();

