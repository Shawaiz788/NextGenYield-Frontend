import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, Spacing, Radius } from '@/constants/theme';
import { useApp } from '@/context/app-context';

/**
 * Sign-Up & Login Screen — Chapter 4, Figure 4.1
 * Implements Use Case 1 (Registration) and Use Case 2 (Login)
 */
export default function AuthScreen() {
  const { login, language, setLanguage, userProfile } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPin, setShowPin] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('300 8472910');
  const [district, setDistrict] = useState('Lahore');
  const [pin, setPin] = useState('1234');

  const isUrdu = language === 'ur';

  const handleSubmit = () => {
    login({
      fullName: (mode === 'signup' && fullName.trim()) ? fullName.trim() : (userProfile.fullName || 'Chaudhry Muhammad Akram'),
      phoneNumber: phoneNumber.trim() ? (phoneNumber.startsWith('+92') ? phoneNumber : `+92 ${phoneNumber}`) : userProfile.phoneNumber,
      district: district || userProfile.district,
    });
    router.replace('/(tabs)');
  };


  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* ─── Top Illustration Area ─── */}
          <View style={styles.heroSection}>
            <View style={styles.heroGradient}>
              <View style={styles.logoContainer}>
                <View style={styles.logoBg}>
                  <MaterialCommunityIcons name="sprout" size={32} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.heroTitle}>NextGenYield</Text>
              <Text style={styles.heroSubtitle}>
                {isUrdu
                  ? 'گندم کی فصل کے لیے AI مشاورتی نظام'
                  : 'Wheat Crop Decision Support & Vision AI'}
              </Text>
            </View>

            {/* Decorative wheat illustrations */}
            <View style={styles.wheatDecoLeft}>
              <MaterialCommunityIcons name="barley" size={40} color="rgba(22, 163, 74, 0.15)" />
            </View>
            <View style={styles.wheatDecoRight}>
              <MaterialCommunityIcons name="barley" size={48} color="rgba(22, 163, 74, 0.1)" />
            </View>
          </View>

          {/* ─── Language Toggle ─── */}
          <View style={styles.langRow}>
            <TouchableOpacity
              onPress={() => setLanguage('en')}
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              activeOpacity={0.7}>
              <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLanguage('ur')}
              style={[styles.langBtn, language === 'ur' && styles.langBtnActive]}
              activeOpacity={0.7}>
              <Text style={[styles.langBtnText, language === 'ur' && styles.langBtnTextActive]}>اردو</Text>
            </TouchableOpacity>
          </View>

          {/* ─── Mode Toggle: Sign Up / Login ─── */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              onPress={() => setMode('login')}
              style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
              activeOpacity={0.7}>
              <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>
                {isUrdu ? 'لاگ ان' : 'Sign In'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('signup')}
              style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
              activeOpacity={0.7}>
              <Text style={[styles.modeBtnText, mode === 'signup' && styles.modeBtnTextActive]}>
                {isUrdu ? 'نیا اکاؤنٹ' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ─── Form Card ─── */}
          <View style={styles.formCard}>
            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {isUrdu ? 'پورا نام' : 'Full Name'}
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color={Colors.light.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder={isUrdu ? 'اپنا نام درج کریں' : 'Enter your full name'}
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {isUrdu ? 'موبائل نمبر' : 'Mobile Number'}
              </Text>
              <View style={styles.inputWrapper}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+92</Text>
                </View>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder={isUrdu ? '3XX XXXXXXX' : '3XX XXXXXXX'}
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  style={[styles.textInput, { paddingLeft: 4 }]}
                />
              </View>
            </View>

            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {isUrdu ? 'ضلع / علاقہ' : 'District / Region'}
                </Text>
                <View style={styles.districtChips}>
                  {['Faisalabad', 'Lahore', 'Multan', 'Sahiwal'].map((d) => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setDistrict(d)}
                      style={[styles.districtChip, district === d && styles.districtChipActive]}
                      activeOpacity={0.7}>
                      <Text style={[styles.districtChipText, district === d && styles.districtChipTextActive]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {isUrdu ? 'پن کوڈ' : 'PIN / Password'}
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.light.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={pin}
                  onChangeText={setPin}
                  placeholder={isUrdu ? '4 ہندسوں کا پن' : 'Enter 4-digit PIN'}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPin}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.textInput}
                />
                <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeBtn}>
                  <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.light.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.submitBtn}
              activeOpacity={0.85}>
              <Text style={styles.submitBtnText}>
                {mode === 'login'
                  ? (isUrdu ? 'لاگ ان کریں' : 'Sign In')
                  : (isUrdu ? 'اکاؤنٹ بنائیں' : 'Create Account')}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

          </View>

          {/* Bottom Switch */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === 'login'
                ? (isUrdu ? 'نئے ہیں؟' : "Don't have an account?")
                : (isUrdu ? 'پہلے سے اکاؤنٹ ہے؟' : 'Already have an account?')}
            </Text>
            <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              <Text style={styles.switchLink}>
                {mode === 'login'
                  ? (isUrdu ? 'اکاؤنٹ بنائیں' : 'Create Account')
                  : (isUrdu ? 'لاگ ان کریں' : 'Sign In')}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xxxl,
  },

  // ─── Hero ─────────────────────────────────
  heroSection: {
    position: 'relative',
    overflow: 'hidden',
  },
  heroGradient: {
    backgroundColor: '#F0FDF4',
    paddingTop: 48,
    paddingBottom: 36,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  logoBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  heroTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 28,
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  wheatDecoLeft: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    transform: [{ rotate: '-15deg' }],
  },
  wheatDecoRight: {
    position: 'absolute',
    top: 30,
    right: 15,
    transform: [{ rotate: '20deg' }],
  },

  // ─── Language Toggle ──────────────────────
  langRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  langBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  langBtnActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  langBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  langBtnTextActive: {
    color: '#FFFFFF',
  },

  // ─── Mode Toggle ──────────────────────────
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modeBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  modeBtnTextActive: {
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },

  // ─── Form Card ────────────────────────────
  formCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: Colors.light.text,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.light.text,
    paddingVertical: 12,
  },
  phonePrefix: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  phonePrefixText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  eyeBtn: {
    padding: 4,
  },
  districtChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  districtChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: '#F8FAFC',
  },
  districtChipActive: {
    backgroundColor: Colors.light.primaryLight,
    borderColor: Colors.light.primary,
  },
  districtChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  districtChipTextActive: {
    fontFamily: FontFamily.bold,
    color: Colors.light.primaryDark,
  },

  // ─── Submit ───────────────────────────────
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 15,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },

  // ─── Bottom Switch ────────────────────────
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxl,
    gap: 4,
  },
  switchText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  switchLink: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: Colors.light.primary,
  },
});
