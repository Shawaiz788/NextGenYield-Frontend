import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchServerHealth,
  predictGrowthStage,
  getDefaultBaseUrl,
  setCustomBaseUrl,
  HealthResponse,
  GrowthStagePrediction,
} from '@/services/growth-stage-api';

export function useApiServerConfig() {
  const [baseUrl, setBaseUrlState] = useState<string>(() => getDefaultBaseUrl());

  const updateBaseUrl = (url: string) => {
    const clean = url.trim().replace(/\/+$/, '');
    setCustomBaseUrl(clean);
    setBaseUrlState(clean);
  };

  return {
    baseUrl,
    setBaseUrl: updateBaseUrl,
  };
}

/**
 * TanStack Query Hook: Server Health & Hardware Telemetry
 */
export function useServerHealth(baseUrl: string) {
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const query = useQuery<HealthResponse, Error>({
    queryKey: ['serverHealth', baseUrl],
    queryFn: async () => {
      const startTime = Date.now();
      try {
        const data = await fetchServerHealth(baseUrl);
        setLatencyMs(Date.now() - startTime);
        return data;
      } catch (err: any) {
        setLatencyMs(null);
        throw err;
      }
    },
    refetchInterval: 12000, // Background poll every 12 seconds
    retry: 1,
    staleTime: 6000,
  });

  return {
    ...query,
    latencyMs,
    isOnline: query.isSuccess && query.data?.status === 'healthy',
  };
}

/**
 * TanStack Query Hook: Wheat Growth Stage Prediction Mutation
 */
export function usePredictGrowthStage(baseUrl: string) {
  const queryClient = useQueryClient();

  return useMutation<
    GrowthStagePrediction,
    Error,
    { imageUri: string; fieldId?: string; cropType?: string }
  >({
    mutationFn: async ({ imageUri, fieldId, cropType }) => {
      try {
        return await predictGrowthStage({
          imageUri,
          fieldId,
          cropType,
          baseUrl,
        });
      } catch (err: any) {
        // Helpful diagnostic message
        const msg = err?.message || `Failed to connect to AI server at ${baseUrl}`;
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      // Refresh health query on successful inference
      queryClient.invalidateQueries({ queryKey: ['serverHealth', baseUrl] });
    },
  });
}

/**
 * Growth Stage Color Coding & Details Helper
 */
export function getConfidenceBadgeColor(rating?: string, confidence?: number) {
  const norm = rating?.toLowerCase() || '';
  if (norm.includes('high') || (confidence !== undefined && confidence >= 0.8)) {
    return {
      bg: '#DCFCE7',
      border: '#10B981',
      text: '#15803D',
      label: 'High Confidence',
      badge: '#10B981',
    };
  }
  if (norm.includes('moderate') || (confidence !== undefined && confidence >= 0.6)) {
    return {
      bg: '#FEF3C7',
      border: '#F59E0B',
      text: '#B45309',
      label: 'Moderate Confidence',
      badge: '#F59E0B',
    };
  }
  return {
    bg: '#FEE2E2',
    border: '#EF4444',
    text: '#B91C1C',
    label: 'Low / Uncertain',
    badge: '#EF4444',
  };
}
