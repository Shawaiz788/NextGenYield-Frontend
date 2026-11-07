import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ObservationResponseDTO, UploadObservationParams } from '@/services/api-client';
import { logger } from '@/services/logger';

export const OBSERVATION_QUERY_KEYS = {
  byCycle: (cycleId: string) => ['observations', cycleId] as const,
};

/**
 * TanStack Query Hook: Fetch timeline of canopy observations for a cycle
 */
export function useObservationsQuery(cycleId: string | null | undefined) {
  return useQuery<ObservationResponseDTO[], Error>({
    queryKey: OBSERVATION_QUERY_KEYS.byCycle(cycleId || ''),
    queryFn: async () => {
      if (!cycleId) return [];
      logger.debug('Fetching canopy observations for cycle:', cycleId);
      return await api.getObservations(cycleId);
    },
    enabled: !!cycleId,
    staleTime: 1000 * 30, // 30 seconds
    retry: 1,
  });
}

/**
 * TanStack Mutation Hook: Upload canopy scan observation to Supabase Storage and DB
 */
export function useUploadObservationMutation() {
  const queryClient = useQueryClient();

  return useMutation<ObservationResponseDTO, Error, UploadObservationParams>({
    mutationFn: async (params) => {
      logger.info('Uploading canopy observation for cycle:', params.cycleId, 'stage:', params.stageName);
      return await api.uploadObservation(params);
    },
    onSuccess: (savedObs) => {
      logger.info('Observation uploaded successfully:', savedObs.observation_id);
      queryClient.invalidateQueries({ queryKey: OBSERVATION_QUERY_KEYS.byCycle(savedObs.cycle_id) });
    },
    onError: (err) => {
      logger.warn('Failed to upload observation:', err.message);
    },
  });
}
