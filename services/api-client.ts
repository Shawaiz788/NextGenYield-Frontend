import { Platform } from 'react-native';
import { logger } from './logger';
import { sessionStore } from './session-store';

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
  owner_id?: string;
  owner_name?: string;
  owner_district?: string;
  is_mine?: boolean;
  field_name: string;
  shape_type: string;
  area_acres: number;
  area_sqm: number;
  boundary_geojson: any;
  center_latitude: number;
  center_longitude: number;
  soil_texture?: string;
  current_cycle_id?: string | null;
  wheat_variety?: string | null;
  seed_company?: string | null;
  fertilizer_company?: string | null;
  sowing_date?: string | null;
  target_harvest_date?: string | null;
  cycle_status?: 'active' | 'not_started' | 'completed';
  current_stage_index?: number;
  days_after_sowing?: number | null;
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
  rule_id: string | number;
  stage_index: number;
  stage_name: string;
  summary_text_en?: string;
  summary_text_ur?: string;
  irrigation_advice_en?: string;
  irrigation_advice_ur?: string;
  nutrient_advice_en?: string;
  nutrient_advice_ur?: string;
  risk_alerts?: Array<{ type?: string; title: string; desc: string } | string>;
  audio_script_ur?: string;
  primary_action?: string;
  primary_action_ur?: string;
  secondary_advice?: string;
  secondary_advice_ur?: string;
  critical_nutrient?: string;
  water_recommendation?: string;
  weed_management?: string;
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
// Machinery DTOs
// ==========================================
export interface MachineryBookingDTO {
  booking_id: string;
  machinery_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_hours?: number | null;
  total_amount_pkr: number;
  status: string;
  purpose_step?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface MachineryListingDTO {
  machinery_id: string;
  owner_id: string;
  title: string;
  machinery_type: string;
  brand_model?: string | null;
  horsepower?: number | null;
  hourly_rate_pkr?: number | null;
  daily_rate_pkr: number;
  district: string;
  location_address?: string | null;
  contact_phone: string;
  description?: string | null;
  image_url?: string | null;
  is_available: boolean;
  created_at: string;
  bookings?: MachineryBookingDTO[];
}

export interface MachineryListingCreateDTO {
  title: string;
  machinery_type: string;
  brand_model?: string;
  horsepower?: number;
  hourly_rate_pkr?: number;
  daily_rate_pkr: number;
  district: string;
  location_address?: string;
  contact_phone: string;
  description?: string;
  image_url?: string;
}

export interface MachineryBookingCreateDTO {
  start_date: string;
  end_date: string;
  total_hours?: number;
  purpose_step?: string;
  notes?: string;
}

export interface MachineryDailySlotDTO {
  slot_id: string;
  label_en: string;
  label_ur: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  is_available: boolean;
  price_pkr: number;
}

export interface MachineryDayAvailabilityDTO {
  date: string;
  day_status: 'available' | 'fully_booked' | 'past';
  is_fully_booked: boolean;
  slots: MachineryDailySlotDTO[];
}

export interface MachineryScheduleDTO {
  machinery_id: string;
  month: string;
  days: MachineryDayAvailabilityDTO[];
}

// ==========================================
// Employee / Farm Team DTOs
// ==========================================
export interface FieldAssignmentDTO {
  assignment_id: string;
  employee_record_id: string;
  field_id: string;
  field_name?: string | null;
  can_scan: boolean;
  can_edit_schedule: boolean;
  assigned_at: string;
}

export interface FarmEmployeeDTO {
  employee_record_id: string;
  owner_id: string;
  employee_user_id?: string | null;
  employee_name: string;
  employee_phone: string;
  role: string;
  status: string;
  access_all_fields: boolean;
  created_at: string;
  assigned_fields?: FieldAssignmentDTO[];
}

export interface EmployeeCreateDTO {
  employee_name: string;
  employee_phone: string;
  role: string;
  access_all_fields?: boolean;
  assigned_field_ids?: string[];
}

export interface AssignFieldsDTO {
  field_ids: string[];
  access_all_fields?: boolean;
}

// ==========================================
// Community & Chat DTOs
// ==========================================
export interface CommunityPostDTO {
  post_id: string;
  user_id: string;
  author_name: string;
  author_district: string;
  category: string;
  title: string;
  content: string;
  image_url?: string | null;
  likes_count: number;
  comments_count: number;
  is_liked_by_me?: boolean;
  created_at: string;
}

export interface PostCreateDTO {
  title: string;
  category: string;
  content: string;
  image_url?: string;
}

export interface PostCommentDTO {
  comment_id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface UserConnectionDTO {
  connection_id: string;
  user_id: string;
  full_name: string;
  district: string;
  role: string;
  status: string;
  created_at: string;
}

export interface MachinerySummaryDTO {
  machinery_id: string;
  title: string;
  machinery_type: string;
  daily_rate_pkr: number;
  hourly_rate_pkr?: number;
  district: string;
  is_available: boolean;
}

export interface MarketplaceItemSummaryDTO {
  item_id: string;
  title: string;
  category: string;
  price_pkr: number;
  condition: string;
  is_sold: boolean;
  image_url?: string;
}

export interface PostSummaryDTO {
  post_id: string;
  title: string;
  category: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export interface PaginatedFarmersDTO {
  items: UserConnectionDTO[];
  total: number;
  page: number;
  total_pages: number;
  limit: number;
}

export interface PublicUserProfileDTO {
  user_id: string;
  full_name: string;
  district: string;
  role: string;
  phone_number?: string;
  total_fields: number;
  total_acreage: number;
  active_crops_count?: number;
  posts_count: number;
  machinery_count?: number;
  marketplace_count?: number;
  connection_status: 'none' | 'pending' | 'accepted' | 'self';
  connection_id?: string;
  fields?: FieldResponseDTO[];
  machinery?: MachinerySummaryDTO[];
  marketplace_items?: MarketplaceItemSummaryDTO[];
  recent_posts?: PostSummaryDTO[];
  created_at: string;
}

export interface ChatMessageDTO {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatConversationDTO {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_district?: string | null;
  last_message?: string | null;
  last_message_at: string;
  unread_count: number;
}

// ==========================================
// Marketplace DTOs
// ==========================================
export interface MarketplaceItemDTO {
  item_id: string;
  seller_id: string;
  seller_name: string;
  seller_phone: string;
  title: string;
  category: string;
  price_pkr: number;
  condition: string;
  district: string;
  location_address?: string | null;
  description: string;
  image_url?: string | null;
  is_sold: boolean;
  created_at: string;
}

export interface MarketplaceItemCreateDTO {
  title: string;
  category: string;
  price_pkr: number;
  condition?: string;
  district: string;
  location_address?: string;
  contact_phone: string;
  description: string;
  image_url?: string;
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

    if (!activeAuthToken) {
      activeAuthToken = await sessionStore.getToken();
    }

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
  async getFields(includeCommunity: boolean = false): Promise<FieldResponseDTO[]> {
    return this.request<FieldResponseDTO[]>(includeCommunity ? '/fields/?include_community=true' : '/fields/?include_community=false');
  }

  async getFarmerFields(userId: string): Promise<FieldResponseDTO[]> {
    return this.request<FieldResponseDTO[]>(`/fields/?user_id=${userId}`);
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

  // --- Machinery Rental & Booking Endpoints ---
  async getMachineryListings(params?: { machinery_type?: string; district?: string; available_only?: boolean }): Promise<MachineryListingDTO[]> {
    const query = new URLSearchParams();
    if (params?.machinery_type) query.append('machinery_type', params.machinery_type);
    if (params?.district) query.append('district', params.district);
    if (params?.available_only !== undefined) query.append('available_only', String(params.available_only));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<MachineryListingDTO[]>(`/machinery/${qs}`);
  }

  async createMachineryListing(data: MachineryListingCreateDTO): Promise<MachineryListingDTO> {
    return this.request<MachineryListingDTO>('/machinery/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyMachineryListings(): Promise<MachineryListingDTO[]> {
    return this.request<MachineryListingDTO[]>('/machinery/user/my-listings');
  }

  async bookMachinerySlot(machineryId: string, data: MachineryBookingCreateDTO): Promise<MachineryBookingDTO> {
    return this.request<MachineryBookingDTO>(`/machinery/${machineryId}/book`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMachinerySchedule(machineryId: string, month?: string): Promise<MachineryScheduleDTO> {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return this.request<MachineryScheduleDTO>(`/machinery/${machineryId}/schedule${query}`);
  }

  async getMyMachineryBookings(): Promise<MachineryBookingDTO[]> {
    return this.request<MachineryBookingDTO[]>('/machinery/user/my-bookings');
  }

  // --- Farm Employee & Delegation Endpoints ---
  async getEmployees(): Promise<FarmEmployeeDTO[]> {
    return this.request<FarmEmployeeDTO[]>('/employees/');
  }

  async addEmployee(data: EmployeeCreateDTO): Promise<FarmEmployeeDTO> {
    return this.request<FarmEmployeeDTO>('/employees/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async assignFieldsToEmployee(employeeRecordId: string, data: AssignFieldsDTO): Promise<FarmEmployeeDTO> {
    return this.request<FarmEmployeeDTO>(`/employees/${employeeRecordId}/assign-fields`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(employeeRecordId: string): Promise<void> {
    return this.request<void>(`/employees/${employeeRecordId}`, {
      method: 'DELETE',
    });
  }

  async getAssignedToMeFields(): Promise<FieldResponseDTO[]> {
    return this.request<FieldResponseDTO[]>('/employees/assigned-to-me');
  }

  // --- Community, Social Feed & Chat Endpoints ---
  async getCommunityPosts(category?: string): Promise<CommunityPostDTO[]> {
    const qs = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<CommunityPostDTO[]>(`/community/posts${qs}`);
  }

  async createCommunityPost(data: PostCreateDTO): Promise<CommunityPostDTO> {
    return this.request<CommunityPostDTO>('/community/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async togglePostLike(postId: string): Promise<{ post_id: string; liked: boolean; likes_count: number }> {
    return this.request<{ post_id: string; liked: boolean; likes_count: number }>(`/community/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async getPostComments(postId: string): Promise<PostCommentDTO[]> {
    return this.request<PostCommentDTO[]>(`/community/posts/${postId}/comments`);
  }

  async addPostComment(postId: string, content: string): Promise<PostCommentDTO> {
    return this.request<PostCommentDTO>(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getFarmers(params?: { search?: string; page?: number; limit?: number }): Promise<PaginatedFarmersDTO> {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.page) sp.append('page', params.page.toString());
    if (params?.limit) sp.append('limit', params.limit.toString());
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return this.request<PaginatedFarmersDTO>(`/community/farmers${qs}`);
  }

  async connectWithFarmer(targetUserId: string): Promise<{ status: string; connection_id: string }> {
    return this.request<{ status: string; connection_id: string }>(`/community/farmers/${targetUserId}/connect`, {
      method: 'POST',
    });
  }

  async disconnectWithFarmer(targetUserId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/community/farmers/${targetUserId}/disconnect`, {
      method: 'DELETE',
    });
  }

  async getUserProfile(userId: string): Promise<PublicUserProfileDTO> {
    return this.request<PublicUserProfileDTO>(`/community/users/${userId}/profile`);
  }

  async getConversations(): Promise<ChatConversationDTO[]> {
    return this.request<ChatConversationDTO[]>('/community/conversations');
  }

  async startOrGetConversation(recipientId: string, content: string): Promise<ChatConversationDTO> {
    return this.request<ChatConversationDTO>('/community/conversations/start', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: recipientId, content }),
    });
  }

  async getConversationMessages(conversationId: string): Promise<ChatMessageDTO[]> {
    return this.request<ChatMessageDTO[]>(`/community/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId: string, content: string): Promise<ChatMessageDTO> {
    return this.request<ChatMessageDTO>(`/community/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // --- Agricultural Marketplace Endpoints ---
  async getMarketplaceItems(params?: {
    category?: string;
    district?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
  }): Promise<MarketplaceItemDTO[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.district) query.append('district', params.district);
    if (params?.search) query.append('search', params.search);
    if (params?.min_price !== undefined) query.append('min_price', String(params.min_price));
    if (params?.max_price !== undefined) query.append('max_price', String(params.max_price));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<MarketplaceItemDTO[]>(`/marketplace/items${qs}`);
  }

  async createMarketplaceItem(data: MarketplaceItemCreateDTO): Promise<MarketplaceItemDTO> {
    return this.request<MarketplaceItemDTO>('/marketplace/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMarketplaceItem(itemId: string): Promise<MarketplaceItemDTO> {
    return this.request<MarketplaceItemDTO>(`/marketplace/items/${itemId}`);
  }

  async toggleMarketplaceItemSold(itemId: string): Promise<MarketplaceItemDTO> {
    return this.request<MarketplaceItemDTO>(`/marketplace/items/${itemId}/sold`, {
      method: 'PATCH',
    });
  }

  async deleteMarketplaceItem(itemId: string): Promise<void> {
    return this.request<void>(`/marketplace/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async getMyMarketplaceItems(): Promise<MarketplaceItemDTO[]> {
    return this.request<MarketplaceItemDTO[]>('/marketplace/user/my-items');
  }
    }

    export const api = new ApiClient();
    export default api;
