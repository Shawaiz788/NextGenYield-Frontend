import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
  Platform,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp } from '@/context/app-context';
import { FontFamily, Spacing, Radius } from '@/constants/theme';
import { AccessibilityControls } from '@/components/accessibility-bar';

export default function ProfileScreen() {
  const {
    userProfile,
    logout,
    fields,
    language,
    toggleLanguage,
    fontScale,
    toggleFontScale,
    fontMultiplier,
  } = useApp();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean>(false);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<boolean>(false);

  const isUrdu = language === 'ur';

  const checkPermissions = async () => {
    try {
      const cam = await Camera.getCameraPermissionsAsync();
      setCameraPermission(cam.status === 'granted');

      const loc = await Location.getForegroundPermissionsAsync();
      setLocationPermission(loc.status === 'granted');

      const media = await ImagePicker.getMediaLibraryPermissionsAsync();
      setMediaLibraryPermission(media.status === 'granted');
    } catch (_) {}
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const handleToggleCamera = async () => {
    if (!cameraPermission) {
      const res = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(res.status === 'granted');
      if (res.status !== 'granted' && !res.canAskAgain) {
        promptOpenSettings(isUrdu ? 'کیمرہ' : 'Camera');
      }
    } else {
      promptOpenSettings(isUrdu ? 'کیمرہ' : 'Camera');
    }
  };

  const handleToggleLocation = async () => {
    if (!locationPermission) {
      const res = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(res.status === 'granted');
      if (res.status !== 'granted' && !res.canAskAgain) {
        promptOpenSettings(isUrdu ? 'لوکیشن' : 'Location');
      }
    } else {
      promptOpenSettings(isUrdu ? 'لوکیشن' : 'Location');
    }
  };

  const handleToggleMedia = async () => {
    if (!mediaLibraryPermission) {
      const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setMediaLibraryPermission(res.status === 'granted');
      if (res.status !== 'granted' && !res.canAskAgain) {
        promptOpenSettings(isUrdu ? 'تصاویر / گیلری' : 'Photos / Media');
      }
    } else {
      promptOpenSettings(isUrdu ? 'تصاویر / گیلری' : 'Photos / Media');
    }
  };

  const promptOpenSettings = (name: string) => {
    Alert.alert(
      isUrdu ? `${name} کی اجازت کی سیٹنگ` : `${name} Permission Setting`,
      isUrdu
        ? `اجازت تبدیل کرنے کے لیے ڈیوائس کی سیٹنگز اوپن کریں۔`
        : `To change or revoke ${name} permission, please open device app settings.`,
      [
        { text: isUrdu ? 'منسوخ' : 'Cancel', style: 'cancel' },
        {
          text: isUrdu ? 'سیٹنگز کھولیں' : 'Open Settings',
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      isUrdu ? 'لاگ آؤٹ کی تصدیق' : 'Sign Out Confirmation',
      isUrdu
        ? 'کیا آپ واقعی NextGenYield اکاؤنٹ سے لاگ آؤٹ کرنا چاہتے ہیں؟'
        : 'Are you sure you want to sign out of NextGenYield?',
      [
        {
          text: isUrdu ? 'منسوخ کریں' : 'Cancel',
          style: 'cancel',
        },
        {
          text: isUrdu ? 'ہاں، لاگ آؤٹ کریں' : 'Yes, Sign Out',
          style: 'destructive',
          onPress: () => {
            setIsSigningOut(true);
            logout();
            router.replace('/auth');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ─── Top Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoCircle}>
              <Ionicons name="person" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.screenTitle, { fontSize: 15 * fontMultiplier }]}>
                {isUrdu ? 'کسان پروفائل اور ترتیبات' : 'Farmer Profile & Settings'}
              </Text>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.screenSubtitle, { fontSize: 10.5 * fontMultiplier }]}>
                {isUrdu ? '📍 کسان آئی ڈی: PK-LHR-0198' : '📍 Farmer ID: PK-LHR-0198 · Verified'}
              </Text>
            </View>
          </View>
          <AccessibilityControls />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ─── Farmer Identity Card ─── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>
                  {userProfile.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'MA'}
                </Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.rolePill}>
                <View style={styles.roleDot} />
                <Text style={styles.rolePillText}>
                  {isUrdu ? 'تصدیق شدہ گندم پروڈیوسر' : 'Verified Wheat Grower'}
                </Text>
              </View>
              <Text style={[styles.farmerName, { fontSize: 20 * fontMultiplier }]}>
                {userProfile.fullName}
              </Text>
              <Text style={styles.farmerPhone}>
                📞 {userProfile.phoneNumber}
              </Text>
              <Text style={styles.farmerDistrict}>
                📍 {userProfile.district} · پنجاب
              </Text>
            </View>
          </View>

          {/* Verification Bar */}
          <View style={styles.cnicBar}>
            <View style={styles.cnicLeft}>
              <Ionicons name="card-outline" size={15} color="#64748B" />
              <Text style={styles.cnicText}>
                CNIC: {userProfile.cnicNumber || '35201-1984729-1'}
              </Text>
            </View>
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>Active Rabi 2026</Text>
            </View>
          </View>
        </View>

        {/* ─── Farm Vitals Overview ─── */}
        <View style={styles.statsRow}>
          {/* Total Wheat Area */}
          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <MaterialCommunityIcons name="image-filter-hdr" size={18} color="#16A34A" />
            </View>
            <Text style={[styles.statValue, { fontSize: 16 * fontMultiplier }]}>
              {userProfile.wheatAcreage || 18.5} ac
            </Text>
            <Text style={styles.statLabel}>
              {isUrdu ? 'کل گندم رقبہ' : 'Wheat Land'}
            </Text>
          </View>

          {/* Registered Parcels */}
          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="map-outline" size={18} color="#0284C7" />
            </View>
            <Text style={[styles.statValue, { fontSize: 16 * fontMultiplier }]}>
              {fields.length}
            </Text>
            <Text style={styles.statLabel}>
              {isUrdu ? 'محفوظ شدہ کھیت' : 'Parcels'}
            </Text>
          </View>

          {/* Expected Yield */}
          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="gold" size={18} color="#D97706" />
            </View>
            <Text style={[styles.statValue, { fontSize: 16 * fontMultiplier }]}>
              {userProfile.seasonYieldMaunds || 840} md
            </Text>
            <Text style={styles.statLabel}>
              {isUrdu ? 'تخمینہ پیداوار' : 'Proj. Yield'}
            </Text>
          </View>
        </View>

        {/* ─── Registered Farm Parcels ─── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { fontSize: 16 * fontMultiplier }]}>
                {isUrdu ? 'آپ کے رجسٹرڈ رقبے' : 'Registered Field Parcels'}
              </Text>
              <Text style={styles.sectionSub}>
                {isUrdu ? 'مصطفیٰ ٹاؤن اور کینال بلاک' : 'Mustafa Town & Canal Sector Parcels'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/map')}
              style={styles.fieldViewMapBtn}
              activeOpacity={0.7}>
              <Ionicons name="map" size={14} color="#16A34A" style={{ marginRight: 4 }} />
              <Text style={styles.fieldViewMapBtnText}>
                {isUrdu ? 'نقشہ دیکھیں' : 'View Map'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldParcelsList}>
            {fields.map((f, idx) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => router.push('/field-profile')}
                style={styles.parcelRow}
                activeOpacity={0.75}>
                <View style={styles.parcelIdxCircle}>
                  <Text style={styles.parcelIdxText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.parcelCode, { fontSize: 14 * fontMultiplier }]}>
                    {f.code} · {f.displayName}
                  </Text>
                  <Text style={styles.parcelDetails}>
                    {f.areaAcres} Acres · {f.wheatVariety} · {f.soilTexture}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── Language & Display Settings ─── */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { fontSize: 16 * fontMultiplier }]}>
            {isUrdu ? 'زبان اور ڈسپلے ترتیبات' : 'App Preferences & Accessibility'}
          </Text>
          <Text style={styles.sectionSub}>
            {isUrdu ? 'دھوپ میں واضح پڑھنے کے لیے تبدیل کریں' : 'Customized for in-field visibility & local language'}
          </Text>

          {/* Language Toggle Row */}
          <View style={styles.settingItemRow}>
            <View style={styles.settingItemLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="language" size={18} color="#16A34A" />
              </View>
              <View>
                <Text style={styles.settingItemTitle}>
                  {isUrdu ? 'ایپ کی زبان' : 'Interface Language'}
                </Text>
                <Text style={styles.settingItemSub}>
                  {language === 'ur' ? 'اردو (Urdu Active)' : 'English (Active)'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={toggleLanguage}
              style={styles.togglePill}
              activeOpacity={0.8}>
              <Text style={styles.togglePillText}>
                {language === 'en' ? 'Switch to اردو' : 'Switch to English'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivider} />

          {/* Font Scale Toggle Row */}
          <View style={styles.settingItemRow}>
            <View style={styles.settingItemLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="text" size={18} color="#D97706" />
              </View>
              <View>
                <Text style={styles.settingItemTitle}>
                  {isUrdu ? 'حروف کا سائز (فونٹ)' : 'Font Size (Readability)'}
                </Text>
                <Text style={styles.settingItemSub}>
                  {fontScale === 'large'
                    ? (isUrdu ? 'بڑا سائز (1.15x فعال)' : 'Large 1.15x Active')
                    : (isUrdu ? 'معمول کا سائز (1.0x)' : 'Standard 1.0x Active')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={toggleFontScale}
              style={[styles.togglePill, fontScale === 'large' && styles.togglePillActive]}
              activeOpacity={0.8}>
              <Text style={[styles.togglePillText, fontScale === 'large' && styles.togglePillTextActive]}>
                {fontScale === 'large' ? 'Set Normal' : 'Enlarge Font'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Agronomy & Extension Wing ─── */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { fontSize: 16 * fontMultiplier }]}>
            {isUrdu ? 'محکمہ زراعت و مشاورتی معلومات' : 'Agronomy & Field Services'}
          </Text>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Ionicons name="ribbon-outline" size={16} color="#16A34A" />
              <Text style={styles.infoText}>
                {isUrdu ? 'منظور شدہ بیج: فیصل آباد-2008 / اکبر-19' : 'Certified Seed: Faisalabad-2008 & Akbar-19'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={16} color="#0284C7" />
              <Text style={styles.infoText}>
                {isUrdu ? 'کھاد پارٹنر: اینگرو فرٹیلائزرز / فوجی فرٹیلائزر' : 'Fertilizer: Engro Fertilizers / FFC'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#7C3AED" />
              <Text style={styles.infoText}>
                {isUrdu ? 'سیٹلائٹ سروس: ایسری ورلڈ امیجری (Mustafa Town GIS)' : 'Satellite Service: Esri World Imagery (GIS Real)'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Device Permissions Section Card ─── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { fontSize: 16 * fontMultiplier }]}>
              {isUrdu ? 'ایپ کی اجازتیں (Device Permissions)' : 'App Permissions & Privacy'}
            </Text>
            <TouchableOpacity onPress={checkPermissions} activeOpacity={0.7}>
              <Ionicons name="refresh-outline" size={18} color="#16A34A" />
            </TouchableOpacity>
          </View>
          <Text style={styles.permissionsSubtitle}>
            {isUrdu
              ? 'کیمرہ اور لوکیشن وغیرہ کی حیثیت چیک اور تبدیل کریں۔'
              : 'Review and manage hardware permissions used for crop scanning & mapping.'}
          </Text>

          {/* Camera Permission */}
          <View style={styles.permissionItemRow}>
            <View style={styles.permissionLeft}>
              <View style={[styles.permissionIconWrap, { backgroundColor: cameraPermission ? '#DCFCE7' : '#FEE2E2' }]}>
                <Ionicons
                  name="camera"
                  size={18}
                  color={cameraPermission ? '#16A34A' : '#DC2626'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingItemTitle}>
                  {isUrdu ? 'کیمرہ کی اجازت (Camera)' : 'Camera Access'}
                </Text>
                <Text style={styles.settingItemSub}>
                  {cameraPermission
                    ? (isUrdu ? 'فعال (AI فصل اسکین کے لیے دستیاب)' : 'Granted · Active for ViT-B/14 canopy analysis')
                    : (isUrdu ? 'غیر فعال (تصویر لینے کے لیے درکار)' : 'Disabled · Required to capture wheat scans')}
                </Text>
              </View>
            </View>
            <Switch
              value={cameraPermission}
              onValueChange={handleToggleCamera}
              trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
              thumbColor={cameraPermission ? '#16A34A' : '#F1F5F9'}
            />
          </View>

          <View style={styles.cardDivider} />

          {/* Location Permission */}
          <View style={styles.permissionItemRow}>
            <View style={styles.permissionLeft}>
              <View style={[styles.permissionIconWrap, { backgroundColor: locationPermission ? '#DCFCE7' : '#FEE2E2' }]}>
                <Ionicons
                  name="location"
                  size={18}
                  color={locationPermission ? '#16A34A' : '#DC2626'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingItemTitle}>
                  {isUrdu ? 'لوکیشن کی اجازت (GPS)' : 'Location (GPS / Maps)'}
                </Text>
                <Text style={styles.settingItemSub}>
                  {locationPermission
                    ? (isUrdu ? 'فعال (نقشہ اور کھیت باؤنڈری کے لیے)' : 'Granted · Active for live field demarcation & GPS')
                    : (isUrdu ? 'غیر فعال (کھیت کے مقام کے لیے درکار)' : 'Disabled · Required to locate plots on satellite map')}
                </Text>
              </View>
            </View>
            <Switch
              value={locationPermission}
              onValueChange={handleToggleLocation}
              trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
              thumbColor={locationPermission ? '#16A34A' : '#F1F5F9'}
            />
          </View>

          <View style={styles.cardDivider} />

          {/* Photo Library Permission */}
          <View style={styles.permissionItemRow}>
            <View style={styles.permissionLeft}>
              <View style={[styles.permissionIconWrap, { backgroundColor: mediaLibraryPermission ? '#DCFCE7' : '#FEE2E2' }]}>
                <Ionicons
                  name="images"
                  size={18}
                  color={mediaLibraryPermission ? '#16A34A' : '#DC2626'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingItemTitle}>
                  {isUrdu ? 'گیلری اور تصاویر (Photo Gallery)' : 'Photo Library / Gallery'}
                </Text>
                <Text style={styles.settingItemSub}>
                  {mediaLibraryPermission
                    ? (isUrdu ? 'فعال (گیلری سے تصویر منتخب کرنے کے لیے)' : 'Granted · Active for selecting saved crop photos')
                    : (isUrdu ? 'غیر فعال (گیلری تصویر کے لیے درکار)' : 'Disabled · Required to pick photos from album')}
                </Text>
              </View>
            </View>
            <Switch
              value={mediaLibraryPermission}
              onValueChange={handleToggleMedia}
              trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
              thumbColor={mediaLibraryPermission ? '#16A34A' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* ─── Sign Out Action Card ─── */}
        <View style={styles.signOutCard}>
          <View style={styles.signOutHeader}>
            <View style={styles.signOutIconCircle}>
              <Ionicons name="log-out-outline" size={24} color="#DC2626" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.signOutTitle, { fontSize: 16 * fontMultiplier }]}>
                {isUrdu ? 'اکاؤنٹ سے لاگ آؤٹ کریں' : 'Sign Out of Account'}
              </Text>
              <Text style={styles.signOutDesc}>
                {isUrdu
                  ? 'لاگ آؤٹ کرنے پر آپ لاگ ان / رجسٹریشن اسکرین پر چلے جائیں گے۔'
                  : 'You will return to the farmer registration & login screen.'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSignOut}
            disabled={isSigningOut}
            style={styles.signOutButton}
            activeOpacity={0.85}>
            <Ionicons name="log-out" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.signOutButtonText}>
              {isUrdu ? 'لاگ آؤٹ کریں (Sign Out)' : 'Sign Out Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── App Footnote ─── */}
        <View style={styles.footnote}>
          <Text style={styles.footnoteBrand}>NextGenYield Mobile</Text>
          <Text style={styles.footnoteVersion}>
            Version 1.0.0 · Wheat Crop Decision & Vision AI Prototype
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  screenSubtitle: {
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 1,
  },

  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },

  // ─── Profile Card ─────────────────────────
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#DCFCE7',
  },
  avatarInitials: {
    fontFamily: FontFamily.extraBold,
    fontSize: 22,
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
    gap: 5,
  },
  roleDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
  },
  rolePillText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#15803D',
  },
  farmerName: {
    fontFamily: FontFamily.extraBold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  farmerPhone: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12.5,
    color: '#475569',
    marginTop: 2,
  },
  farmerDistrict: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  cnicBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cnicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cnicText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#475569',
  },
  activeTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTagText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#0284C7',
  },

  // ─── Stats Row ────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontFamily: FontFamily.extraBold,
    color: '#0F172A',
  },
  statLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },

  // ─── Section Card ─────────────────────────
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  sectionSub: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  fieldViewMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  fieldViewMapBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#16A34A',
  },

  // Parcels list
  fieldParcelsList: {
    gap: 8,
  },
  parcelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  parcelIdxCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parcelIdxText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  parcelCode: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  parcelDetails: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },

  // Settings Rows
  settingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingItemTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13.5,
    color: '#0F172A',
  },
  settingItemSub: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  togglePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  togglePillActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  togglePillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#334155',
  },
  togglePillTextActive: {
    color: '#B45309',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },

  // Agronomy info list
  infoList: {
    marginTop: 10,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.md,
    gap: 8,
  },
  infoText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },

  // Permissions section
  permissionsSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  permissionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  permissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  permissionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sign out card
  signOutCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signOutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  signOutIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutTitle: {
    fontFamily: FontFamily.bold,
    color: '#991B1B',
  },
  signOutDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 13,
    borderRadius: Radius.md,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Footnote
  footnote: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  footnoteBrand: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#94A3B8',
  },
  footnoteVersion: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
});
