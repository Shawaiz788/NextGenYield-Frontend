import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { logger } from '@/services/logger';

export interface UserLocationState {
  locationName: string | null;
  displayText: string;
  isPermissionGranted: boolean;
  isLoading: boolean;
  coords: { latitude: number; longitude: number } | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook to dynamically determine user's current GPS location and reverse geocoded city/district.
 * If permission is not granted, displays localized fallback hint.
 */
export function useUserLocation(language: 'en' | 'ur' = 'en'): UserLocationState {
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const fetchLocation = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check current foreground permission
      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }

      if (status !== 'granted') {
        logger.info('[useUserLocation] Location permission not granted');
        setIsPermissionGranted(false);
        setLocationName(null);
        setIsLoading(false);
        return;
      }

      setIsPermissionGranted(true);

      // Get current position (balanced accuracy for battery efficiency)
      const currentPos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentPos.coords;
      setCoords({ latitude, longitude });

      // Reverse geocode to find district/city/subregion name
      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (reverse && reverse.length > 0) {
        const place = reverse[0];
        // Prefer district, subregion, city, or neighborhood name
        const detectedName =
          place.district ||
          place.subregion ||
          place.city ||
          place.name ||
          place.region ||
          (language === 'ur' ? 'موجودہ مقام' : 'Current Location');

        setLocationName(detectedName);
        logger.info(`[useUserLocation] Detected location: ${detectedName} (${latitude}, ${longitude})`);
      } else {
        setLocationName(language === 'ur' ? 'موجودہ مقام' : 'Current Location');
      }
    } catch (err: any) {
      logger.warn('[useUserLocation] Error fetching user location:', err?.message || err);
      setLocationName(null);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Compute bilingual display string for top header
  let displayText = '';
  if (isLoading && !locationName) {
    displayText = language === 'ur' ? '📍 مقام تلاش ہو رہا ہے...' : '📍 Locating...';
  } else if (!isPermissionGranted) {
    displayText =
      language === 'ur'
        ? '📍 لوکیشن کی اجازت درکار ہے'
        : '📍 Location permission not granted';
  } else if (locationName) {
    displayText = `📍 ${locationName} · 28°C ☀️`;
  } else {
    displayText =
      language === 'ur'
        ? '📍 مقام دستیاب نہیں'
        : '📍 Location unavailable';
  }

  return {
    locationName,
    displayText,
    isPermissionGranted,
    isLoading,
    coords,
    refresh: fetchLocation,
  };
}

