import { useQuery } from '@tanstack/react-query';
import { api, AdvisoryRuleDTO, getAuthToken } from '@/services/api-client';
import { logger } from '@/services/logger';

export const ADVISORY_QUERY_KEYS = {
  all: ['advisoryRules'] as const,
  stage: (index: number) => ['advisoryRule', index] as const,
};

/**
 * TanStack Query Hook: Fetch all agronomic advisory rules
 */
export function useAdvisoryRulesQuery() {
  const token = getAuthToken();

  return useQuery<AdvisoryRuleDTO[], Error>({
    queryKey: ADVISORY_QUERY_KEYS.all,
    queryFn: async () => {
      logger.debug('Fetching agronomic advisory rules');
      return await api.getAdvisoryRules();
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/**
 * TanStack Query Hook: Fetch specific advisory rule for growth stage index
 */
export function useAdvisoryRuleQuery(stageIndex: number) {
  const token = getAuthToken();

  return useQuery<AdvisoryRuleDTO, Error>({
    queryKey: ADVISORY_QUERY_KEYS.stage(stageIndex),
    queryFn: async () => {
      logger.debug('Fetching advisory rule for stage index:', stageIndex);
      return await api.getAdvisoryRule(stageIndex);
    },
    enabled: stageIndex >= 0 && !!token,
    staleTime: 1000 * 60 * 5,
  });
}

