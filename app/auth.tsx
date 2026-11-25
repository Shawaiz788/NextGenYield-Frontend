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
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, Spacing, Radius, CardStyle, PrimaryButtonShadow } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { setAuthToken, getBackendBaseUrl, BackendUnreachableError } from '@/services/api-client';
import { useLoginMutation, useRegisterMutation } from '@/hooks/use-auth-mutations';
import { logger } from '@/services/logger';

declare const __DEV__: boolean;

/**
 * Validates and normalizes Pakistani mobile numbers.
 * Supports: 300 8472910, 03008472910, +923008472910, 923008472910
 */
function validateAndFormatPhone(phone: string): { valid: boolean; formatted: string; error?: string } {
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length === 0) {
    return { valid: false, formatted: '', error: 'phone_required' };
  }

  // 12 digits: starts with 923...
  if (digitsOnly.startsWith('92') && digitsOnly.length === 12 && digitsOnly.startsWith('923')) {
    return { valid: true, formatted: '0' + digitsOnly.slice(2) };
  }

  // 11 digits: starts with 03...
  if (digitsOnly.startsWith('0') && digitsOnly.length === 11 && digitsOnly.startsWith('03')) {
    return { valid: true, formatted: digitsOnly };
  }

  // 10 digits: starts with 3... (standard when +92 prefix is already shown)
  if (digitsOnly.length === 10 && digitsOnly.startsWith('3')) {
    return { valid: true, formatted: '0' + digitsOnly };
  }

  return {
    valid: false,
    formatted: '',
    error: 'phone_invalid',
  };
}

/**
 * Sign-Up & Login Screen — Chapter 4, Figure 4.1
 * Implements Use Case 1 (Registration) and Use Case 2 (Login)
 * Features TanStack Query mutations, progressive button states,
 * and comprehensive input validation.
 */
export default function AuthScreen() {
  const { login, language, setLanguage, userProfile } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPin, setShowPin] = useState(false);

  // Form state - inputs start completely empty by default
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [isOtherDistrict, setIsOtherDistrict] = useState(false);
  const [pin, setPin] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{
    fullName?: string;
    phoneNumber?: string;
    district?: string;
    pin?: string;
  }>({});

  // Progressive submission states: 'idle' | 'sending' | 'success'
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  // Backend reachability / error state
  const [backendError, setBackendError] = useState<{
    isUnreachable: boolean;
    message: string;
    targetUrl?: string;
  } | null>(null);

  const isUrdu = language === 'ur';

  // TanStack Query Mutations
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  /**
   * Validate all input fields before sending the API request.
   */
  const validateInputs = (): { isValid: boolean; formattedPhone: string } => {
    const newErrors: {
      fullName?: string;
      phoneNumber?: string;
      district?: string;
      pin?: string;
    } = {};

    // 1. Validate Phone Number
    const phoneCheck = validateAndFormatPhone(phoneNumber);
    if (!phoneCheck.valid) {
      if (phoneCheck.error === 'phone_required') {
        newErrors.phoneNumber = isUrdu ? 'موبائل نمبر درج کرنا ضروری ہے' : 'Mobile number is required';
      } else {
        newErrors.phoneNumber = isUrdu
          ? 'درست موبائل نمبر درج کریں (مثال: 300 1234567)'
          : 'Enter a valid 10-digit mobile number (e.g. 300 1234567)';
      }
    }

    // 2. Validate PIN / Password
    const trimmedPin = pin.trim();
    if (!trimmedPin) {
      newErrors.pin = isUrdu ? 'پن کوڈ درج کرنا ضروری ہے' : 'PIN / Password is required';
    } else if (trimmedPin.length < 4) {
      newErrors.pin = isUrdu
        ? 'پن کوڈ کم از کم 4 ہندسوں پر مشتمل ہونا چاہیے'
        : 'PIN must be at least 4 digits';
    }

    // 3. Validate Signup-only fields
    if (mode === 'signup') {
      const trimmedName = fullName.trim();
      if (!trimmedName) {
        newErrors.fullName = isUrdu ? 'پورا نام درج کرنا ضروری ہے' : 'Full name is required';
      } else if (trimmedName.length < 2) {
        newErrors.fullName = isUrdu
          ? 'نام کم از کم 2 حروف کا ہونا چاہیے'
          : 'Name must be at least 2 characters';
      }

      if (!district) {
        newErrors.district = isUrdu ? 'ضلع کا انتخاب ضروری ہے' : 'District selection is required';
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;

    if (!isValid) {
      logger.warn('Form validation failed:', newErrors);
    }

    return { isValid, formattedPhone: phoneCheck.formatted };
  };

  /**
   * Handle progressive submission with TanStack Query and safe error feedback.
   */
  const handleSubmit = async () => {
    // Clear previous backend errors
    setBackendError(null);

    // 1. Strict Validation: Stop immediately if inputs are not valid!
    const { isValid, formattedPhone } = validateInputs();
    if (!isValid) {
      return;
    }

    // 2. Progressive State: Sending request
    setSubmitStatus('sending');
    logger.info(`Initiating auth [${mode}] for phone: ${formattedPhone}`);

    try {
      if (mode === 'signup') {
        const resp = await registerMutation.mutateAsync({
          fullName: fullName.trim(),
          phoneNumber: formattedPhone,
          password: pin.trim(),
          district: district,
          languagePref: language,
          role: 'farmer',
        });

        // 3. Progressive State: Success
        setSubmitStatus('success');
        await login(
          {
            fullName: resp.user.full_name,
            phoneNumber: resp.user.phone_number,
            district: resp.user.district,
            role: resp.user.role,
          },
          resp.access_token
        );

        setTimeout(() => {
          router.replace('/(tabs)');
        }, 500);

      } else {
        const resp = await loginMutation.mutateAsync({
          phoneNumber: formattedPhone,
          pinOrPass: pin.trim(),
        });

        // 3. Progressive State: Success
        setSubmitStatus('success');
        await login(
          {
            fullName: resp.user.full_name,
            phoneNumber: resp.user.phone_number,
            district: resp.user.district,
            role: resp.user.role,
          },
          resp.access_token
        );

        setTimeout(() => {
          router.replace('/(tabs)');
        }, 500);
      }
    } catch (err: any) {
      setSubmitStatus('idle');
      const isUnreachable =
        err instanceof BackendUnreachableError ||
        err.name === 'BackendUnreachableError' ||
        err.message?.includes('Unable to reach backend') ||
        err.message?.includes('Network request failed') ||
        err.message?.includes('Failed to fetch');

      const targetUrl = getBackendBaseUrl();

      logger.warn('Authentication attempt notice:', {
        mode,
        isUnreachable,
        message: err.message,
        targetUrl,
      });

      if (isUnreachable) {
        setBackendError({
          isUnreachable: true,
          message: isUrdu
            ? `سرور (${targetUrl}) سے رابطہ نہیں ہو سکا۔ براہ کرم چیک کریں کہ سرور آن ہے اور نیٹ ورک ٹھیک ہے۔`
            : `Unable to reach backend at ${targetUrl}. Please ensure your backend is running and reachable on this Wi-Fi network.`,
          targetUrl,
        });
      } else {
        const rawMsg = (err.message || '').toLowerCase();
        let displayMsg = err.message || '';

        if (rawMsg.includes('already registered')) {
          displayMsg = isUrdu
            ? 'یہ موبائل نمبر پہلے سے رجسٹرڈ ہے۔ براہ کرم لاگ ان کریں۔'
            : 'This mobile number is already registered. Please sign in instead.';
          setErrors((prev) => ({
            ...prev,
            phoneNumber: isUrdu ? 'پہلے سے رجسٹرڈ ہے' : 'Already registered',
          }));
        } else if (
          rawMsg.includes('incorrect') ||
          rawMsg.includes('credentials') ||
          rawMsg.includes('pin') ||
          rawMsg.includes('password') ||
          rawMsg.includes('401') ||
          rawMsg.includes('no account')
        ) {
          // Standard security message: do not differentiate between wrong number or wrong PIN
          displayMsg = isUrdu
            ? 'موبائل نمبر یا پن کوڈ درست نہیں۔ براہ کرم دوبارہ کوشش کریں۔'
            : 'Incorrect mobile number or PIN entered. Please verify your credentials and try again.';
          setErrors((prev) => ({
            ...prev,
            phoneNumber: isUrdu ? 'غلط نمبر یا پن' : 'Invalid credentials',
            pin: isUrdu ? 'غلط نمبر یا پن' : 'Invalid credentials',
          }));
        }

        setBackendError({
          isUnreachable: false,
          message: displayMsg,
          targetUrl,
        });
      }
    }
  };

  /**
   * Optional demo bypass when user explicitly opts to continue offline
   */
  const handleContinueOffline = () => {
    logger.info('User opted for offline demo fallback');
    login({
      fullName: (mode === 'signup' && fullName.trim()) ? fullName.trim() : (userProfile.fullName || 'Chaudhry Muhammad Akram'),
      phoneNumber: phoneNumber.trim(),
      district: district || userProfile.district,
    });
    router.replace('/(tabs)');
  };

  // Helper to clear error when user modifies an input
  const clearError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (backendError) {
      setBackendError(null);
    }
  };

  // Determine button label and icon based on progressive status
  const getButtonContent = () => {
    if (submitStatus === 'sending') {
      return (
        <View style={styles.buttonContentRow}>
          <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.submitBtnText}>
            {isUrdu ? 'درخواست بھیجی جا رہی ہے...' : 'Sending request...'}
          </Text>
        </View>
      );
    }

    if (submitStatus === 'success') {
      return (
        <View style={styles.buttonContentRow}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.submitBtnText}>
            {isUrdu ? 'کامیاب! ہوم اسکرین پر جا رہے ہیں...' : 'Moving to home screen...'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.buttonContentRow}>
        <Text style={styles.submitBtnText}>
          {mode === 'login'
            ? (isUrdu ? 'لاگ ان کریں' : 'Sign In')
            : (isUrdu ? 'اکاؤنٹ بنائیں' : 'Create Account')}
        </Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">

          {/* ─── Top Illustration Area ─── */}
          <View style={styles.heroSection}>
            <View style={styles.heroGradient}>
              <View style={styles.logoHalo}>
                <View style={styles.logoBg}>
                  <MaterialCommunityIcons name="sprout" size={32} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.trustPill}>
                <Ionicons name="sparkles" size={12} color="#15803D" />
                <Text style={styles.trustPillText}>
                  {isUrdu ? 'پنجاب کا تصدیق شدہ زرعی AI پلیٹ فارم' : 'Verified Punjab Agri-AI Platform'}
                </Text>
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
              onPress={() => {
                setMode('login');
                setErrors({});
                setBackendError(null);
              }}
              style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
              activeOpacity={0.7}>
              <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>
                {isUrdu ? 'لاگ ان' : 'Sign In'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMode('signup');
                setErrors({});
                setBackendError(null);
              }}
              style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
              activeOpacity={0.7}>
              <Text style={[styles.modeBtnText, mode === 'signup' && styles.modeBtnTextActive]}>
                {isUrdu ? 'نیا اکاؤنٹ' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ─── Form Card ─── */}
          <View style={styles.formCard}>

            {/* Backend Unreachable / API Error Banner */}
            {backendError && (
              <View style={[
                styles.errorBanner,
                backendError.isUnreachable ? styles.errorBannerUnreachable : styles.errorBannerGeneric
              ]}>
                <Ionicons
                  name={backendError.isUnreachable ? 'cloud-offline-outline' : 'alert-circle-outline'}
                  size={24}
                  color={backendError.isUnreachable ? '#DC2626' : '#B45309'}
                  style={{ marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.errorBannerTitle,
                    { color: backendError.isUnreachable ? '#991B1B' : '#92400E' }
                  ]}>
                    {backendError.isUnreachable
                      ? (isUrdu ? 'سرور سے رابطہ نہیں ہو سکا' : 'Unable to reach backend')
                      : (isUrdu ? 'توثیقی غلطی' : 'Authentication Notice')}
                  </Text>
                  <Text style={[
                    styles.errorBannerMessage,
                    { color: backendError.isUnreachable ? '#B91C1C' : '#B45309' }
                  ]}>
                    {backendError.message}
                  </Text>

                  {typeof __DEV__ !== 'undefined' && __DEV__ && (
                    <Text style={styles.devHintText}>
                      [DEV MODE] Diagnostic logs dispatched to logger service.
                    </Text>
                  )}

                  <View style={styles.errorBannerActions}>
                    <TouchableOpacity
                      onPress={handleSubmit}
                      style={styles.retryBtn}
                      activeOpacity={0.8}>
                      <Ionicons name="refresh" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.retryBtnText}>
                        {isUrdu ? 'دوبارہ کوشش کریں' : 'Retry'}
                      </Text>
                    </TouchableOpacity>

                    {backendError.isUnreachable && (
                      <TouchableOpacity
                        onPress={handleContinueOffline}
                        style={styles.offlineBtn}
                        activeOpacity={0.8}>
                        <Text style={styles.offlineBtnText}>
                          {isUrdu ? 'آف لائن جاری رکھیں' : 'Continue Offline'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Full Name (Sign Up only) */}
            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {isUrdu ? 'پورا نام' : 'Full Name'}
                </Text>
                <View style={[
                  styles.inputWrapper,
                  errors.fullName ? styles.inputWrapperError : null
                ]}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={errors.fullName ? '#DC2626' : Colors.light.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={fullName}
                    onChangeText={(text) => {
                      setFullName(text);
                      clearError('fullName');
                    }}
                    placeholder={isUrdu ? 'اپنا نام درج کریں' : 'Enter your full name'}
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    editable={submitStatus !== 'sending'}
                  />
                </View>
                {errors.fullName && (
                  <View style={styles.errorRow}>
                    <Ionicons name="warning-outline" size={14} color="#DC2626" />
                    <Text style={styles.errorText}>{errors.fullName}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {isUrdu ? 'موبائل نمبر' : 'Mobile Number'}
              </Text>
              <View style={[
                styles.inputWrapper,
                errors.phoneNumber ? styles.inputWrapperError : null
              ]}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+92</Text>
                </View>
                <TextInput
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    clearError('phoneNumber');
                  }}
                  placeholder={isUrdu ? '3XX XXXXXXX' : '3XX XXXXXXX'}
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  style={[styles.textInput, { paddingLeft: 4 }]}
                  editable={submitStatus !== 'sending'}
                />
              </View>
              {errors.phoneNumber && (
                <View style={styles.errorRow}>
                  <Ionicons name="warning-outline" size={14} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                </View>
              )}
            </View>

            {/* District Chips with Icons + Manual "Other" Fallback (Sign Up only) */}
            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {isUrdu ? 'ضلع / علاقہ' : 'District / Region'}
                </Text>
                <View style={styles.districtChips}>
                  {['Faisalabad', 'Lahore', 'Multan', 'Sahiwal', 'Sargodha', 'Sheikhupura'].map((d) => {
                    const isSelected = !isOtherDistrict && district === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        onPress={() => {
                          setIsOtherDistrict(false);
                          setDistrict(d);
                          clearError('district');
                        }}
                        style={[
                          styles.districtChip,
                          isSelected && styles.districtChipActive,
                        ]}
                        activeOpacity={0.75}
                        disabled={submitStatus === 'sending'}>
                        <Ionicons
                          name={isSelected ? 'location' : 'location-outline'}
                          size={13}
                          color={isSelected ? Colors.light.primaryDark : Colors.light.textMuted}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[
                          styles.districtChipText,
                          isSelected && styles.districtChipTextActive,
                        ]}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    onPress={() => {
                      setIsOtherDistrict(true);
                      setDistrict('');
                      clearError('district');
                    }}
                    style={[
                      styles.districtChip,
                      isOtherDistrict && styles.districtChipActive,
                    ]}
                    activeOpacity={0.75}
                    disabled={submitStatus === 'sending'}>
                    <Ionicons
                      name="create-outline"
                      size={13}
                      color={isOtherDistrict ? Colors.light.primaryDark : Colors.light.textMuted}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[
                      styles.districtChipText,
                      isOtherDistrict && styles.districtChipTextActive,
                    ]}>
                      {isUrdu ? 'دیگر ضلع' : 'Other'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {isOtherDistrict && (
                  <View style={[styles.inputWrapper, { marginTop: 8 }, errors.district ? styles.inputWrapperError : null]}>
                    <Ionicons name="map-outline" size={18} color={Colors.light.textMuted} style={styles.inputIcon} />
                    <TextInput
                      value={district}
                      onChangeText={(text) => {
                        setDistrict(text);
                        clearError('district');
                      }}
                      placeholder={isUrdu ? 'اپنے ضلع کا نام لکھیں' : 'Type your district name (e.g. Okara, Gujranwala)'}
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      editable={submitStatus !== 'sending'}
                    />
                  </View>
                )}
                {errors.district && (
                  <View style={styles.errorRow}>
                    <Ionicons name="warning-outline" size={14} color="#DC2626" />
                    <Text style={styles.errorText}>{errors.district}</Text>
                  </View>
                )}
              </View>
            )}

            {/* PIN / Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {isUrdu ? 'پن کوڈ' : 'PIN / Password'}
              </Text>
              <View style={[
                styles.inputWrapper,
                errors.pin ? styles.inputWrapperError : null
              ]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={errors.pin ? '#DC2626' : Colors.light.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={pin}
                  onChangeText={(text) => {
                    setPin(text);
                    clearError('pin');
                  }}
                  placeholder={isUrdu ? '4 ہندسوں کا پن' : 'Enter 4-digit PIN'}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPin}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.textInput}
                  editable={submitStatus !== 'sending'}
                />
                <TouchableOpacity
                  onPress={() => setShowPin(!showPin)}
                  style={styles.eyeBtn}
                  disabled={submitStatus === 'sending'}>
                  <Ionicons
                    name={showPin ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.light.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {errors.pin && (
                <View style={styles.errorRow}>
                  <Ionicons name="warning-outline" size={14} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.pin}</Text>
                </View>
              )}
            </View>

            {/* Progressive Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitStatus === 'sending' || submitStatus === 'success'}
              style={[
                styles.submitBtn,
                submitStatus === 'sending' && styles.submitBtnSending,
                submitStatus === 'success' && styles.submitBtnSuccess,
              ]}
              activeOpacity={0.85}>
              {getButtonContent()}
            </TouchableOpacity>

          </View>

          {/* Bottom Switch */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === 'login'
                ? (isUrdu ? 'نئے ہیں؟' : "Don't have an account?")
                : (isUrdu ? 'پہلے سے اکاؤنٹ ہے؟' : 'Already have an account?')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (submitStatus === 'sending') return;
                setMode(mode === 'login' ? 'signup' : 'login');
                setErrors({});
                setBackendError(null);
              }}>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 64,
  },

  // ─── Hero ─────────────────────────────────
  heroSection: {
    position: 'relative',
    overflow: 'hidden',
  },
  heroGradient: {
    backgroundColor: '#F0FDF4',
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(22, 163, 74, 0.10)',
  },
  logoHalo: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(22, 163, 74, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  trustPillText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: '#15803D',
  },
  heroTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 28,
    color: Colors.light.text,
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    color: Colors.light.textCaption,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxxl,
    maxWidth: 420,
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
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  langBtnActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
    ...PrimaryButtonShadow,
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
    ...CardStyle,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
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
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginLeft: 2,
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#DC2626',
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
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  districtChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  districtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: '#F8FAFC',
  },
  districtChipActive: {
    backgroundColor: Colors.light.primarySubtle,
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

  // ─── Backend Error Banner ─────────────────
  errorBanner: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  errorBannerUnreachable: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  errorBannerGeneric: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  errorBannerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
  },
  errorBannerMessage: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  devHintText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorBannerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 10,
    alignItems: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  retryBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  offlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  offlineBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: '#DC2626',
  },

  // ─── Submit Button & Progressive States ────
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
    ...PrimaryButtonShadow,
  },
  submitBtnSending: {
    backgroundColor: '#15803D',
    opacity: 0.9,
  },
  submitBtnSuccess: {
    backgroundColor: '#059669',
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
