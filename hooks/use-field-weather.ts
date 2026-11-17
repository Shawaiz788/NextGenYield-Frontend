import { useQuery } from '@tanstack/react-query';
import { logger } from '@/services/logger';

export interface FieldWeatherData {
  temperatureC: number;
  humidityPct: number;
  windSpeedKmh: number;
  rainProbabilityPct: number;
  fiveDayMaxRainPct: number;
  weatherCode: number;
  conditionEn: string;
  conditionUr: string;
  windLabelEn: string;
  windLabelUr: string;
  emoji: string;
}

function mapWmoWeatherCode(code: number): {
  conditionEn: string;
  conditionUr: string;
  emoji: string;
} {
  if (code === 0) {
    return { conditionEn: 'Sunny', conditionUr: 'صاف دھوپ', emoji: '☀️' };
  }
  if (code >= 1 && code <= 3) {
    return { conditionEn: 'Partly Cloudy', conditionUr: 'جزوی ابر آلود', emoji: '⛅' };
  }
  if (code === 45 || code === 48) {
    return { conditionEn: 'Foggy', conditionUr: 'دھند', emoji: '🌫️' };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { conditionEn: 'Rainy', conditionUr: 'بارش', emoji: '🌧️' };
  }
  if (code >= 95 && code <= 99) {
    return { conditionEn: 'Stormy', conditionUr: 'آندھی و بارش', emoji: '⛈️' };
  }
  return { conditionEn: 'Clear', conditionUr: 'معتدل', emoji: '🌤️' };
}

function mapWindLabel(speedKmh: number): {
  windLabelEn: string;
  windLabelUr: string;
} {
  if (speedKmh < 12) {
    return { windLabelEn: 'Calm', windLabelUr: 'پرسکون' };
  }
  if (speedKmh <= 25) {
    return { windLabelEn: 'Moderate', windLabelUr: 'معتدل ہوا' };
  }
  return { windLabelEn: 'Windy', windLabelUr: 'تیز ہوا' };
}

export const WEATHER_QUERY_KEYS = {
  byCoords: (lat?: number, lng?: number) => ['field-weather', lat ?? null, lng ?? null] as const,
};

/**
 * Fetches real-time weather (temperature, humidity, wind, rain probability)
 * from Open-Meteo for the exact coordinates of the selected field.
 */
export function useFieldWeatherQuery(latitude?: number, longitude?: number) {
  const hasValidCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    (latitude !== 0 || longitude !== 0);

  return useQuery<FieldWeatherData, Error>({
    queryKey: WEATHER_QUERY_KEYS.byCoords(latitude, longitude),
    queryFn: async () => {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${latitude}` +
        `&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation_probability` +
        `&daily=precipitation_probability_max` +
        `&forecast_days=5` +
        `&timezone=auto`;

      logger.debug(`[NextGenYield:Weather] Fetching weather for (${latitude}, ${longitude})`);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Weather service returned HTTP ${res.status}`);
      }

      const json = await res.json();
      const current = json?.current;
      if (!current) {
        throw new Error('Weather response missing current telemetry');
      }

      const temperatureC = Math.round(Number(current.temperature_2m ?? 0));
      const humidityPct = Math.round(Number(current.relative_humidity_2m ?? 0));
      const windSpeedKmh = Math.round(Number(current.wind_speed_10m ?? 0));
      const weatherCode = Number(current.weather_code ?? 0);

      const dailyProbs: number[] = Array.isArray(json?.daily?.precipitation_probability_max)
        ? json.daily.precipitation_probability_max.map((n: any) => Number(n) || 0)
        : [];
      const currentRainPct =
        typeof current.precipitation_probability === 'number'
          ? Math.round(current.precipitation_probability)
          : dailyProbs[0] ?? 0;
      const fiveDayMaxRainPct =
        dailyProbs.length > 0 ? Math.round(Math.max(...dailyProbs)) : currentRainPct;

      const { conditionEn, conditionUr, emoji } = mapWmoWeatherCode(weatherCode);
      const { windLabelEn, windLabelUr } = mapWindLabel(windSpeedKmh);

      return {
        temperatureC,
        humidityPct,
        windSpeedKmh,
        rainProbabilityPct: currentRainPct,
        fiveDayMaxRainPct,
        weatherCode,
        conditionEn,
        conditionUr,
        windLabelEn,
        windLabelUr,
        emoji,
      };
    },
    enabled: hasValidCoords,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });
}
