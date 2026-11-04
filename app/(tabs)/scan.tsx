import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import { Accelerometer } from 'expo-sensors';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { useApp } from '@/context/app-context';
import { FontFamily, Spacing, Radius, STAGE_CONFIG } from '@/constants/theme';
import {
  useApiServerConfig,
  usePredictGrowthStage,
  useServerHealth,
  getConfidenceBadgeColor,
} from '@/hooks/use-growth-stage';
import { GrowthStagePrediction } from '@/services/growth-stage-api';

export default function CameraScanScreen() {
  const {
    selectedField,
    addScanObservation,
    t,
    language,
    fontMultiplier,
    playingAudioId,
    playAudio,
  } = useApp();

  const isUrdu = language === 'ur';

  // ─── Backend AI API & Hardware Telemetry ─────────────────────────────────
  const { baseUrl, setBaseUrl } = useApiServerConfig();
  const { isOnline, latencyMs, refetch: refetchHealth } = useServerHealth(baseUrl);
  const predictMutation = usePredictGrowthStage(baseUrl);

  // ─── Camera Hardware State ───────────────────────────────────────────────
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const cameraRef = useRef<CameraView>(null);

  const isFocused = useIsFocused();

  // ─── Sensor Downward Pitch Angle ─────────────────────────────────────────
  // Target sweet spot: 45° to 60°
  const [downwardAngle, setDownwardAngle] = useState<number>(52);
  const isAngleGood = downwardAngle >= 45 && downwardAngle <= 60;
  const prevAngleGoodRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isFocused) {
      prevAngleGoodRef.current = false;
      return;
    }

    Accelerometer.setUpdateInterval(100);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      // Downward angle relative to ground:
      // In portrait: screen facing user, rear camera pointing down towards wheat canopy.
      const pitchRad = Math.atan2(Math.abs(z), Math.sqrt(x * x + y * y));
      const pitchDeg = Math.round((pitchRad * 180) / Math.PI);
      const clamped = Math.max(0, Math.min(90, pitchDeg));
      setDownwardAngle(clamped);

      // Light haptic feedback once entering the good range (only when active screen)
      const inRange = clamped >= 45 && clamped <= 60;
      if (inRange && !prevAngleGoodRef.current) {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
      prevAngleGoodRef.current = inRange;
    });

    return () => {
      subscription.remove();
    };
  }, [isFocused]);

  // ─── Analysis & Prediction State ─────────────────────────────────────────
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<GrowthStagePrediction | null>(null);
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [showResultSheet, setShowResultSheet] = useState(false);
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [tempUrlInput, setTempUrlInput] = useState(baseUrl);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  const isCameraAudioActive = playingAudioId === 'camera_guidance';
  const isResultAudioActive = playingAudioId === 'result_advice';

  // ─── Inference Invocation ────────────────────────────────────────────────
  const runAiAnalysis = (imageUri: string) => {
    setCapturedImageUri(imageUri);
    setPrediction(null);
    setInferenceError(null);
    setShowResultSheet(true);

    predictMutation.mutate(
      {
        imageUri,
        fieldId: selectedField.id,
        cropType: 'wheat',
      },
      {
        onSuccess: (data) => {
          setPrediction(data);
          setInferenceError(null);
        },
        onError: (err) => {
          setInferenceError(err.message || 'AI backend server error');
        },
      }
    );
  };

  // ─── Capture via Camera ──────────────────────────────────────────────────
  const handleCapturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (photo?.uri) {
        runAiAnalysis(photo.uri);
      }
    } catch (err: any) {
      Alert.alert(
        isUrdu ? 'کیمرہ ایرر' : 'Camera Error',
        err?.message || 'Could not capture photo. Try choosing from gallery.'
      );
    }
  };

  // ─── Pick from Device Gallery ────────────────────────────────────────────
  const handlePickGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        runAiAnalysis(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err?.message || 'Could not open image library');
    }
  };

  // ─── Save Observation to Selected Field ──────────────────────────────────
  const handleSaveObservation = () => {
    if (!prediction || !capturedImageUri) return;

    addScanObservation({
      stageIndex: prediction.stage_index,
      stageName: isUrdu ? prediction.advisory.display_name : prediction.stage_name,
      confidence: prediction.confidence,
      imageUri: capturedImageUri,
      sharpnessScore: 95,
      angleScore: downwardAngle,
    });

    setSaveSuccessToast(true);
    setTimeout(() => {
      setSaveSuccessToast(false);
      setShowResultSheet(false);
      router.push('/(tabs)');
    }, 1500);
  };

  // ─── Save Server URL ─────────────────────────────────────────────────────
  const handleSaveServerUrl = () => {
    if (tempUrlInput.trim()) {
      setBaseUrl(tempUrlInput.trim());
      setIsServerSettingsOpen(false);
      setTimeout(() => refetchHealth(), 300);
    }
  };

  // Active Stage Color Badge
  const activeStageConfig = prediction
    ? STAGE_CONFIG[prediction.stage_index] || STAGE_CONFIG[0]
    : STAGE_CONFIG[0];
  const badgeColors = prediction
    ? getConfidenceBadgeColor(prediction.confidence_rating, prediction.confidence)
    : null;

  // ─── Fallback Permission Screen ──────────────────────────────────────────
  if (permission && !permission.granted && Platform.OS !== 'web') {
    return (
      <SafeAreaView style={styles.permissionSafeArea}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionIconCircle}>
            <Ionicons name="camera-outline" size={42} color="#16A34A" />
          </View>
          <Text style={[styles.permissionTitle, { fontSize: 20 * fontMultiplier }]}>
            {t.cameraPermissionTitle}
          </Text>
          <Text style={[styles.permissionDesc, { fontSize: 13.5 * fontMultiplier }]}>
            {t.cameraPermissionDesc}
          </Text>

          <TouchableOpacity
            style={styles.grantPermBtn}
            onPress={requestPermission}
            activeOpacity={0.85}>
            <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.grantPermBtnText}>{t.grantPermission}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permGalleryBtn}
            onPress={handlePickGallery}
            activeOpacity={0.8}>
            <Ionicons name="images-outline" size={18} color="#16A34A" style={{ marginRight: 6 }} />
            <Text style={styles.permGalleryBtnText}>{t.chooseFromGallery}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permBackBtn}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}>
            <Text style={styles.permBackBtnText}>{t.cancel}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* ─── Real Camera Viewfinder ─── */}
      <View style={styles.cameraContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.webFallbackContainer}>
            <Ionicons name="camera-reverse-outline" size={64} color="#16A34A" />
            <Text style={styles.webFallbackTitle}>
              {isUrdu ? 'ویب براؤزر کیمرہ موڈ' : 'Web Camera Environment'}
            </Text>
            <Text style={styles.webFallbackSubtitle}>
              {isUrdu
                ? 'براہ کرم گندم کے کھیت کی تصویر گیلری یا فائل سے منتخب کریں'
                : 'Upload or capture a wheat photo to run live FoMo4Wheat ViT inference'}
            </Text>
            <TouchableOpacity style={styles.webPickBtn} onPress={handlePickGallery} activeOpacity={0.85}>
              <Ionicons name="images" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.webPickBtnText}>{t.chooseFromGallery}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing={facing}
            flash={flash}
          />
        )}

        {/* ─── Top Control Bar ─── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Selected Field Tag */}
          <View style={styles.fieldTag}>
            <View style={styles.fieldTagDot} />
            <Text style={styles.fieldTagText}>{selectedField.code}</Text>
          </View>

          {/* Live Server Health Indicator (Tappable for Server Settings) */}
          <TouchableOpacity
            style={[styles.serverStatusPill, isOnline ? styles.serverOnline : styles.serverOffline]}
            onPress={() => {
              setTempUrlInput(baseUrl);
              setIsServerSettingsOpen(true);
            }}
            activeOpacity={0.8}>
            <View style={[styles.serverDot, isOnline ? styles.dotGreen : styles.dotAmber]} />
            <View>
              <Text style={styles.serverStatusText}>
                {isOnline ? 'AI Online' : 'AI Offline'}
              </Text>
              {latencyMs !== null && (
                <Text style={styles.latencySubText}>{latencyMs}ms</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Audio Spoken Guide for Farmer */}
          <TouchableOpacity
            style={[styles.audioPillBtn, isCameraAudioActive && styles.audioPillBtnActive]}
            onPress={() => playAudio('camera_guidance')}
            activeOpacity={0.8}>
            <Ionicons
              name={isCameraAudioActive ? 'volume-high' : 'volume-medium-outline'}
              size={15}
              color={isCameraAudioActive ? '#FFFFFF' : '#15803D'}
            />
            <Text style={[styles.audioPillText, isCameraAudioActive && styles.audioPillTextActive]}>
              {isCameraAudioActive ? t.stop : t.listen}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── Framing Guide & Real Downward Angle Sensor (45°–60°) ─── */}
        <View style={styles.frameContainer}>
          <View style={[styles.frameBox, isAngleGood && styles.frameBoxGood]}>
            {/* Viewfinder Corner brackets */}
            <View style={[styles.corner, styles.cornerTL, isAngleGood && styles.cornerGood]} />
            <View style={[styles.corner, styles.cornerTR, isAngleGood && styles.cornerGood]} />
            <View style={[styles.corner, styles.cornerBL, isAngleGood && styles.cornerGood]} />
            <View style={[styles.corner, styles.cornerBR, isAngleGood && styles.cornerGood]} />

            {/* Center crosshair */}
            <View style={[styles.crosshairH, isAngleGood && styles.crosshairGood]} />
            <View style={[styles.crosshairV, isAngleGood && styles.crosshairGood]} />
          </View>

          {/* Dynamic Guidance Pill: Good to Go (45°–60°) vs Tilt Directions */}
          <View style={[styles.guidePill, isAngleGood ? styles.guidePillGood : styles.guidePillWarning]}>
            <Ionicons
              name={isAngleGood ? 'checkmark-circle' : 'compass-outline'}
              size={16}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.guidePillText, { fontSize: 12.5 * fontMultiplier }]}>
              {isAngleGood
                ? t.angleGoodBadge
                : downwardAngle < 45
                ? `${downwardAngle}° · ${t.tiltCameraDown}`
                : `${downwardAngle}° · ${t.tiltCameraUp}`}
            </Text>
          </View>

          {/* Live Angle Badge (Tap to test simulate angles on web/emulator) */}
          <TouchableOpacity
            style={[styles.angleBadge, isAngleGood ? styles.angleBadgeGood : styles.angleBadgeWarning]}
            onPress={() => setDownwardAngle((prev) => (prev === 52 ? 35 : prev === 35 ? 70 : 52))}
            activeOpacity={0.8}>
            <Ionicons name="speedometer-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.angleBadgeText}>{downwardAngle}°</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Bottom Shutter & Controls ─── */}
        <View style={styles.bottomArea}>
          <View style={styles.shutterRow}>
            {/* Gallery Upload */}
            <TouchableOpacity style={styles.sideControlBtn} onPress={handlePickGallery} activeOpacity={0.8}>
              <Ionicons name="images-outline" size={22} color="#FFFFFF" />
              <Text style={styles.sideControlText}>{t.chooseFromGallery}</Text>
            </TouchableOpacity>

            {/* Shutter Capture Button */}
            <TouchableOpacity
              onPress={handleCapturePhoto}
              style={[styles.shutterOuter, isAngleGood && styles.shutterOuterGood]}
              activeOpacity={0.85}>
              <View style={[styles.shutterInner, isAngleGood && styles.shutterInnerGood]}>
                <Ionicons name="camera" size={30} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Camera Flip / Flash Control */}
            <View style={styles.rightControlsCol}>
              <TouchableOpacity
                style={styles.miniToolBtn}
                onPress={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
                activeOpacity={0.8}>
                <Ionicons name="camera-reverse-outline" size={19} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.miniToolBtn, flash === 'on' && styles.miniToolBtnActive]}
                onPress={() => setFlash((prev) => (prev === 'off' ? 'on' : 'off'))}
                activeOpacity={0.8}>
                <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.shutterHint, { fontSize: 11.5 * fontMultiplier }]}>
            {t.holdSteadyHint}
          </Text>
        </View>
      </View>

      {/* ─── AI Prediction Result Modal Sheet ─── */}
      <Modal visible={showResultSheet} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { fontSize: 17 * fontMultiplier }]}>
                  {t.cropStageResult}
                </Text>
                <Text style={styles.modalSubtitle}>FoMo4Wheat ViT-B/14 · {selectedField.code}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowResultSheet(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Content Body */}
            {predictMutation.isPending ? (
              <View style={styles.inferenceLoadingBox}>
                <ActivityIndicator size="large" color="#16A34A" />
                <Text style={styles.loadingTitle}>{t.aiAnalyzing}</Text>
                <Text style={styles.loadingSubtitle}>
                  {isUrdu
                    ? 'گندم کے تصویری خدوخال کا کلاسیفائر ماڈل سے تجزیہ ہو رہا ہے...'
                    : 'Passing 518×518 canopy patch through vision transformer layers...'}
                </Text>
              </View>
            ) : inferenceError ? (
              <View style={styles.errorContainer}>
                <View style={styles.errorIconCircle}>
                  <Ionicons name="alert-circle" size={38} color="#DC2626" />
                </View>
                <Text style={styles.errorTitle}>
                  {isUrdu ? 'اے آئی سرور ایرر' : 'AI Inference Connection Error'}
                </Text>
                <Text style={styles.errorDesc}>{inferenceError}</Text>
                <Text style={styles.errorTargetUrl}>Server Target: {baseUrl}</Text>

                <View style={styles.errorActionsRow}>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => capturedImageUri && runAiAnalysis(capturedImageUri)}
                    activeOpacity={0.85}>
                    <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.retryBtnText}>Retry Analysis</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.configServerBtn}
                    onPress={() => setIsServerSettingsOpen(true)}
                    activeOpacity={0.85}>
                    <Ionicons name="settings-outline" size={16} color="#16A34A" style={{ marginRight: 6 }} />
                    <Text style={styles.configServerBtnText}>Server Settings</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : prediction ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Image Snapshot Preview */}
                {capturedImageUri && (
                  <View style={styles.resultImageWrap}>
                    <Image source={{ uri: capturedImageUri }} style={styles.resultImage} />
                    <View style={styles.resultImageTag}>
                      <Ionicons name="compass" size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.resultImageTagText}>{downwardAngle}° Downward Angle</Text>
                    </View>
                  </View>
                )}

                {/* Detected Stage Banner */}
                <View style={[styles.stageBannerCard, { borderColor: activeStageConfig.color }]}>
                  <View style={styles.stageBannerTop}>
                    <View
                      style={[
                        styles.confidenceBadge,
                        { backgroundColor: badgeColors?.bg, borderColor: badgeColors?.border },
                      ]}>
                      <View style={[styles.confDot, { backgroundColor: badgeColors?.badge }]} />
                      <Text style={[styles.confidenceBadgeText, { color: badgeColors?.text }]}>
                        {(prediction.confidence * 100).toFixed(1)}% {t.confidenceMatch}
                      </Text>
                    </View>

                    <View style={styles.stageIndexPill}>
                      <Text style={styles.stageIndexText}>
                        {prediction.stage_index + 1} {t.ofSix}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.stageHeadingText, { fontSize: 21 * fontMultiplier }]}>
                    {isUrdu ? prediction.advisory.display_name : prediction.stage_name.toUpperCase()}
                  </Text>
                  <Text style={[styles.stageObjectiveText, { fontSize: 13 * fontMultiplier }]}>
                    {prediction.advisory.primary_objective}
                  </Text>

                  {/* Telemetry metadata */}
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryText}>
                      Latency: {prediction.model_metadata.inference_latency_ms}ms · Device: {prediction.model_metadata.device}
                    </Text>
                  </View>
                </View>

                {/* Probability Distribution */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeading}>{t.aiProbabilityDistribution}</Text>
                  {Object.entries(prediction.probabilities).map(([stageKey, prob]) => {
                    const pct = Math.round(prob * 100);
                    const isWinner = stageKey.toLowerCase() === prediction.stage_name.toLowerCase();
                    return (
                      <View key={stageKey} style={styles.probRow}>
                        <Text style={[styles.probLabel, isWinner && styles.probLabelWinner]}>
                          {stageKey.charAt(0).toUpperCase() + stageKey.slice(1)}
                        </Text>
                        <View style={styles.probBarTrack}>
                          <View
                            style={[
                              styles.probBarFill,
                              {
                                width: `${pct}%`,
                                backgroundColor: isWinner ? '#16A34A' : '#94A3B8',
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.probVal, isWinner && styles.probValWinner]}>{pct}%</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Agronomic Advisory Guide */}
                <View style={styles.sectionCard}>
                  <View style={styles.advisoryHeaderRow}>
                    <Text style={styles.sectionHeading}>{t.aiAgronomicAdvisory}</Text>
                    <TouchableOpacity
                      onPress={() => playAudio('result_advice')}
                      style={[styles.miniAudioBtn, isResultAudioActive && styles.miniAudioBtnActive]}
                      activeOpacity={0.8}>
                      <Ionicons
                        name={isResultAudioActive ? 'volume-high' : 'volume-medium-outline'}
                        size={14}
                        color={isResultAudioActive ? '#FFFFFF' : '#15803D'}
                      />
                      <Text style={[styles.miniAudioBtnText, isResultAudioActive && styles.miniAudioBtnTextActive]}>
                        {isResultAudioActive ? t.stop : t.listen}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Advisory Item: Water Management */}
                  <View style={styles.advisoryItem}>
                    <View style={[styles.advisoryDot, { backgroundColor: '#0284C7' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.advisoryItemTitle}>{t.aiWaterManagement}</Text>
                      <Text style={styles.advisoryItemBody}>{prediction.advisory.irrigation_guidance}</Text>
                    </View>
                  </View>

                  {/* Advisory Item: Nutrients */}
                  <View style={styles.advisoryItem}>
                    <View style={[styles.advisoryDot, { backgroundColor: '#16A34A' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.advisoryItemTitle}>{t.aiNutrientGuidance}</Text>
                      <Text style={styles.advisoryItemBody}>{prediction.advisory.nutrient_guidance}</Text>
                    </View>
                  </View>

                  {/* Advisory Item: Protection */}
                  <View style={styles.advisoryItem}>
                    <View style={[styles.advisoryDot, { backgroundColor: '#D97706' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.advisoryItemTitle}>{t.aiScoutingProtection}</Text>
                      <Text style={styles.advisoryItemBody}>{prediction.advisory.protection_guidance}</Text>
                    </View>
                  </View>

                  {/* Risk alerts */}
                  {prediction.advisory.risk_alerts.map((alertText, idx) => (
                    <View key={idx} style={styles.alertBox}>
                      <Ionicons name="warning-outline" size={15} color="#DC2626" style={{ marginRight: 6 }} />
                      <Text style={styles.alertText}>{alertText}</Text>
                    </View>
                  ))}
                </View>

                {/* Actions */}
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    onPress={handleSaveObservation}
                    style={styles.saveObservationBtn}
                    activeOpacity={0.85}>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveObservationBtnText}>
                      {saveSuccessToast ? 'Saved!' : t.saveToTimeline}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowResultSheet(false)}
                    style={styles.retakeBtn}
                    activeOpacity={0.8}>
                    <Text style={styles.retakeBtnText}>{t.retakePhoto}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ─── Server URL Configuration Modal ─── */}
      <Modal visible={isServerSettingsOpen} animationType="fade" transparent>
        <View style={styles.settingsModalOverlay}>
          <View style={styles.settingsModalCard}>
            <View style={styles.settingsHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="server-outline" size={20} color="#16A34A" />
                <Text style={styles.settingsTitle}>{t.aiServerSettings}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsServerSettingsOpen(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.settingsInputLabel}>{t.serverUrlLabel}</Text>
            <TextInput
              value={tempUrlInput}
              onChangeText={setTempUrlInput}
              placeholder="https://your-tunnel.link or http://192.168.1.X:8000"
              style={styles.serverTextInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.settingsActionsRow}>
              <TouchableOpacity
                style={styles.settingsSaveBtn}
                onPress={handleSaveServerUrl}
                activeOpacity={0.85}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.settingsSaveBtnText}>{t.saveServerUrl}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#000000',
  },

  // Web Fallback
  webFallbackContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  webFallbackTitle: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 14,
  },
  webFallbackSubtitle: {
    fontFamily: FontFamily.medium,
    color: '#94A3B8',
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 320,
  },
  webPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
    marginTop: 20,
  },
  webPickBtnText: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    fontSize: 13,
  },

  // ─── Top Bar ─────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    zIndex: 20,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 6,
  },
  fieldTagDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16A34A',
  },
  fieldTagText: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    fontSize: 12,
  },
  serverStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.full,
    gap: 5,
  },
  serverOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  serverOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  serverDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: {
    backgroundColor: '#10B981',
  },
  dotAmber: {
    backgroundColor: '#EF4444',
  },
  serverStatusText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  latencySubText: {
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    color: '#86EFAC',
  },
  audioPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 252, 231, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 4,
  },
  audioPillBtnActive: {
    backgroundColor: '#15803D',
  },
  audioPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#15803D',
  },
  audioPillTextActive: {
    color: '#FFFFFF',
  },

  // ─── Center Framing Guide ────────────────────────────────────────────────
  frameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  frameBox: {
    width: 250,
    height: 250,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameBoxGood: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  cornerGood: {
    borderColor: '#22C55E',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 6,
  },
  crosshairH: {
    position: 'absolute',
    width: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  crosshairV: {
    position: 'absolute',
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  crosshairGood: {
    backgroundColor: '#22C55E',
  },

  // Guidance Pill
  guidePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  guidePillGood: {
    backgroundColor: '#16A34A',
  },
  guidePillWarning: {
    backgroundColor: '#D97706',
  },
  guidePillText: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  // Angle Badge
  angleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  angleBadgeGood: {
    backgroundColor: 'rgba(22, 163, 74, 0.3)',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  angleBadgeWarning: {
    backgroundColor: 'rgba(217, 119, 6, 0.3)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  angleBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },

  // ─── Bottom Area ─────────────────────────────────────────────────────────
  bottomArea: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    zIndex: 20,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  sideControlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  sideControlText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuterGood: {
    borderColor: '#22C55E',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInnerGood: {
    backgroundColor: '#22C55E',
  },
  rightControlsCol: {
    width: 70,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  miniToolBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniToolBtnActive: {
    backgroundColor: '#EAB308',
  },
  shutterHint: {
    fontFamily: FontFamily.medium,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 14,
  },

  // ─── Modal Sheet (AI Result) ─────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  modalSubtitle: {
    fontFamily: FontFamily.medium,
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Inference Loader
  inferenceLoadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#0F172A',
    marginTop: 16,
  },
  loadingSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },

  // Error state
  errorContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  errorTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#991B1B',
  },
  errorDesc: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  errorTargetUrl: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 8,
  },
  errorActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  retryBtnText: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  configServerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  configServerBtnText: {
    fontFamily: FontFamily.bold,
    color: '#16A34A',
    fontSize: 12.5,
  },

  // Result Image Preview
  resultImageWrap: {
    height: 150,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginTop: 14,
    position: 'relative',
  },
  resultImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  resultImageTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resultImageTagText: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    fontSize: 10,
  },

  // Detected Stage Banner Card
  stageBannerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: 14,
    marginTop: 12,
  },
  stageBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 5,
  },
  confDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
  },
  stageIndexPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stageIndexText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#334155',
  },
  stageHeadingText: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    marginTop: 8,
  },
  stageObjectiveText: {
    fontFamily: FontFamily.medium,
    color: '#475569',
    marginTop: 4,
    lineHeight: 18,
  },
  telemetryRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  telemetryText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: '#64748B',
  },

  // Sections
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
    marginTop: 12,
  },
  sectionHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
  },

  // Probabilities
  probRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  probLabel: {
    width: 90,
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#64748B',
  },
  probLabelWinner: {
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  probBarTrack: {
    flex: 1,
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  probBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  probVal: {
    width: 38,
    textAlign: 'right',
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#64748B',
  },
  probValWinner: {
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },

  // Advisory Items
  advisoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  miniAudioBtnActive: {
    backgroundColor: '#16A34A',
  },
  miniAudioBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#15803D',
  },
  miniAudioBtnTextActive: {
    color: '#FFFFFF',
  },
  advisoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 5,
  },
  advisoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginRight: 8,
  },
  advisoryItemTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#0F172A',
  },
  advisoryItemBody: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    marginTop: 1,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  alertText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#991B1B',
    flex: 1,
    lineHeight: 15,
  },

  // Buttons in Modal
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  saveObservationBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: Radius.md,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  saveObservationBtnText: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    fontSize: 13.5,
  },
  retakeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  retakeBtnText: {
    fontFamily: FontFamily.bold,
    color: '#475569',
    fontSize: 12.5,
  },

  // ─── Server Configuration Modal ──────────────────────────────────────────
  settingsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  settingsModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 18,
    width: '100%',
    maxWidth: 420,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  settingsTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#0F172A',
  },
  settingsInputLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#475569',
    marginBottom: 6,
  },
  serverTextInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 14,
  },
  settingsActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  settingsSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  settingsSaveBtnText: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    fontSize: 12,
  },

  // ─── Permission Prompt ───────────────────────────────────────────────────
  permissionSafeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  permissionIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  permissionTitle: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionDesc: {
    fontFamily: FontFamily.medium,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  grantPermBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    width: '100%',
    paddingVertical: 12,
    borderRadius: Radius.md,
    marginBottom: 10,
  },
  grantPermBtnText: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  permGalleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#16A34A',
    width: '100%',
    paddingVertical: 11,
    borderRadius: Radius.md,
    marginBottom: 10,
  },
  permGalleryBtnText: {
    fontFamily: FontFamily.bold,
    color: '#16A34A',
    fontSize: 13.5,
  },
  permBackBtn: {
    paddingVertical: 8,
  },
  permBackBtnText: {
    fontFamily: FontFamily.medium,
    color: '#64748B',
    fontSize: 12.5,
  },
});
