import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  MachineryListingDTO,
  MachineryListingCreateDTO,
  MachineryBookingDTO,
  MachineryBookingCreateDTO,
  MachineryScheduleDTO,
} from '@/services/api-client';
import { logger } from '@/services/logger';

export const MACHINERY_QUERY_KEYS = {
  all: ['machinery_listings'] as const,
  mine: ['my_machinery_listings'] as const,
  myBookings: ['my_machinery_bookings'] as const,
  schedule: (id: string, month?: string) => ['machinery_schedule', id, month || 'current'] as const,
};

export function useMachineryListingsQuery(params?: { machinery_type?: string; district?: string }) {
  return useQuery<MachineryListingDTO[], Error>({
    queryKey: [...MACHINERY_QUERY_KEYS.all, params?.machinery_type || 'all', params?.district || 'all'] as const,
    queryFn: async () => {
      logger.debug('Fetching machinery listings:', params);
      return await api.getMachineryListings(params);
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useMyMachineryListingsQuery() {
  return useQuery<MachineryListingDTO[], Error>({
    queryKey: MACHINERY_QUERY_KEYS.mine,
    queryFn: async () => {
      return await api.getMyMachineryListings();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useMyMachineryBookingsQuery() {
  return useQuery<MachineryBookingDTO[], Error>({
    queryKey: MACHINERY_QUERY_KEYS.myBookings,
    queryFn: async () => {
      return await api.getMyMachineryBookings();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useMachineryScheduleQuery(machineryId?: string | null, month?: string) {
  return useQuery<MachineryScheduleDTO, Error>({
    queryKey: machineryId ? MACHINERY_QUERY_KEYS.schedule(machineryId, month) : ['machinery_schedule', 'none'],
    queryFn: async () => {
      if (!machineryId) throw new Error('Machinery ID required');
      return await api.getMachinerySchedule(machineryId, month);
    },
    enabled: !!machineryId,
    staleTime: 1000 * 30,
  });
}

export function useCreateMachineryMutation() {
  const queryClient = useQueryClient();
  return useMutation<MachineryListingDTO, Error, MachineryListingCreateDTO>({
    mutationFn: async (dto) => {
      logger.info('Creating machinery listing:', dto.title);
      return await api.createMachineryListing(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.mine });
    },
  });
}

export function useBookMachineryMutation() {
  const queryClient = useQueryClient();
  return useMutation<MachineryBookingDTO, Error, { machineryId: string; data: MachineryBookingCreateDTO }>({
    mutationFn: async ({ machineryId, data }) => {
      logger.info('Booking machinery slot:', machineryId, data);
      return await api.bookMachinerySlot(machineryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.myBookings });
      queryClient.invalidateQueries({ queryKey: ['machinery_schedule'] });
    },
  });
}
