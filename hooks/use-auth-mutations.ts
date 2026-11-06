import { useMutation } from '@tanstack/react-query';
import { api, AuthResponseDTO } from '@/services/api-client';
import { logger } from '@/services/logger';

export interface LoginParams {
  phoneNumber: string;
  pinOrPass: string;
}

export interface RegisterParams {
  fullName: string;
  phoneNumber: string;
  password: string;
  district?: string;
  role?: string;
  languagePref?: string;
}

/**
 * TanStack Mutation Hook: Farmer / User Login
 */
export function useLoginMutation() {
  return useMutation<AuthResponseDTO, Error, LoginParams>({
    mutationFn: async ({ phoneNumber, pinOrPass }) => {
      logger.info('TanStack useLoginMutation triggered for:', phoneNumber);
      return await api.login(phoneNumber, pinOrPass);
    },
    onError: (error) => {
      logger.warn('Login mutation notice:', error.message);
    },
    onSuccess: (data) => {
      logger.info('Login mutation succeeded for user:', data.user.full_name);
    },
  });
}

/**
 * TanStack Mutation Hook: Farmer / User Registration
 */
export function useRegisterMutation() {
  return useMutation<AuthResponseDTO, Error, RegisterParams>({
    mutationFn: async (params) => {
      logger.info('TanStack useRegisterMutation triggered for:', params.phoneNumber);
      return await api.register(params);
    },
    onError: (error) => {
      logger.warn('Register mutation notice:', error.message);
    },
    onSuccess: (data) => {
      logger.info('Register mutation succeeded for user:', data.user.full_name);
    },
  });
}

