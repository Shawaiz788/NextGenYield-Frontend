import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  CommunityPostDTO,
  PostCreateDTO,
  PostCommentDTO,
  UserConnectionDTO,
  ChatConversationDTO,
  ChatMessageDTO,
} from '@/services/api-client';
import { logger } from '@/services/logger';

export const COMMUNITY_QUERY_KEYS = {
  posts: (category?: string) => ['community_posts', category || 'all'] as const,
  comments: (postId: string) => ['post_comments', postId] as const,
  farmers: ['farmers_network'] as const,
  conversations: ['chat_conversations'] as const,
  messages: (convId: string) => ['chat_messages', convId] as const,
};

export function useCommunityPostsQuery(category?: string) {
  return useQuery<CommunityPostDTO[], Error>({
    queryKey: COMMUNITY_QUERY_KEYS.posts(category),
    queryFn: async () => {
      logger.debug('Fetching community posts, category:', category);
      return await api.getCommunityPosts(category);
    },
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function useCreatePostMutation() {
  const queryClient = useQueryClient();
  return useMutation<CommunityPostDTO, Error, PostCreateDTO>({
    mutationFn: async (dto) => {
      logger.info('Creating community post:', dto.title);
      return await api.createCommunityPost(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_posts'] });
    },
  });
}

export function useToggleLikeMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ post_id: string; liked: boolean; likes_count: number }, Error, string>({
    mutationFn: async (postId) => {
      return await api.togglePostLike(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_posts'] });
    },
  });
}

export function usePostCommentsQuery(postId: string) {
  return useQuery<PostCommentDTO[], Error>({
    queryKey: COMMUNITY_QUERY_KEYS.comments(postId),
    queryFn: async () => {
      return await api.getPostComments(postId);
    },
    enabled: !!postId,
    staleTime: 1000 * 60,
  });
}

export function useAddCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation<PostCommentDTO, Error, { postId: string; content: string }>({
    mutationFn: async ({ postId, content }) => {
      return await api.addPostComment(postId, content);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.comments(vars.postId) });
      queryClient.invalidateQueries({ queryKey: ['community_posts'] });
    },
  });
}

export function useFarmerConnectionsQuery() {
  return useQuery<UserConnectionDTO[], Error>({
    queryKey: COMMUNITY_QUERY_KEYS.farmers,
    queryFn: async () => {
      return await api.getFarmers();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useConnectFarmerMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ status: string; connection_id: string }, Error, string>({
    mutationFn: async (targetUserId) => {
      return await api.connectWithFarmer(targetUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.farmers });
    },
  });
}

export function useConversationsQuery() {
  return useQuery<ChatConversationDTO[], Error>({
    queryKey: COMMUNITY_QUERY_KEYS.conversations,
    queryFn: async () => {
      return await api.getConversations();
    },
    refetchInterval: 1000 * 15, // poll active chats every 15s
    staleTime: 1000 * 10,
  });
}

export function useConversationMessagesQuery(conversationId: string | null | undefined) {
  return useQuery<ChatMessageDTO[], Error>({
    queryKey: COMMUNITY_QUERY_KEYS.messages(conversationId || ''),
    queryFn: async () => {
      if (!conversationId) return [];
      return await api.getConversationMessages(conversationId);
    },
    enabled: !!conversationId,
    refetchInterval: 1000 * 5, // live updates every 5s while chatting
  });
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation<ChatMessageDTO, Error, { conversationId: string; content: string }>({
    mutationFn: async ({ conversationId, content }) => {
      return await api.sendMessage(conversationId, content);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.messages(vars.conversationId) });
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.conversations });
    },
  });
}

export function useStartConversationMutation() {
  const queryClient = useQueryClient();
  return useMutation<ChatConversationDTO, Error, { recipientId: string; content: string }>({
    mutationFn: async ({ recipientId, content }) => {
      return await api.startOrGetConversation(recipientId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_QUERY_KEYS.conversations });
    },
  });
}
