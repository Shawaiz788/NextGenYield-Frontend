import React from 'react';
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
import { Colors, FontFamily, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import {
  useUserProfileQuery,
  useConnectFarmerMutation,
  useDisconnectFarmerMutation,
} from '@/hooks/use-community';
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
  const { language, fontMultiplier } = useApp();
  const isUrdu = language === 'ur';

  const { data: userProfile, isLoading } = useUserProfileQuery(visible ? userId : null);
  const connectMutation = useConnectFarmerMutation();
  const disconnectMutation = useDisconnectFarmerMutation();

  const handleViewFieldOnMap = (fieldId?: string) => {
    onClose();
    router.push({
      pathname: '/(tabs)/map',
      params: fieldId ? { selectedFieldId: fieldId } : undefined,
    } as any);
  };

  if (!visible || !userId) return null;

  const profile: Partial<PublicUserProfileDTO> = userProfile || initialData || {};
  const displayName = profile.full_name || 'Farmer';
  const displayDistrict = profile.district || 'Punjab, Pakistan';
  const displayRole = profile.role || (isUrdu ? 'ترقی پسند گندم کاشتکار' : 'Progressive Wheat Farmer');
  const isSelf = profile.connection_status === 'self';
  const isFriend = profile.connection_status === 'accepted';
  const isPending = connectMutation.isPending || disconnectMutation.isPending;

  const handleToggleFriend = async () => {
    if (isSelf) return;

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
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: 16 * fontMultiplier }]}>
            {isUrdu ? 'کسان پروفائل' : 'Farmer Profile'}
          </Text>
          <View style={{ width: 36 }} />
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
                  {typeof profile.total_acreage === 'number'
                    ? `${profile.total_acreage} ac`
                    : '0 ac'}
                </Text>
                <Text style={styles.statLabel}>{isUrdu ? 'کل اراضی' : 'Total Acreage'}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="map-outline" size={20} color="#2563EB" />
                </View>
                <Text style={styles.statValue}>
                  {typeof profile.total_fields === 'number'
                    ? `${profile.total_fields}`
                    : '0'}
                </Text>
                <Text style={styles.statLabel}>{isUrdu ? 'کھیت' : 'Parcels'}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="newspaper-outline" size={20} color="#D97706" />
                </View>
                <Text style={styles.statValue}>{profile.posts_count ?? 0}</Text>
                <Text style={styles.statLabel}>{isUrdu ? 'پوسٹس' : 'Posts'}</Text>
              </View>
            </View>
          )}

          {/* Demarcated Farm Parcels Section */}
          <View style={styles.parcelsSectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: 13.5 * fontMultiplier, marginBottom: 0 }]}>
              {isUrdu ? 'کھیت اور رقبے' : 'REGISTERED PARCELS'}
            </Text>
            {profile.fields && profile.fields.length > 0 && (
              <TouchableOpacity
                onPress={() => handleViewFieldOnMap(profile.fields?.[0]?.field_id)}
                style={styles.viewAllMapPill}
                activeOpacity={0.7}>
                <Ionicons name="map" size={13} color="#16A34A" />
                <Text style={styles.viewAllMapPillText}>
                  {isUrdu ? 'نقشے پر دیکھیں' : 'View on Map'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {profile.fields && profile.fields.length > 0 ? (
            <View style={styles.parcelsList}>
              {profile.fields.map((field) => (
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

          {/* Verification & Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconCircle}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>{isUrdu ? 'تصدیق شدہ کسان' : 'Verified Farmer'}</Text>
                <Text style={styles.detailSub}>
                  {isUrdu ? 'پنجاب زرعی ڈیٹا بیس سے تصدیق شدہ ریکارڈ' : 'Registered Punjab agricultural cultivator'}
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#16A34A',
  },
  avatarText: {
    fontSize: 30,
    fontFamily: FontFamily.bold,
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
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    marginBottom: 4,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 8,
  },
  roleText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#15803D',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    color: '#64748B',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  addFriendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addFriendBtnText: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  friendsBtn: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
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
    paddingVertical: 12,
    borderRadius: 12,
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
    paddingVertical: 10,
    borderRadius: 10,
  },
  selfBadgeText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
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
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    color: '#64748B',
    marginTop: 2,
  },
  callSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  callSmallBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
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
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  viewAllMapPillText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  parcelsList: {
    gap: 8,
    marginBottom: 16,
  },
  parcelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  parcelIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parcelName: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  parcelAcres: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  parcelMeta: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    marginTop: 2,
  },
  emptyParcelsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 6,
  },
  emptyParcelsText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
  },
});
