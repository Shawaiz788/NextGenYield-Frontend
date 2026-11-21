import { Alert, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, FieldResponseDTO, FieldCreateDTO, FieldUpdateDTO, getAuthToken } from '@/services/api-client';
import { logger } from '@/services/logger';

export const FIELD_QUERY_KEYS = {
  all: ['fields'] as const,
  detail: (id: string) => ['field', id] as const,
};

/**
 * TanStack Query Hook: Fetch farm parcels (supports including community neighbor plots)
 */
export function useFieldsQuery(includeCommunity: boolean = true, authEnabled: boolean = true) {
  const token = getAuthToken();

  return useQuery<FieldResponseDTO[], Error>({
    queryKey: [...FIELD_QUERY_KEYS.all, token || 'unauthenticated', includeCommunity] as const,
    queryFn: async () => {
      logger.debug('Fetching farmer fields from backend, includeCommunity:', includeCommunity);
      return await api.getFields(includeCommunity);
    },
    enabled: !!token && token.trim() !== '' && authEnabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days persistent cache
    retry: 1,
  });
}

/**
 * TanStack Query Hook: Fetch single field by ID
 */
export function useFieldQuery(fieldId: string | null | undefined) {
  const token = getAuthToken();
  const isValid = !!fieldId && !fieldId.startsWith('field_0');

  return useQuery<FieldResponseDTO, Error>({
    queryKey: FIELD_QUERY_KEYS.detail(fieldId || ''),
    queryFn: async () => {
      if (!isValid) throw new Error('Field ID is required');
      return await api.getField(fieldId!);
    },
    enabled: isValid && !!token,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60 * 24 * 7,
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

/**
 * Prompts the user to confirm permanent deletion of a field across Native and Web.
 */
export function confirmFieldDeletion(
  fieldName: string,
  isUrdu: boolean,
  onConfirm: () => void
) {
  const title = isUrdu ? 'کھیت حذف کریں؟' : 'Delete Field?';
  const message = isUrdu
    ? `کیا آپ واقعی "${fieldName}" اور اس کا تمام فصل و مشاہداتی ریکارڈ ہمیشہ کے لیے حذف کرنا چاہتے ہیں؟`
    : `Are you sure you want to permanently delete "${fieldName}" along with its crop cycles and observations?`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: isUrdu ? 'منسوخ' : 'Cancel', style: 'cancel' },
    {
      text: isUrdu ? 'حذف کریں' : 'Delete',
      style: 'destructive',
      onPress: onConfirm,
    },
  ]);
}

