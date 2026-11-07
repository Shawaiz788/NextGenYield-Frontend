import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ShowcasePostDTO, ShowcaseCreateDTO } from '@/services/api-client';
import { logger } from '@/services/logger';

export const SHOWCASE_QUERY_KEYS = {
  all: ['showcasePosts'] as const,
  detail: (id: string) => ['showcasePost', id] as const,
};

/**
 * TanStack Query Hook: Fetch peer showcase community plots and benchmarks
 */
export function useShowcasePostsQuery() {
  return useQuery<ShowcasePostDTO[], Error>({
    queryKey: SHOWCASE_QUERY_KEYS.all,
    queryFn: async () => {
      logger.debug('Fetching peer showcase posts');
      return await api.getShowcasePosts();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}

/**
 * TanStack Query Hook: Fetch single showcase post by ID
 */
export function useShowcasePostQuery(showcaseId: string | null | undefined) {
  return useQuery<ShowcasePostDTO, Error>({
    queryKey: SHOWCASE_QUERY_KEYS.detail(showcaseId || ''),
    queryFn: async () => {
      if (!showcaseId) throw new Error('Showcase ID is required');
      logger.debug('Fetching showcase post:', showcaseId);
      return await api.getShowcasePost(showcaseId);
    },
    enabled: !!showcaseId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * TanStack Mutation Hook: Submit high-yielding field plot to community showcase
 */
export function useSubmitShowcaseMutation() {
  const queryClient = useQueryClient();

  return useMutation<ShowcasePostDTO, Error, ShowcaseCreateDTO>({
    mutationFn: async (newPost) => {
      logger.info('Submitting peer showcase post:', newPost.title);
      return await api.submitShowcase(newPost);
    },
    onSuccess: (savedPost) => {
      logger.info('Showcase post submitted successfully:', savedPost.showcase_id);
      queryClient.invalidateQueries({ queryKey: SHOWCASE_QUERY_KEYS.all });
    },
    onError: (err) => {
      logger.warn('Failed to submit showcase post:', err.message);
    },
  });
}
