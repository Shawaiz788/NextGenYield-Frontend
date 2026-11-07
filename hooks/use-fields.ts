import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, FieldResponseDTO, FieldCreateDTO, FieldUpdateDTO, getAuthToken } from '@/services/api-client';
import { logger } from '@/services/logger';

export const FIELD_QUERY_KEYS = {
  all: ['fields'] as const,
  detail: (id: string) => ['field', id] as const,
};

/**
 * TanStack Query Hook: Fetch all farm parcels demarcated by the farmer
 */
export function useFieldsQuery() {
  const token = getAuthToken();

  return useQuery<FieldResponseDTO[], Error>({
    queryKey: FIELD_QUERY_KEYS.all,
    queryFn: async () => {
      logger.debug('Fetching farmer fields from backend');
      return await api.getFields();
    },
    enabled: !!token,
    staleTime: 1000 * 30, // 30 seconds
    retry: 1,
  });
}

/**
 * TanStack Query Hook: Fetch single field by ID
 */
export function useFieldQuery(fieldId: string | null | undefined) {
  const token = getAuthToken();

  return useQuery<FieldResponseDTO, Error>({
    queryKey: FIELD_QUERY_KEYS.detail(fieldId || ''),
    queryFn: async () => {
      if (!fieldId) throw new Error('Field ID is required');
      return await api.getField(fieldId);
    },
    enabled: !!fieldId && !!token,
    staleTime: 1000 * 30,
  });
}

/**
 * TanStack Mutation Hook: Create new demarcated field parcel
 */
export function useCreateFieldMutation() {
  const queryClient = useQueryClient();

  return useMutation<FieldResponseDTO, Error, FieldCreateDTO>({
    mutationFn: async (newField) => {
      logger.info('Creating field parcel:', newField.field_name);
      return await api.createField(newField);
    },
    onSuccess: (savedField) => {
      logger.info('Field created successfully:', savedField.field_id);
      queryClient.invalidateQueries({ queryKey: FIELD_QUERY_KEYS.all });
    },
    onError: (err) => {
      logger.warn('Failed to create field:', err.message);
    },
  });
}

/**
 * TanStack Mutation Hook: Update field parcel details or boundaries
 */
export function useUpdateFieldMutation() {
  const queryClient = useQueryClient();

  return useMutation<FieldResponseDTO, Error, { fieldId: string; data: FieldUpdateDTO }>({
    mutationFn: async ({ fieldId, data }) => {
      logger.info('Updating field:', fieldId);
      return await api.updateField(fieldId, data);
    },
    onSuccess: (updated) => {
      logger.info('Field updated successfully:', updated.field_id);
      queryClient.invalidateQueries({ queryKey: FIELD_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: FIELD_QUERY_KEYS.detail(updated.field_id) });
    },
    onError: (err) => {
      logger.warn('Failed to update field:', err.message);
    },
  });
}

/**
 * TanStack Mutation Hook: Delete field parcel
 */
export function useDeleteFieldMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (fieldId) => {
      logger.info('Deleting field:', fieldId);
      return await api.deleteField(fieldId);
    },
    onSuccess: (_, fieldId) => {
      logger.info('Field deleted successfully:', fieldId);
      queryClient.invalidateQueries({ queryKey: FIELD_QUERY_KEYS.all });
    },
    onError: (err) => {
      logger.warn('Failed to delete field:', err.message);
    },
  });
}

