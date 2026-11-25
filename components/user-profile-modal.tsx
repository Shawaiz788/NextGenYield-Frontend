import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, FontFamily, Spacing, Radius, CardStyle, PrimaryButtonShadow, MetricNumberStyle } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import {
  useUserProfileQuery,
  useConnectFarmerMutation,
  useDisconnectFarmerMutation,
} from '@/hooks/use-community';
import { useFieldsQuery } from '@/hooks/use-fields';
import { PublicUserProfileDTO } from '@/services/api-client';

interface UserProfileModalProps {
  visible: boolean;
  userId: string | null;
  initialData?: Partial<PublicUserProfileDTO>;
  onClose: () => void;
  onStartChat?: (userId: string, userName: string) => void;
}

export function UserProfileModal({
  visible,
  userId,
  initialData,
  onClose,
  onStartChat,
}: UserProfileModalProps) {
  const router = useRouter();
  const { language, fontMultiplier, fields: contextFields, userProfile: myProfile } = useApp();
  const isUrdu = language === 'ur';

  const { data: userProfile, isLoading } = useUserProfileQuery(visible ? userId : null);
  const { data: allMapFields } = useFieldsQuery(true, visible);
  const connectMutation = useConnectFarmerMutation();
  const disconnectMutation = useDisconnectFarmerMutation();

  const handleViewFieldOnMap = (fieldId?: string) => {
    onClose();
    router.push({
      pathname: '/(tabs)/map',
      params: fieldId ? { selectedFieldId: fieldId } : undefined,
    } as any);
  };

  const profile: Partial<PublicUserProfileDTO> = userProfile || initialData || {};
  const displayName = profile.full_name || 'Farmer';
  const displayDistrict = profile.district || 'Punjab, Pakistan';
  const displayRole = profile.role || (isUrdu ? 'ترقی پسند گندم کاشتکار' : 'Progressive Wheat Farmer');
  const isSelf = profile.connection_status === 'self' || (Boolean((myProfile as any)?.user_id) && Boolean(userId) && userId === (myProfile as any)?.user_id);
  const isFriend = profile.connection_status === 'accepted';
  const isPending = connectMutation.isPending || disconnectMutation.isPending;

  // Unified and authentic parcels calculation
  const effectiveFields = useMemo(() => {
    if (!visible || !userId) return [];

    // 1. Direct fields in user profile response from backend
    if (profile.fields && profile.fields.length > 0) {
      if (isSelf) {
        return profile.fields.filter((f) => f.is_mine !== false);
      }
      return profile.fields;
    }

    // 2. If viewing self, fallback to context active fields
    if (isSelf && contextFields && contextFields.length > 0) {
      const myContext = contextFields.filter((cf) => (cf as any).is_mine !== false && (cf as any).isUserField !== false);
      if (myContext.length > 0) {
        return myContext.map((cf) => ({
          field_id: cf.id,
          field_code: cf.code,
          field_name: cf.displayName,
          area_acres: cf.areaAcres,
          wheat_variety: cf.wheatVariety,
          cycle_status: cf.cycleStatus,
          is_mine: true,
        }));
      }
    }

    // 3. Fallback to allMapFields if cached from map query
    if (allMapFields && allMapFields.length > 0) {
      const matched = allMapFields.filter(
        (f) => isSelf ? Boolean(f.is_mine) : (!f.is_mine && (f.user_id === userId || f.owner_id === userId))
      );
      if (matched.length > 0) {
        return matched.map((f) => ({
          field_id: f.field_id,
          field_code: f.field_code,
          field_name: f.field_name,
          area_acres: f.area_acres,
          wheat_variety: f.wheat_variety || 'Akbar-2019',
          cycle_status: f.cycle_status || 'active',
          is_mine: Boolean(f.is_mine),
        }));
      }
    }

    return [];
  }, [profile.fields, isSelf, contextFields, allMapFields, userId]);

  const effectiveTotalFields = effectiveFields.length;
  const effectiveAcreage = useMemo(() => {
    if (effectiveFields.length > 0) {
      return Math.round(effectiveFields.reduce((sum, f) => sum + (Number(f.area_acres) || 0), 0) * 10) / 10;
    }
    return 0.0;
  }, [effectiveFields]);

  const effectiveActiveCrops = useMemo(() => {
    return effectiveFields.filter(
      (f: any) => f.cycle_status === 'active' || f.current_cycle_id || f.cycleStatus === 'active'
    ).length;
  }, [effectiveFields]);

  const handleToggleFriend = async () => {
    if (isSelf || !userId) return;

    if (isFriend) {
      Alert.alert(
        isUrdu ? 'دوستی ختم کریں؟' : 'Remove Friend?',
        isUrdu
          ? `کیا آپ واقعی ${displayName} کو فرینڈ لسٹ سے ہٹانا چاہتے ہیں؟`
          : `Are you sure you want to remove ${displayName} from your friends?`,
        [
          { text: isUrdu ? 'منسوخ' : 'Cancel', style: 'cancel' },
          {
            text: isUrdu ? 'ہٹائیں' : 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await disconnectMutation.mutateAsync(userId);
              } catch (err: any) {
                Alert.alert('Error', err?.message || 'Failed to remove friend');
              }
            },
          },
        ]
      );
    } else {
      try {
        await connectMutation.mutateAsync(userId);
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to add friend');
      }
    }
  };

  const handleCall = () => {
    if (profile.phone_number) {
      Linking.openURL(`tel:${profile.phone_number}`);
    }
  };

  const handleChat = () => {
    onClose();
    if (onStartChat && userId) {
      onStartChat(userId, displayName);
    }
  };

  if (!visible || !userId) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Navigation Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: 16 * fontMultiplier }]}>
            {isUrdu ? 'کسان پروفائل' : 'Farmer Profile'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Avatar Banner Card */}
          <View style={styles.avatarCard}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              </View>
            </View>

            <Text style={[styles.userName, { fontSize: 20 * fontMultiplier }]}>{displayName}</Text>
            <View style={styles.rolePill}>
              <MaterialCommunityIcons name="sprout" size={14} color="#16A34A" style={{ marginRight: 4 }} />
              <Text style={styles.roleText}>{displayRole}</Text>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#64748B" />
              <Text style={styles.locationText}>{displayDistrict}</Text>
            </View>
          </View>

          {/* Action Buttons: Add Friend & Chat */}
          <View style={styles.actionRow}>
            {!isSelf && (
              <TouchableOpacity
                style={[
                  styles.addFriendBtn,
                  isFriend && styles.friendsBtn,
                  isPending && { opacity: 0.7 },
                ]}
                disabled={isPending}
                onPress={handleToggleFriend}
                activeOpacity={0.8}>
                {isPending ? (
                  <ActivityIndicator size="small" color={isFriend ? '#16A34A' : '#FFFFFF'} />
                ) : isFriend ? (
                  <>
                    <Ionicons name="checkmark-done" size={18} color="#15803D" />
                    <Text style={[styles.friendsBtnText, { fontSize: 13.5 * fontMultiplier }]}>
                      {isUrdu ? '✓ دوست ہیں' : '✓ Friends'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="person-add" size={18} color="#FFFFFF" />
                    <Text style={[styles.addFriendBtnText, { fontSize: 13.5 * fontMultiplier }]}>
                      {isUrdu ? 'دوست بنائیں' : 'Add as Friend'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {!isSelf && onStartChat && (
              <TouchableOpacity
                style={styles.chatActionBtn}
                onPress={handleChat}
                activeOpacity={0.8}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0F172A" />
                <Text style={[styles.chatActionBtnText, { fontSize: 13.5 * fontMultiplier }]}>
                  {isUrdu ? 'چیٹ' : 'Message'}
                </Text>
              </TouchableOpacity>
            )}

            {isSelf && (
              <View style={styles.selfBadge}>
                <Ionicons name="person-circle-outline" size={18} color="#15803D" />
                <Text style={styles.selfBadgeText}>
                  {isUrdu ? 'یہ آپ کا ذاتی پروفائل ہے' : 'This is your own profile'}
                </Text>
              </View>
            )}
          </View>

          {/* Farm & Activity Overview Grid */}
          <Text style={[styles.sectionTitle, { fontSize: 14 * fontMultiplier }]}>
            {isUrdu ? 'زرعی تفصیلات اور ریکارڈ' : 'FARM RECORD & OVERVIEW'}
          </Text>

          {isLoading && !userProfile ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#16A34A" />
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: '#DCFCE7' }]}>
                  <MaterialCommunityIcons name="image-filter-hdr" size={20} color="#16A34A" />
                </View>
                <Text style={styles.statValue}>
                  {`${effectiveAcreage} ac`}
                </Text>
                <Text style={styles.statLabel}>{isUrdu ? 'کل اراضی' : 'Total Acreage'}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="map-outline" size={20} color="#2563EB" />
                </View>
                <Text style={styles.statValue}>
                  {`${effectiveTotalFields}`}
                </Text>
                <Text style={styles.statLabel}>{isUrdu ? 'کھیت' : 'Parcels'}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: '#F0FDF4' }]}>
                  <MaterialCommunityIcons name="sprout" size={20} color="#16A34A" />
                </View>
                <Text style={styles.statValue}>{effectiveActiveCrops}</Text>
                <Text style={styles.statLabel}>{isUrdu ? 'فعال فصل' : 'Active Crops'}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="newspaper-outline" size={20} color="#D97706" />
                </View>
                <Text style={styles.statValue}>{profile.recent_posts?.length || profile.posts_count || 0}</Text>
                <Text style={styles.statLabel}>{isUrdu ? 'پوسٹس' : 'Posts'}</Text>
              </View>
            </View>
          )}

          {/* Demarcated Farm Parcels Section */}
          <View style={styles.parcelsSectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: 13.5 * fontMultiplier, marginBottom: 0 }]}>
              {isUrdu ? 'کھیت اور رقبے' : 'REGISTERED PARCELS'}
            </Text>
            {effectiveFields.length > 0 && (
              <TouchableOpacity
                onPress={() => handleViewFieldOnMap(effectiveFields[0]?.field_id)}
                style={styles.viewAllMapPill}
                activeOpacity={0.7}>
                <Ionicons name="map" size={13} color="#16A34A" />
                <Text style={styles.viewAllMapPillText}>
                  {isUrdu ? 'نقشے پر دیکھیں' : 'View on Map'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {effectiveFields.length > 0 ? (
            <View style={styles.parcelsList}>
              {effectiveFields.map((field) => (
                <TouchableOpacity
                  key={field.field_id}
                  style={styles.parcelCard}
                  activeOpacity={0.75}
                  onPress={() => handleViewFieldOnMap(field.field_id)}>
                  <View style={styles.parcelIconCircle}>
                    <MaterialCommunityIcons name="vector-polygon" size={20} color="#16A34A" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.parcelName}>{field.field_name}</Text>
                      <Text style={styles.parcelAcres}>{field.area_acres} Ac</Text>
                    </View>
                    <Text style={styles.parcelMeta}>
                      {field.field_code || 'Plot'} · {field.wheat_variety || 'Akbar-2019'} ·{' '}
                      {field.cycle_status === 'active'
                        ? isUrdu
                          ? 'فصل فعال'
                          : 'Active Cycle'
                        : isUrdu
                        ? 'تیار زمین'
                        : 'Fallow'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyParcelsCard}>
              <MaterialCommunityIcons name="map-marker-off-outline" size={26} color="#94A3B8" />
              <Text style={styles.emptyParcelsText}>
                {isUrdu ? 'اس کسان کا ابھی کوئی کھیت رجسٹر نہیں ہوا ہے۔' : 'No parcels demarcated by this farmer yet.'}
              </Text>
            </View>
          )}

          {/* Machinery Offered for Rent */}
          {profile.machinery && profile.machinery.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.sectionTitle, { fontSize: 13.5 * fontMultiplier }]}>
                {isUrdu ? 'کرایہ کے لیے دستیاب مشینری' : 'MACHINERY OFFERED FOR RENT'}
              </Text>
              <View style={{ gap: 8 }}>
                {profile.machinery.map((m) => (
                  <View key={m.machinery_id} style={styles.machCard}>
                    <View style={styles.machIconCircle}>
                      <MaterialCommunityIcons name="tractor" size={18} color="#16A34A" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.machTitle}>{m.title}</Text>
                      <Text style={styles.machMeta}>
                        📍 {m.district} · {m.is_available ? (isUrdu ? 'دستیاب' : 'Available') : (isUrdu ? 'بک شدہ' : 'Busy')}
                      </Text>
                    </View>
                    <Text style={styles.machPrice}>PKR {m.daily_rate_pkr.toLocaleString()}/d</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Marketplace Products */}
          {profile.marketplace_items && profile.marketplace_items.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.sectionTitle, { fontSize: 13.5 * fontMultiplier }]}>
                {isUrdu ? 'مارکیٹ پلیس اشیاء' : 'MARKETPLACE PRODUCTS'}
              </Text>
              <View style={{ gap: 8 }}>
                {profile.marketplace_items.map((it) => (
                  <View key={it.item_id} style={styles.machCard}>
                    <View style={[styles.machIconCircle, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="cart-outline" size={18} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.machTitle}>{it.title}</Text>
                      <Text style={styles.machMeta}>
                        {it.category.toUpperCase()} · {it.condition} · {it.is_sold ? (isUrdu ? 'فروخت شدہ' : 'Sold') : (isUrdu ? 'دستیاب' : 'For Sale')}
                      </Text>
                    </View>
                    <Text style={[styles.machPrice, { color: '#2563EB' }]}>PKR {it.price_pkr.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Recent Community Posts */}
          {profile.recent_posts && profile.recent_posts.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.sectionTitle, { fontSize: 13.5 * fontMultiplier }]}>
                {isUrdu ? 'حالیہ کمیونٹی پوسٹس' : 'RECENT COMMUNITY POSTS'}
              </Text>
              <View style={{ gap: 8 }}>
                {profile.recent_posts.map((p) => (
                  <View key={p.post_id} style={styles.postSnippetCard}>
                    <Text style={styles.postSnippetTitle}>{p.title}</Text>
                    <View style={styles.postSnippetFooter}>
                      <Text style={styles.postSnippetCategory}>#{p.category}</Text>
                      <Text style={styles.postSnippetLikes}>❤️ {p.likes_count} likes</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Verification & Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconCircle}>
                <Ionicons
                  name={effectiveTotalFields > 0 ? "shield-checkmark" : "person-outline"}
                  size={18}
                  color={effectiveTotalFields > 0 ? "#16A34A" : "#64748B"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>
                  {effectiveTotalFields > 0
                    ? (isUrdu ? 'تصدیق شدہ کسان اور زمیندار' : 'Verified Farmer & Landowner')
                    : (isUrdu ? 'رجسٹرڈ کمیونٹی ممبر' : 'Registered Community Member')}
                </Text>
                <Text style={styles.detailSub}>
                  {effectiveTotalFields > 0
                    ? (isUrdu
                        ? `${effectiveTotalFields} رجسٹرڈ کھیت، پنجاب زرعی ڈیٹا بیس سے تصدیق شدہ`
                        : `Verified Punjab cultivator with ${effectiveTotalFields} registered parcel(s)`)
                    : (isUrdu
                        ? 'کسان کمیونٹی کا تصدیق شدہ رکن'
                        : 'Active agricultural network member')}
                </Text>
              </View>
            </View>

            {profile.phone_number && (
              <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 }]}>
                <View style={styles.detailIconCircle}>
                  <Ionicons name="call-outline" size={18} color="#0284C7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailTitle}>{profile.phone_number}</Text>
                  <Text style={styles.detailSub}>{isUrdu ? 'رابطہ نمبر' : 'Contact Phone'}</Text>
                </View>
                <TouchableOpacity onPress={handleCall} style={styles.callSmallBtn} activeOpacity={0.7}>
                  <Ionicons name="call" size={14} color="#0284C7" />
                  <Text style={styles.callSmallBtnText}>{isUrdu ? 'کال' : 'Call'}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 }]}>
              <View style={styles.detailIconCircle}>
                <Ionicons name="calendar-outline" size={18} color="#64748B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>
                  {profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString(isUrdu ? 'ur-PK' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '2026 Season'}
                </Text>
                <Text style={styles.detailSub}>{isUrdu ? 'شمولیت' : 'Member Since'}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarCard: {
    ...CardStyle,
    borderRadius: Radius.xl,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarText: {
    fontSize: 30,
    fontFamily: FontFamily.extraBold,
    color: '#15803D',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  userName: {
    fontFamily: FontFamily.extraBold,
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.18)',
    marginBottom: 8,
  },
  roleText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: '#15803D',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(15, 23, 42, 0.62)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  addFriendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    minHeight: 48,
    paddingVertical: 12,
    borderRadius: Radius.md,
    ...PrimaryButtonShadow,
  },
  addFriendBtnText: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  friendsBtn: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
    borderTopColor: '#16A34A',
    borderWidth: 1.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  friendsBtnText: {
    fontFamily: FontFamily.bold,
    color: '#15803D',
  },
  chatActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chatActionBtnText: {
    fontFamily: FontFamily.semiBold,
    color: '#0F172A',
  },
  selfBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    minHeight: 44,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.18)',
  },
  selfBadgeText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: '#15803D',
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 2,
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  statCard: {
    ...CardStyle,
    flex: 1,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    ...MetricNumberStyle,
    fontSize: 16,
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(15, 23, 42, 0.62)',
    marginTop: 2,
    textAlign: 'center',
  },
  detailsCard: {
    ...CardStyle,
    borderRadius: Radius.lg,
    padding: 18,
    gap: 12,
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailTitle: {
    fontSize: 13.5,
    fontFamily: FontFamily.semiBold,
    color: '#0F172A',
  },
  detailSub: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: 'rgba(15, 23, 42, 0.62)',
    marginTop: 2,
  },
  callSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    minHeight: 36,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
  },
  callSmallBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#0284C7',
  },
  parcelsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  viewAllMapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    minHeight: 34,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  viewAllMapPillText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  parcelsList: {
    gap: 10,
    marginBottom: 16,
  },
  parcelCard: {
    ...CardStyle,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  parcelIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parcelName: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  parcelAcres: {
    ...MetricNumberStyle,
    fontSize: 13.5,
    color: '#16A34A',
  },
  parcelMeta: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: 'rgba(15, 23, 42, 0.62)',
    marginTop: 2,
  },
  emptyParcelsCard: {
    ...CardStyle,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 6,
  },
  emptyParcelsText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
  },
  machCard: {
    ...CardStyle,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  machIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  machTitle: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  machMeta: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: 'rgba(15, 23, 42, 0.62)',
    marginTop: 2,
  },
  machPrice: {
    ...MetricNumberStyle,
    fontSize: 13.5,
    color: '#16A34A',
  },
  postSnippetCard: {
    ...CardStyle,
    padding: 14,
    gap: 6,
  },
  postSnippetTitle: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: '#0F172A',
    lineHeight: 18,
  },
  postSnippetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postSnippetCategory: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#16A34A',
  },
  postSnippetLikes: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
  },
});
