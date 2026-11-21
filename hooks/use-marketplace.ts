import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  MarketplaceItemDTO,
  MarketplaceItemCreateDTO,
} from '@/services/api-client';
import { logger } from '@/services/logger';

export const MARKETPLACE_QUERY_KEYS = {
  items: (params?: any) => ['marketplace_items', params] as const,
  mine: ['my_marketplace_items'] as const,
};

export function useMarketplaceItemsQuery(params?: {
  category?: string;
  district?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
}) {
  return useQuery<MarketplaceItemDTO[], Error>({
    queryKey: MARKETPLACE_QUERY_KEYS.items(params),
    queryFn: async () => {
      logger.debug('Fetching marketplace items:', params);
      return await api.getMarketplaceItems(params);
    },
    staleTime: 1000 * 60 * 3,
    retry: 1,
  });
}

export function useMyMarketplaceItemsQuery() {
  return useQuery<MarketplaceItemDTO[], Error>({
    queryKey: MARKETPLACE_QUERY_KEYS.mine,
    queryFn: async () => {
      return await api.getMyMarketplaceItems();
    },
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateMarketplaceItemMutation() {
  const queryClient = useQueryClient();
  return useMutation<MarketplaceItemDTO, Error, MarketplaceItemCreateDTO>({
    mutationFn: async (dto) => {
      logger.info('Posting marketplace item:', dto.title);
      return await api.createMarketplaceItem(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace_items'] });
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.mine });
    },
  });
}

export function useToggleItemSoldMutation() {
  const queryClient = useQueryClient();
  return useMutation<MarketplaceItemDTO, Error, string>({
    mutationFn: async (itemId) => {
      return await api.toggleMarketplaceItemSold(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace_items'] });
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.mine });
    },
  });
}

export function useDeleteMarketplaceItemMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (itemId) => {
      return await api.deleteMarketplaceItem(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace_items'] });
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.mine });
    },
  });
}
