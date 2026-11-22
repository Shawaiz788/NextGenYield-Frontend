import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Colors, FontFamily, Spacing, Radius, CardStyle } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import {
  useCommunityPostsQuery,
  useCreatePostMutation,
  useToggleLikeMutation,
  usePostCommentsQuery,
  useAddCommentMutation,
  useFarmerConnectionsQuery,
  useConnectFarmerMutation,
  useConversationsQuery,
  useConversationMessagesQuery,
  useSendMessageMutation,
  useStartConversationMutation,
} from '@/hooks/use-community';
import { useQueryClient } from '@tanstack/react-query';
import { CommunityPostDTO, PublicUserProfileDTO, UserConnectionDTO, api } from '@/services/api-client';
import { SHOWCASE_QUERY_KEYS } from '@/hooks/use-showcase';
import { UserProfileModal } from '@/components/user-profile-modal';
import BestPracticeShowcaseScreen from './showcase';

const POST_CATEGORIES = [
  { key: 'all', labelEn: 'All Topics', labelUr: 'تمام موضوعات' },
  { key: 'agronomy_tips', labelEn: 'Agronomy Tips', labelUr: 'زرعی رہنمائی' },
  { key: 'disease_alert', labelEn: 'Disease Alerts', labelUr: 'بیماریوں کے انتباہ' },
  { key: 'machinery', labelEn: 'Machinery & Tools', labelUr: 'مشینری و آلات' },
  { key: 'market_prices', labelEn: 'Grain Prices', labelUr: 'مارکیٹ ریٹس' },
];

export default function CommunityScreen() {
  const params = useLocalSearchParams<{ conversationId?: string; recipientName?: string; recipientId?: string; subTab?: string }>();
  const { language, t } = useApp();
  const isUrdu = language === 'ur';

  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'network' | 'messages' | 'showcase'>('feed');

  // Prefetch Proven Yield showcase in background so switching to the tab is instantaneous
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: SHOWCASE_QUERY_KEYS.all,
      queryFn: () => api.getShowcasePosts(),
      staleTime: 1000 * 60 * 10,
    });
  }, [queryClient]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Create post modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('agronomy_tips');
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [postStatus, setPostStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  // Expanded post comments ID
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Selected User Profile Modal state
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [selectedProfileInitialData, setSelectedProfileInitialData] = useState<Partial<PublicUserProfileDTO> | undefined>(undefined);

  // Active Direct Chat state
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeChatRecipientName, setActiveChatRecipientName] = useState<string>('');
  const [activeChatRecipientUserId, setActiveChatRecipientUserId] = useState<string | null>(null);
  const [chatMessageText, setChatMessageText] = useState('');

  // Farmers Network Search & Pagination state
  const [farmerSearchQuery, setFarmerSearchQuery] = useState('');
  const [farmerPage, setFarmerPage] = useState(1);

  // Auto-open chat if navigated with route params
  useEffect(() => {
    if (params.conversationId) {
      setActiveConversationId(params.conversationId);
      if (params.recipientName) {
        setActiveChatRecipientName(params.recipientName);
      }
      if (params.recipientId) {
        setActiveChatRecipientUserId(params.recipientId);
      }
      setActiveSubTab('messages');
    } else if (params.subTab === 'messages') {
      setActiveSubTab('messages');
    } else if (params.subTab === 'showcase') {
      setActiveSubTab('showcase');
    }
  }, [params.conversationId, params.recipientName, params.recipientId, params.subTab]);

  // TanStack Queries & Mutations
  const postsQuery = useCommunityPostsQuery(selectedCategory);
  const createPostMutation = useCreatePostMutation();
  const toggleLikeMutation = useToggleLikeMutation();
  const commentsQuery = usePostCommentsQuery(expandedPostId || '');
  const addCommentMutation = useAddCommentMutation();

  const farmersQuery = useFarmerConnectionsQuery({
    search: farmerSearchQuery,
    page: farmerPage,
    limit: 6,
  });
  const connectMutation = useConnectFarmerMutation();

  // Defensive normalization of farmers data (handles both array and paginated DTO gracefully)
  const rawFarmers = farmersQuery.data;
  const isArrayFarmers = Array.isArray(rawFarmers);

  const allFarmersList: UserConnectionDTO[] = useMemo(() => {
    if (Array.isArray(rawFarmers)) {
      return rawFarmers as UserConnectionDTO[];
    }
    if (rawFarmers && Array.isArray((rawFarmers as any).items)) {
      return (rawFarmers as any).items as UserConnectionDTO[];
    }
    return [];
  }, [rawFarmers]);

  const filteredFarmers = useMemo(() => {
    if (isArrayFarmers && farmerSearchQuery.trim()) {
      const q = farmerSearchQuery.trim().toLowerCase();
      return allFarmersList.filter(
        (f) =>
          f.full_name?.toLowerCase().includes(q) ||
          f.district?.toLowerCase().includes(q) ||
          f.role?.toLowerCase().includes(q)
      );
    }
    return allFarmersList;
  }, [isArrayFarmers, allFarmersList, farmerSearchQuery]);

  const totalFarmersCount = useMemo(() => {
    if (isArrayFarmers) return filteredFarmers.length;
    if (rawFarmers && typeof (rawFarmers as any).total === 'number') {
      return (rawFarmers as any).total;
    }
    return allFarmersList.length;
  }, [rawFarmers, isArrayFarmers, filteredFarmers.length, allFarmersList.length]);

  const totalFarmerPages = useMemo(() => {
    if (isArrayFarmers) {
      return Math.max(1, Math.ceil(filteredFarmers.length / 6));
    }
    if (rawFarmers && typeof (rawFarmers as any).total_pages === 'number') {
      return Math.max(1, (rawFarmers as any).total_pages);
    }
    return 1;
  }, [rawFarmers, isArrayFarmers, filteredFarmers.length]);

  const displayFarmers = useMemo(() => {
    if (isArrayFarmers) {
      const start = (farmerPage - 1) * 6;
      return filteredFarmers.slice(start, start + 6);
    }
    return allFarmersList;
  }, [isArrayFarmers, filteredFarmers, farmerPage, allFarmersList]);

  const conversationsQuery = useConversationsQuery();
  const messagesQuery = useConversationMessagesQuery(activeConversationId);
  const sendMessageMutation = useSendMessageMutation();
  const startConversationMutation = useStartConversationMutation();

  const handleCreatePost = async () => {
    if (!newTitle.trim()) {
      Alert.alert(isUrdu ? 'عنوان درکار ہے' : 'Title Required', isUrdu ? 'پوسٹ کا عنوان درج کریں۔' : 'Please enter post title.');
      return;
    }
    if (!newContent.trim()) {
      Alert.alert(isUrdu ? 'تفصیل درکار ہے' : 'Content Required', isUrdu ? 'پوسٹ کی تفصیل درج کریں۔' : 'Please enter post description.');
      return;
    }

    setPostStatus('sending');
    try {
      await createPostMutation.mutateAsync({
        title: newTitle.trim(),
        category: newCategory,
        content: newContent.trim(),
        image_url: newImageUrl.trim() || undefined,
      });
      setPostStatus('success');
      setTimeout(() => {
        setPostStatus('idle');
        setIsCreateModalOpen(false);
        setNewTitle('');
        setNewContent('');
        setNewImageUrl('');
      }, 800);
    } catch (err: any) {
      setPostStatus('idle');
      Alert.alert(isUrdu ? 'خرابی' : 'Error', err?.message || 'Failed to publish post.');
    }
  };

  const handleSendComment = async (postId: string) => {
    if (!commentText.trim()) return;
    try {
      await addCommentMutation.mutateAsync({
        postId,
        content: commentText.trim(),
      });
      setCommentText('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit comment');
    }
  };

  const handleSendMessage = async () => {
    if (!activeConversationId || !chatMessageText.trim()) return;
    const textToSend = chatMessageText.trim();
    setChatMessageText('');
    try {
      await sendMessageMutation.mutateAsync({
        conversationId: activeConversationId,
        content: textToSend,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to send message');
    }
  };

  const handleStartChatWithUser = async (userId: string, userName: string) => {
    try {
      const conv = await startConversationMutation.mutateAsync({
        recipientId: userId,
        content: 'Hi! Let\'s connect about wheat farming.',
      });
      setActiveConversationId(conv.conversation_id);
      setActiveChatRecipientName(userName);
      setActiveChatRecipientUserId(userId);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to open chat');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>{isUrdu ? 'کسان کمیونٹی ہب' : 'Farmers Community'}</Text>
          <Text style={styles.headerSubtitle}>
            {isUrdu ? 'پنجاب کے کسان بھائیوں سے تبادلہ خیال اور رابطہ' : 'Connect, discuss, and share verified crop wisdom'}
          </Text>
        </View>

        {activeSubTab === 'feed' && (
          <TouchableOpacity
            style={styles.createPostBtn}
            onPress={() => setIsCreateModalOpen(true)}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.createPostBtnText}>{isUrdu ? 'نئی پوسٹ' : 'Post'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Sub Tabs */}
      <View style={styles.subTabsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, flexDirection: 'row' }}>
          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'feed' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('feed')}>
            <MaterialCommunityIcons
              name="newspaper-variant-outline"
              size={17}
              color={activeSubTab === 'feed' ? '#16A34A' : '#64748B'}
            />
            <Text style={[styles.subTabText, activeSubTab === 'feed' && styles.subTabTextActive]}>
              {isUrdu ? 'فیڈ' : 'Feed'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'network' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('network')}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={17}
              color={activeSubTab === 'network' ? '#16A34A' : '#64748B'}
            />
            <Text style={[styles.subTabText, activeSubTab === 'network' && styles.subTabTextActive]}>
              {isUrdu ? 'کسان' : 'Farmers'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'messages' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('messages')}>
            <MaterialCommunityIcons
              name="chat-processing-outline"
              size={17}
              color={activeSubTab === 'messages' ? '#16A34A' : '#64748B'}
            />
            <Text style={[styles.subTabText, activeSubTab === 'messages' && styles.subTabTextActive]}>
              {isUrdu ? 'پیغامات' : 'Messages'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'showcase' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('showcase')}>
            <Ionicons
              name="trophy-outline"
              size={16}
              color={activeSubTab === 'showcase' ? '#16A34A' : '#64748B'}
            />
            <Text style={[styles.subTabText, activeSubTab === 'showcase' && styles.subTabTextActive]}>
              {isUrdu ? 'پیداوار' : 'Proven Yield'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* SUB-TAB 1: FEED */}
      {activeSubTab === 'feed' && (
        <View style={{ flex: 1 }}>
          {/* Category Horizontal Filter */}
          <View style={styles.categoriesBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {POST_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                    onPress={() => setSelectedCategory(cat.key)}>
                    <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                      {isUrdu ? cat.labelUr : cat.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Posts List */}
          <ScrollView style={styles.feedScroll} contentContainerStyle={styles.feedContent}>
            {postsQuery.isLoading ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color="#16A34A" />
                <Text style={styles.loadingText}>{isUrdu ? 'پوسٹس لوڈ ہو رہی ہیں...' : 'Loading community posts...'}</Text>
              </View>
            ) : postsQuery.data?.length === 0 ? (
              <View style={styles.emptyFeedBox}>
                <MaterialCommunityIcons name="newspaper-plus" size={48} color="#94A3B8" />
                <Text style={styles.emptyFeedText}>
                  {isUrdu ? 'اس زمرے میں کوئی پوسٹ موجود نہیں۔ پہلی پوسٹ آپ کریں!' : 'No posts in this category yet. Be the first to share!'}
                </Text>
              </View>
            ) : (
              postsQuery.data?.map((post) => (
                <View key={post.post_id} style={styles.postCard}>
                  {/* Author Header */}
                  <TouchableOpacity
                    style={styles.postAuthorRow}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedProfileUserId(post.user_id);
                      setSelectedProfileInitialData({
                        full_name: post.author_name,
                        district: post.author_district,
                      });
                    }}>
                    <View style={styles.authorAvatar}>
                      <Text style={styles.avatarInitials}>{post.author_name.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.authorName}>{post.author_name}</Text>
                      <Text style={styles.authorDistrict}>📍 {post.author_district}</Text>
                    </View>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{post.category.replace('_', ' ')}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Post Title & Content */}
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postContentText}>{post.content}</Text>

                  {/* Optional Image */}
                  {post.image_url ? (
                    <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
                  ) : null}

                  {/* Actions / Engagement Bar */}
                  <View style={styles.engagementRow}>
                    <TouchableOpacity
                      style={styles.engagementBtn}
                      onPress={() => toggleLikeMutation.mutate(post.post_id)}>
                      <Ionicons
                        name={post.is_liked_by_me ? 'heart' : 'heart-outline'}
                        size={20}
                        color={post.is_liked_by_me ? '#EF4444' : '#64748B'}
                      />
                      <Text style={[styles.engagementText, post.is_liked_by_me && { color: '#EF4444' }]}>
                        {post.likes_count}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.engagementBtn}
                      onPress={() => setExpandedPostId(expandedPostId === post.post_id ? null : post.post_id)}>
                      <Ionicons name="chatbubble-outline" size={19} color="#64748B" />
                      <Text style={styles.engagementText}>{post.comments_count} {isUrdu ? 'رائے' : 'Comments'}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Accordion Comments Section */}
                  {expandedPostId === post.post_id && (
                    <View style={styles.commentsContainer}>
                      {commentsQuery.isLoading ? (
                        <ActivityIndicator size="small" color="#16A34A" />
                      ) : commentsQuery.isError ? (
                        <TouchableOpacity onPress={() => commentsQuery.refetch()} style={styles.singleComment}>
                          <Text style={[styles.commentContent, { color: '#EF4444' }]}>
                            {isUrdu ? 'تبصرے لوڈ نہیں ہو سکے۔ دوبارہ کوشش کے لیے ٹیپ کریں۔' : 'Could not load comments. Tap to retry.'}
                          </Text>
                        </TouchableOpacity>
                      ) : !commentsQuery.data || commentsQuery.data.length === 0 ? (
                        <Text style={[styles.commentContent, { color: '#64748B', fontStyle: 'italic', paddingVertical: 4 }]}>
                          {isUrdu ? 'ابھی تک کوئی تبصرہ نہیں ہے۔ پہلی رائے دیں!' : 'No comments yet. Be the first to comment!'}
                        </Text>
                      ) : (
                        commentsQuery.data.map((c) => (
                          <TouchableOpacity
                            key={c.comment_id}
                            style={styles.singleComment}
                            activeOpacity={0.7}
                            onPress={() => {
                              setSelectedProfileUserId(c.user_id);
                              setSelectedProfileInitialData({
                                full_name: c.author_name,
                              });
                            }}>
                            <Text style={styles.commentAuthor}>{c.author_name}:</Text>
                            <Text style={styles.commentContent}>{c.content}</Text>
                          </TouchableOpacity>
                        ))
                      )}

                      {/* Add comment input */}
                      <View style={styles.commentInputRow}>
                        <TextInput
                          style={styles.commentInput}
                          value={commentText}
                          onChangeText={setCommentText}
                          placeholder={isUrdu ? 'اپنی رائے لکھیں...' : 'Write a comment...'}
                          placeholderTextColor="#94A3B8"
                        />
                        <TouchableOpacity
                          style={[styles.commentSendBtn, addCommentMutation.isPending && { opacity: 0.6 }]}
                          disabled={addCommentMutation.isPending}
                          onPress={() => handleSendComment(post.post_id)}>
                          {addCommentMutation.isPending ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Ionicons name="send" size={16} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* SUB-TAB 2: FARMERS NETWORK */}
      {activeSubTab === 'network' && (
        <ScrollView style={styles.feedScroll} contentContainerStyle={styles.feedContent}>
          {/* Farmers Search Input */}
          <View style={styles.farmerSearchContainer}>
            <Ionicons name="search" size={18} color="#94A3B8" style={{ marginLeft: 10 }} />
            <TextInput
              style={styles.farmerSearchInput}
              placeholder={isUrdu ? 'کسان کا نام، ضلع یا فون نمبر تلاش کریں...' : 'Search farmers by name, district, or phone...'}
              placeholderTextColor="#94A3B8"
              value={farmerSearchQuery}
              onChangeText={(text) => {
                setFarmerSearchQuery(text);
                setFarmerPage(1);
              }}
            />
            {farmerSearchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setFarmerSearchQuery('');
                  setFarmerPage(1);
                }}
                style={{ padding: 6, marginRight: 6 }}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Results Summary Bar */}
          {totalFarmersCount > 0 && (
            <View style={styles.resultsSummaryRow}>
              <Text style={styles.resultsCountText}>
                {isUrdu
                  ? `کل ${totalFarmersCount} کسان دستیاب ہیں`
                  : `Showing ${displayFarmers.length} of ${totalFarmersCount} farmers`}
              </Text>
              <Text style={styles.resultsPageBadge}>
                {isUrdu
                  ? `صفحہ ${farmerPage} / ${totalFarmerPages}`
                  : `Page ${farmerPage} of ${totalFarmerPages}`}
              </Text>
            </View>
          )}

          {farmersQuery.isLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#16A34A" />
              <Text style={styles.loadingText}>{isUrdu ? 'کسان نیٹ ورک لوڈ ہو رہا ہے...' : 'Discovering farmers...'}</Text>
            </View>
          ) : displayFarmers.length === 0 ? (
            <View style={styles.emptyFarmersBox}>
              <MaterialCommunityIcons name="account-search-outline" size={44} color="#94A3B8" />
              <Text style={styles.emptyFarmersText}>
                {isUrdu ? 'کوئی کسان نہیں ملا۔' : `No farmers matching "${farmerSearchQuery}" found.`}
              </Text>
              {farmerSearchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.resetSearchBtn}
                  onPress={() => {
                    setFarmerSearchQuery('');
                    setFarmerPage(1);
                  }}>
                  <Text style={styles.resetSearchBtnText}>{isUrdu ? 'فلٹر ختم کریں' : 'Clear Search'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            displayFarmers.map((f) => (
              <View key={f.user_id} style={styles.farmerCard}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedProfileUserId(f.user_id);
                    setSelectedProfileInitialData({
                      full_name: f.full_name,
                      district: f.district,
                      role: f.role,
                    });
                  }}>
                  <View style={styles.farmerAvatar}>
                    <Text style={styles.avatarInitials}>{f.full_name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.farmerName}>{f.full_name}</Text>
                    <Text style={styles.farmerDistrict}>📍 {f.district} · {f.role.toUpperCase()}</Text>
                  </View>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={[styles.connectBtn, f.status === 'accepted' && styles.connectedBtn]}
                    onPress={() => connectMutation.mutate(f.user_id)}>
                    <Ionicons
                      name={f.status === 'accepted' ? 'checkmark' : 'person-add'}
                      size={14}
                      color={f.status === 'accepted' ? '#16A34A' : '#FFFFFF'}
                    />
                    <Text style={[styles.connectBtnText, f.status === 'accepted' && styles.connectedBtnText]}>
                      {f.status === 'accepted' ? (isUrdu ? 'جڑ گئے' : 'Connected') : (isUrdu ? 'رابطہ' : 'Connect')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.chatShortcutBtn}
                    onPress={() => handleStartChatWithUser(f.user_id, f.full_name)}>
                    <Ionicons name="chatbubble-ellipses" size={16} color="#0F172A" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* Pagination Controls */}
          {totalFarmerPages > 1 && (
            <View style={styles.paginationBar}>
              <TouchableOpacity
                disabled={farmerPage <= 1}
                style={[styles.pageBtn, farmerPage <= 1 && styles.pageBtnDisabled]}
                onPress={() => setFarmerPage((prev) => Math.max(1, prev - 1))}
                activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={16} color={farmerPage <= 1 ? '#CBD5E1' : '#0F172A'} />
                <Text style={[styles.pageBtnText, farmerPage <= 1 && styles.pageBtnTextDisabled]}>
                  {isUrdu ? 'پچھلا' : 'Previous'}
                </Text>
              </TouchableOpacity>

              <View style={styles.pageIndicatorPill}>
                <Text style={styles.pageIndicatorText}>
                  {isUrdu
                    ? `صفحہ ${farmerPage} از ${totalFarmerPages}`
                    : `Page ${farmerPage} of ${totalFarmerPages}`}
                </Text>
              </View>

              <TouchableOpacity
                disabled={farmerPage >= totalFarmerPages}
                style={[styles.pageBtn, farmerPage >= totalFarmerPages && styles.pageBtnDisabled]}
                onPress={() => setFarmerPage((prev) => Math.min(totalFarmerPages, prev + 1))}
                activeOpacity={0.7}>
                <Text style={[styles.pageBtnText, farmerPage >= totalFarmerPages && styles.pageBtnTextDisabled]}>
                  {isUrdu ? 'اگلا' : 'Next'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={farmerPage >= totalFarmerPages ? '#CBD5E1' : '#0F172A'} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* SUB-TAB 3: DIRECT MESSAGES */}
      {activeSubTab === 'messages' && (
        <ScrollView style={styles.feedScroll} contentContainerStyle={styles.feedContent}>
          {conversationsQuery.isLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#16A34A" />
            </View>
          ) : conversationsQuery.data?.length === 0 ? (
            <View style={styles.emptyFeedBox}>
              <MaterialCommunityIcons name="chat-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyFeedText}>
                {isUrdu ? 'ابھی کوئی بات چیت شروع نہیں ہوئی۔ کسانوں سے رابطہ کریں!' : 'No messages yet. Connect with a farmer or inquiry from Marketplace!'}
              </Text>
            </View>
          ) : (
            conversationsQuery.data?.map((c) => (
              <TouchableOpacity
                key={c.conversation_id}
                style={styles.conversationItem}
                onPress={() => {
                  setActiveConversationId(c.conversation_id);
                  setActiveChatRecipientName(c.other_user_name);
                  setActiveChatRecipientUserId(c.other_user_id);
                }}>
                <View style={styles.authorAvatar}>
                  <Text style={styles.avatarInitials}>{c.other_user_name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.convName}>{c.other_user_name}</Text>
                    {c.unread_count > 0 ? (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{c.unread_count}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.convLastMessage} numberOfLines={1}>
                    {c.last_message || (isUrdu ? 'کوئی نیا پیغام نہیں' : 'Active conversation')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* SUB-TAB 4: PROVEN YIELD SHOWCASE */}
      {activeSubTab === 'showcase' && (
        <View style={{ flex: 1 }}>
          <BestPracticeShowcaseScreen embedded />
        </View>
      )}

      {/* Active Chat Conversation Modal */}
      <Modal
        visible={!!activeConversationId}
        animationType="slide"
        transparent={false}
        statusBarTranslucent
        onRequestClose={() => setActiveConversationId(null)}>
        <SafeAreaView style={styles.chatModalContainer} edges={['top', 'bottom']}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setActiveConversationId(null)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chatHeaderProfileTouch}
              activeOpacity={0.7}
              onPress={() => {
                const targetId =
                  activeChatRecipientUserId ||
                  conversationsQuery.data?.find((c) => c.conversation_id === activeConversationId)?.other_user_id;
                if (targetId) {
                  setSelectedProfileUserId(targetId);
                  setSelectedProfileInitialData({
                    full_name: activeChatRecipientName,
                  });
                }
              }}>
              <View style={styles.chatHeaderAvatar}>
                <Text style={styles.avatarInitials}>{activeChatRecipientName.charAt(0) || 'F'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={styles.chatHeaderName}>{activeChatRecipientName}</Text>
                  <Ionicons name="information-circle-outline" size={16} color="#16A34A" />
                </View>
                <Text style={styles.chatHeaderStatus}>
                  {isUrdu ? 'آن لائن · پروفائل دیکھنے کے لیے دبائیں' : 'Online · Tap to view profile'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Messages Bubble History */}
          <ScrollView style={styles.chatMessagesScroll} contentContainerStyle={styles.chatMessagesContent}>
            {messagesQuery.isLoading ? (
              <ActivityIndicator size="small" color="#16A34A" />
            ) : (
              messagesQuery.data?.map((msg) => {
                const isMe = msg.sender_name !== activeChatRecipientName;
                return (
                  <View
                    key={msg.message_id}
                    style={[styles.messageBubbleWrap, isMe ? styles.myBubbleWrap : styles.otherBubbleWrap]}>
                    <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
                      <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                        {msg.content}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Chat Input Bar */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
            <View style={styles.chatInputBar}>
              <TextInput
                style={styles.chatInput}
                value={chatMessageText}
                onChangeText={setChatMessageText}
                placeholder={isUrdu ? 'پیغام لکھیں...' : 'Type a message...'}
              />
              <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendMessage}>
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Create New Post Modal */}
      <Modal visible={isCreateModalOpen} animationType="slide" transparent={false} statusBarTranslucent onRequestClose={() => setIsCreateModalOpen(false)}>
        <SafeAreaView style={styles.modalFullContainer} edges={['top', 'bottom']}>
          <View style={styles.topHeader}>
            <TouchableOpacity onPress={() => setIsCreateModalOpen(false)} style={styles.backBtn}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isUrdu ? 'نئی کمیونٹی پوسٹ' : 'Create Community Post'}</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView style={styles.feedScroll} contentContainerStyle={styles.feedContent}>
            <Text style={styles.inputLabel}>{isUrdu ? 'پوسٹ کا عنوان *' : 'Post Title *'}</Text>
            <TextInput
              style={styles.formInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Sowing date experience in Faisalabad"
            />

            <Text style={styles.inputLabel}>{isUrdu ? 'موضوع منتخب کریں' : 'Category'}</Text>
            <View style={styles.typeSelectorRow}>
              {POST_CATEGORIES.filter((c) => c.key !== 'all').map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.typeOptionPill, newCategory === cat.key && styles.typeOptionPillActive]}
                  onPress={() => setNewCategory(cat.key)}>
                  <Text style={[styles.typeOptionText, newCategory === cat.key && styles.typeOptionTextActive]}>
                    {isUrdu ? cat.labelUr : cat.labelEn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>{isUrdu ? 'تفصیل اور پیغام *' : 'Description / Advice *'}</Text>
            <TextInput
              style={[styles.formInput, { height: 120, textAlignVertical: 'top' }]}
              multiline
              value={newContent}
              onChangeText={setNewContent}
              placeholder={isUrdu ? 'اپنا زرعی تجربہ یا سوال تفصیل سے لکھیں...' : 'Share your agronomic observations, questions, or crop tips...'}
            />

            <Text style={styles.inputLabel}>{isUrdu ? 'تصویر کا لنک (اختیاری)' : 'Image URL (Optional)'}</Text>
            <TextInput
              style={styles.formInput}
              value={newImageUrl}
              onChangeText={setNewImageUrl}
              placeholder="https://..."
            />

            <TouchableOpacity
              style={[styles.submitPostBtn, postStatus === 'sending' && { opacity: 0.7 }]}
              disabled={postStatus === 'sending'}
              onPress={handleCreatePost}>
              {postStatus === 'sending' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                  <Text style={styles.submitPostBtnText}>
                    {isUrdu ? 'کمیونٹی میں شائع کریں' : 'Publish to Farmers Hub'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Public Farmer Profile Modal */}
      <UserProfileModal
        visible={!!selectedProfileUserId}
        userId={selectedProfileUserId}
        initialData={selectedProfileInitialData}
        onClose={() => {
          setSelectedProfileUserId(null);
          setSelectedProfileInitialData(undefined);
        }}
        onStartChat={(uid, uname) => handleStartChatWithUser(uid, uname)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalFullContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    marginTop: 2,
  },
  createPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  createPostBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  subTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  subTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabItemActive: {
    borderBottomColor: '#16A34A',
  },
  subTabText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  subTabTextActive: {
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  categoriesBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  categoryPillText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semiBold,
  },
  feedScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  feedContent: {
    padding: 16,
    paddingBottom: 40,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...CardStyle,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#16A34A20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  authorName: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  authorDistrict: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
  },
  categoryBadge: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.semiBold,
    color: '#16A34A',
  },
  postTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    marginBottom: 6,
  },
  postContentText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
    color: '#334155',
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginTop: 10,
  },
  engagementRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  engagementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engagementText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  commentsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  singleComment: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  commentAuthor: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  commentContent: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#334155',
    marginTop: 2,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  commentSendBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...CardStyle,
  },
  farmerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F620',
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerName: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  farmerDistrict: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  connectedBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },
  connectedBtnText: {
    color: '#16A34A',
  },
  chatShortcutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...CardStyle,
  },
  convName: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  convLastMessage: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    marginTop: 3,
  },
  unreadBadge: {
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },
  chatModalContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 4,
  },
  chatHeaderProfileTouch: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  chatHeaderStatus: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#16A34A',
  },
  chatMessagesScroll: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 16,
    gap: 8,
  },
  messageBubbleWrap: {
    width: '100%',
    flexDirection: 'row',
  },
  myBubbleWrap: {
    justifyContent: 'flex-end',
  },
  otherBubbleWrap: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  myBubble: {
    backgroundColor: '#16A34A',
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FontFamily.regular,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#0F172A',
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  chatSendBtn: {
    backgroundColor: '#16A34A',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#334155',
    marginBottom: 4,
    marginTop: 10,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  typeOptionPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeOptionPillActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  typeOptionText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  submitPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  submitPostBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  centerLoading: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  emptyFeedBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyFeedText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 240,
  },
  farmerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    ...CardStyle,
  },
  farmerSearchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#0F172A',
  },
  resultsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  resultsCountText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  resultsPageBadge: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyFarmersBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginTop: 6,
  },
  emptyFarmersText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#64748B',
    textAlign: 'center',
  },
  resetSearchBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  resetSearchBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: '#0F172A',
  },
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...CardStyle,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pageBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  pageBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  pageBtnTextDisabled: {
    color: '#94A3B8',
  },
  pageIndicatorPill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  pageIndicatorText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#15803D',
  },
});
