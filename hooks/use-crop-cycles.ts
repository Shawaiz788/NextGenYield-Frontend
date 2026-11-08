import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  CycleResponseDTO,
  StartCycleDTO,
  FertilizerScheduleDTO,
  IrrigationScheduleDTO,
  getAuthToken,
} from '@/services/api-client';
import { logger } from '@/services/logger';
import { FIELD_QUERY_KEYS } from './use-fields';

export const CYCLE_QUERY_KEYS = {
  detail: (id: string) => ['cropCycle', id] as const,
  activeByField: (fieldId: string) => ['activeCropCycle', fieldId] as const,
};

/**
 * TanStack Query Hook: Fetch active crop cycle for a field
 */
export function useActiveCropCycleQuery(fieldId: string | null | undefined) {
  const token = getAuthToken();
  const isValid = !!fieldId && !fieldId.startsWith('field_0');

  return useQuery<CycleResponseDTO | null, Error>({
    queryKey: CYCLE_QUERY_KEYS.activeByField(fieldId || ''),
    queryFn: async () => {
      if (!isValid) return null;
      logger.debug('Fetching active crop cycle for field:', fieldId);
      return await api.getActiveCropCycle(fieldId!);
    },
    enabled: isValid && !!token,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: 1,
  });
}

/**
 * TanStack Query Hook: Fetch crop cycle details by cycle_id
 */
export function useCropCycleQuery(cycleId: string | null | undefined) {
  const token = getAuthToken();

  return useQuery<CycleResponseDTO, Error>({
    queryKey: CYCLE_QUERY_KEYS.detail(cycleId || ''),
    queryFn: async () => {
      if (!cycleId) throw new Error('Cycle ID is required');
      logger.debug('Fetching crop cycle details:', cycleId);
      return await api.getCropCycle(cycleId);
    },
    enabled: !!cycleId && !!token,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
}

/**
 * TanStack Mutation Hook: Start a new crop cycle on a field
 */
export function useStartCropCycleMutation() {
  const queryClient = useQueryClient();

  return useMutation<CycleResponseDTO, Error, StartCycleDTO>({
    mutationFn: async (params) => {
      logger.info('Starting crop cycle for field:', params.field_id, 'variety:', params.wheat_variety);
      return await api.startCropCycle(params);
    },
    onSuccess: (newCycle) => {
      logger.info('Crop cycle started successfully:', newCycle.cycle_id);
      queryClient.invalidateQueries({ queryKey: CYCLE_QUERY_KEYS.activeByField(newCycle.field_id) });
      queryClient.invalidateQueries({ queryKey: CYCLE_QUERY_KEYS.detail(newCycle.cycle_id) });
      queryClient.invalidateQueries({ queryKey: FIELD_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: FIELD_QUERY_KEYS.detail(newCycle.field_id) });
    },
    onError: (err) => {
      logger.warn('Failed to start crop cycle:', err.message);
    },
  });
}

/**
 * TanStack Mutation Hook: Apply fertilizer split
 */
export function useApplyFertilizerMutation(fieldId?: string, cycleId?: string) {
  const queryClient = useQueryClient();

  return useMutation<FertilizerScheduleDTO, Error, number>({
    mutationFn: async (scheduleId) => {
      logger.info('Marking fertilizer applied for schedule:', scheduleId);
      return await api.applyFertilizer(scheduleId);
    },
    onSuccess: (updated) => {
      logger.info('Fertilizer schedule updated:', updated.schedule_id);
      if (cycleId) {
        queryClient.invalidateQueries({ queryKey: CYCLE_QUERY_KEYS.detail(cycleId) });
      }
      if (fieldId) {
        queryClient.invalidateQueries({ queryKey: CYCLE_QUERY_KEYS.activeByField(fieldId) });
      }
    },
    onError: (err) => {
      logger.warn('Failed to apply fertilizer:', err.message);
    },
  });
}

/**
 * TanStack Mutation Hook: Complete irrigation milestone
 */
export function useCompleteIrrigationMutation(fieldId?: string, cycleId?: string) {
  const queryClient = useQueryClient();

  return useMutation<IrrigationScheduleDTO, Error, number>({
    mutationFn: async (scheduleId) => {
      logger.info('Marking irrigation completed for schedule:', scheduleId);
      return await api.completeIrrigation(scheduleId);
    },
    onSuccess: (updated) => {
      logger.info('Irrigation schedule updated:', updated.schedule_id);
      if (cycleId) {
        queryClient.invalidateQueries({ queryKey: CYCLE_QUERY_KEYS.detail(cycleId) });
      }
      if (fieldId) {
        queryClient.invalidateQueries({ queryKey: CYCLE_QUERY_KEYS.activeByField(fieldId) });
      }
    },
    onError: (err) => {
      logger.warn('Failed to complete irrigation:', err.message);
    },
  });
}

