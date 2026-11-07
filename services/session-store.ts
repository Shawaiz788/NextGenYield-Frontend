import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { logger } from './logger';

const AUTH_TOKEN_KEY = 'nextgenyield_auth_token';
const USER_PROFILE_KEY = 'nextgenyield_user_profile';

/**
 * Universal Storage Helper:
 * Uses expo-secure-store on iOS/Android native platforms.
 * Uses window.localStorage on Web as fallback where SecureStore is unavailable.
 */
export const sessionStore = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (err: any) {
      logger.warn(`Failed to save secure item [${key}]:`, err?.message || err);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (err: any) {
      logger.warn(`Failed to read secure item [${key}]:`, err?.message || err);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (err: any) {
      logger.warn(`Failed to remove secure item [${key}]:`, err?.message || err);
    }
  },

  // Token helpers
  async saveToken(token: string): Promise<void> {
    await this.setItem(AUTH_TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return await this.getItem(AUTH_TOKEN_KEY);
  },

  async removeToken(): Promise<void> {
    await this.removeItem(AUTH_TOKEN_KEY);
  },

  // User profile helpers
  async saveUserProfile(profile: any): Promise<void> {
    await this.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  },

  async getUserProfile(): Promise<any | null> {
    const raw = await this.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  },

  async removeUserProfile(): Promise<void> {
    await this.removeItem(USER_PROFILE_KEY);
  },

  async clearSession(): Promise<void> {
    await Promise.all([this.removeToken(), this.removeUserProfile()]);
  },
};
