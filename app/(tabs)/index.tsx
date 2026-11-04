import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp } from '@/context/app-context';
import { Colors, STAGE_CONFIG, FontFamily, Spacing, Radius, CardStyle } from '@/constants/theme';
import { AccessibilityControls, AudioMiniPlayer } from '@/components/accessibility-bar';
import { StartCycleModal } from '@/components/start-cycle-modal';

export default function DashboardScreen() {
  const theme = Colors.light;
  const {
    fields,
    selectedField,
    setSelectedFieldId,
    t,
    language,
    fontMultiplier,
    playingAudioId,
    playAudio,
  } = useApp();

  const [isStartCycleOpen, setIsStartCycleOpen] = useState(false);
  const [inspectedStageIndex, setInspectedStageIndex] = useState<number | null>(null);

  const activeStageIndex = selectedField.currentStageIndex;
  const currentStage = STAGE_CONFIG[activeStageIndex];
  const displayedStageIndex = inspectedStageIndex !== null ? inspectedStageIndex : activeStageIndex;
  const displayedStage = STAGE_CONFIG[displayedStageIndex];

  // Localized stage names
  const stageNames: Record<number, string> = {
    0: t.stage0Name,
    1: t.stage1Name,
    2: t.stage2Name,
    3: t.stage3Name,
    4: t.stage4Name,
    5: t.stage5Name,
  };

  const stageDescs: Record<number, string> = {
    0: t.stage0Desc,
    1: t.stage1Desc,
    2: t.stage2Desc,
    3: t.stage3Desc,
    4: t.stage4Desc,
    5: t.stage5Desc,
  };

  const isAudioActive = playingAudioId === 'dashboard_advice';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ─── Modern Top Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="sprout" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.brandTextCol}>
              <View style={styles.appNameRow}>
                <Text numberOfLines={1} style={[styles.appName, { fontSize: 15 * fontMultiplier }]}>
                  NextGenYield
                </Text>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>AI</Text>
                </View>
              </View>
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.appLocation, { fontSize: 10.5 * fontMultiplier }]}>
                {language === 'ur' ? '📍 مصطفیٰ ٹاؤن · 28°C ☀️' : '📍 Mustafa Town · 28°C ☀️'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            <AccessibilityControls />
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              style={styles.profileAvatarBtn}
              activeOpacity={0.8}
              accessibilityLabel="Farmer Profile">
              <View style={styles.profileAvatarCircle}>
                <Ionicons name="person" size={13} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Field Switcher Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fieldChipsList}>
          {fields.map((f) => {
            const active = f.id === selectedField.id;
            const isFallow = f.cycleStatus === 'not_started';
            const varietyLabel = isFallow
              ? (language === 'ur' ? 'تیار زمین' : 'Fallow')
              : f.wheatVariety;

            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => {
                  setInspectedStageIndex(null);
                  setSelectedFieldId(f.id);
                }}
                style={[styles.fieldCardChip, active && styles.fieldCardChipActive]}
                activeOpacity={0.7}>
                <View style={styles.fieldChipHeader}>
                  <View style={[styles.fieldStatusDot, { backgroundColor: isFallow ? '#D97706' : (active ? '#16A34A' : '#94A3B8') }]} />
                  <Text style={[styles.fieldChipCode, active && styles.fieldChipCodeActive, { fontSize: 12 * fontMultiplier }]}>
                    {f.code}
                  </Text>
                  <View style={[styles.acresBadge, active && styles.acresBadgeActive]}>
                    <Text style={[styles.acresText, active && styles.acresTextActive]}>
                      {f.areaAcres} ac
                    </Text>
                  </View>
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.fieldChipVariety, active && styles.fieldChipVarietyActive, { fontSize: 11 * fontMultiplier }]}>
                  {varietyLabel}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Quick Add Field Button */}
          <TouchableOpacity
            onPress={() => router.push('/map')}
            style={styles.addFieldChip}
            activeOpacity={0.7}>
            <Ionicons name="add" size={16} color="#16A34A" />
            <Text style={[styles.addFieldText, { fontSize: 11 * fontMultiplier }]}>
              {language === 'ur' ? 'نیا کھیت' : '+ Add Field'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ─── Scroll Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {selectedField.cycleStatus === 'not_started' ? (
          /* ─── Fallow / Unstarted Cycle Card ─── */
          <View style={styles.fallowCard}>
            <View style={styles.fallowAccentBar} />
            <View style={styles.fallowContent}>
              <View style={styles.fallowHeader}>
                <View style={styles.fallowIconCircle}>
                  <MaterialCommunityIcons name="seed-outline" size={26} color="#D97706" />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <View style={styles.fallowBadge}>
                    <Text style={styles.fallowBadgeText}>
                      {language === 'ur' ? 'فصل شروع نہیں ہوئی' : 'CYCLE NOT STARTED'}
                    </Text>
                  </View>
                  <Text style={[styles.fallowTitle, { fontSize: 18 * fontMultiplier }]}>
                    {selectedField.displayName}
                  </Text>
                  <Text style={styles.fallowSub}>
                    {selectedField.areaAcres} Acres · {selectedField.soilTexture}
                  </Text>
                </View>
              </View>

              <Text style={[styles.fallowDesc, { fontSize: 13 * fontMultiplier }]}>
                {language === 'ur'
                  ? 'اس کھیت کی باؤنڈری محفوظ ہے اور زمین بوائی کے لیے تیار ہے۔ بیج کی قسم اور کھاد کمپنی منتخب کر کے 140 دن کا دورانیہ شروع کریں۔'
                  : 'This field boundary is registered and ready for sowing. Choose your wheat seed variety and fertilizer company once to activate your 140-day schedule.'}
              </Text>

              <TouchableOpacity
                onPress={() => setIsStartCycleOpen(true)}
                style={styles.startCycleButton}
                activeOpacity={0.85}>
                <MaterialCommunityIcons name="sprout" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={[styles.startCycleButtonText, { fontSize: 15 * fontMultiplier }]}>
                  {language === 'ur' ? 'فصل کا دورانیہ شروع کریں' : 'Start Crop Cycle'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ─── Hero Command Center: Growth Stage Card ─── */
          <View style={styles.heroCard}>
            {/* Top accent bar matching stage color */}
            <View style={[styles.stageAccentBar, { backgroundColor: currentStage.color }]} />

            <View style={styles.heroCardContent}>
              {/* Card Meta Row */}
              <View style={styles.stageHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.stageStatusPillRow}>
                    <View style={[styles.stageLiveDot, { backgroundColor: currentStage.color }]} />
                    <Text style={styles.stageCardOverline}>
                      {language === 'ur' ? 'موجودہ مرحلہ نمو' : 'CURRENT GROWTH STAGE'}
                    </Text>
                  </View>
                  <Text style={[styles.stageName, { color: currentStage.color, fontSize: 26 * fontMultiplier }]}>
                    {stageNames[displayedStageIndex]}
                  </Text>
                </View>

                <View style={styles.stageMeta}>
                  <View style={[styles.stageBadge, { backgroundColor: currentStage.lightBg }]}>
                    <Text style={[styles.stageBadgeText, { color: currentStage.color }]}>
                      {t.stagePrefix} {displayedStage.index + 1} {t.ofSix}
                    </Text>
                  </View>
                  <View style={styles.dasBadge}>
                    <Ionicons name="calendar-outline" size={11} color="#64748B" style={{ marginRight: 3 }} />
                    <Text style={styles.dasText}>
                      Day 78 / 140 (56%)
                    </Text>
                  </View>
                </View>
              </View>

              {/* Stage Description */}
              <Text style={[styles.stageSummaryText, { fontSize: 13.5 * fontMultiplier, lineHeight: 20 * fontMultiplier }]}>
                {stageDescs[displayedStageIndex]}
              </Text>

              {/* Interactive 6-step connected progress bar */}
              <View style={styles.progressContainer}>
                {/* Background track */}
                <View style={styles.progressTrack} />
                {/* Filled track up to current active stage */}
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(activeStageIndex / 5) * 100}%`,
                      backgroundColor: currentStage.color,
                    },
                  ]}
                />

                {/* Stage Steps */}
                <View style={styles.stepTrack}>
                  {STAGE_CONFIG.map((stage, idx) => {
                    const isPast = idx < activeStageIndex;
                    const isCurrent = idx === activeStageIndex;
                    const isSelected = idx === displayedStageIndex;

                    return (
                      <TouchableOpacity
                        key={stage.key}
                        onPress={() => setInspectedStageIndex(idx)}
                        style={styles.stepItem}
                        activeOpacity={0.7}>
                        <View
                          style={[
                            styles.stepDot,
                            isCurrent && {
                              backgroundColor: stage.color,
                              borderColor: '#FFFFFF',
                              borderWidth: 2.5,
                              width: 26,
                              height: 26,
                              borderRadius: 13,
                              shadowColor: stage.color,
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.35,
                              shadowRadius: 4,
                              elevation: 4,
                            },
                            isPast && { backgroundColor: theme.primary },
                            !isPast && !isCurrent && { backgroundColor: '#E2E8F0' },
                            isSelected && !isCurrent && { borderWidth: 2, borderColor: stage.color },
                          ]}>
                          {isPast ? (
                            <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                          ) : (
                            <Text style={[styles.stepDotNum, isCurrent && { color: '#FFFFFF' }]}>
                              {idx + 1}
                            </Text>
                          )}
                        </View>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.stepLabel,
                            isCurrent && { color: stage.color, fontFamily: FontFamily.bold },
                            isSelected && !isCurrent && { color: '#0F172A', fontFamily: FontFamily.semiBold },
                            { fontSize: 9.5 * fontMultiplier },
                          ]}>
                          {language === 'ur' ? `${idx + 1}` : stage.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ─── Regional Weather & Forecast Grid ─── */}
              <View style={styles.telemetryGrid}>
                {/* 1. Temperature */}
                <View style={styles.telemetryItem}>
                  <View style={[styles.telemetryIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="thermometer" size={15} color="#D97706" />
                  </View>
                  <Text numberOfLines={1} style={[styles.telemetryValue, { fontSize: 13 * fontMultiplier }]}>
                    28°C
                  </Text>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.telemetryLabel, { fontSize: 10 * fontMultiplier }]}>
                    {language === 'ur' ? 'درجہ حرارت' : 'Temp · Sunny'}
                  </Text>
                </View>

                <View style={styles.telemetryDivider} />

                {/* 2. Wind Speed */}
                <View style={styles.telemetryItem}>
                  <View style={[styles.telemetryIcon, { backgroundColor: '#E0F2FE' }]}>
                    <MaterialCommunityIcons name="weather-windy" size={15} color="#0284C7" />
                  </View>
                  <Text numberOfLines={1} style={[styles.telemetryValue, { fontSize: 13 * fontMultiplier }]}>
                    9 km/h
                  </Text>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.telemetryLabel, { fontSize: 10 * fontMultiplier }]}>
                    {language === 'ur' ? 'پرسکون ہوا' : 'Wind · Calm'}
                  </Text>
                </View>

                <View style={styles.telemetryDivider} />

                {/* 3. Rain / Weather Prediction */}
                <View style={styles.telemetryItem}>
                  <View style={[styles.telemetryIcon, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="rainy-outline" size={15} color="#16A34A" />
                  </View>
                  <Text numberOfLines={1} style={[styles.telemetryValue, { fontSize: 13 * fontMultiplier }]}>
                    0% Rain
                  </Text>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.telemetryLabel, { fontSize: 10 * fontMultiplier }]}>
                    {language === 'ur' ? '5 دن خشک' : '5-Day Dry'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── Actionable Advice ("What to do right now") ─── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeadingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionHeading, { fontSize: 18 * fontMultiplier }]}>
                {t.whatToDoNow}
              </Text>
              <Text style={[styles.sectionSub, { fontSize: 12 * fontMultiplier }]}>
                {t.guidanceFor} {stageNames[selectedField.currentStageIndex]}
              </Text>
            </View>

            {/* Voice Audio Readout Button */}
            <TouchableOpacity
              onPress={() => playAudio('dashboard_advice')}
              style={[styles.voiceButton, isAudioActive && styles.voiceButtonActive]}
              activeOpacity={0.8}>
              <Ionicons
                name={isAudioActive ? 'volume-high' : 'volume-medium-outline'}
                size={16}
                color={isAudioActive ? '#FFFFFF' : '#15803D'}
              />
              <Text style={[styles.voiceButtonText, isAudioActive && styles.voiceButtonTextActive]}>
                {isAudioActive ? t.stop : (language === 'ur' ? 'سنیں (آواز)' : 'Listen')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.adviceList}>
            {/* 1. Irrigation Advice Card */}
            <View style={styles.irrigationCard}>
              <View style={styles.adviceHeaderRow}>
                <View style={styles.adviceIconWrapBlue}>
                  <Ionicons name="water" size={18} color="#0284C7" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={styles.priorityBadgeBlue}>
                    <Text style={styles.priorityTextBlue}>CRITICAL WATERING WINDOW</Text>
                  </View>
                  <Text style={[styles.adviceTitle, { fontSize: 15 * fontMultiplier }]}>{t.irrigation}</Text>
                </View>
              </View>
              <Text style={[styles.adviceBody, { fontSize: 13 * fontMultiplier, lineHeight: 19 * fontMultiplier }]}>
                {language === 'ur'
                  ? 'گوبھ کا مرحلہ پانی کے لیے نہایت اہم ہے۔ زمین میں نمی برقرار رکھیں تاکہ سٹے میں دانوں کی تعداد کم نہ ہو۔'
                  : selectedField.advisory.irrigationGuidance}
              </Text>
            </View>

            {/* 2. Fertilizer Advice Card */}
            <View style={styles.fertilizerCard}>
              <View style={styles.adviceHeaderRow}>
                <View style={styles.adviceIconWrapGreen}>
                  <Ionicons name="nutrition" size={18} color="#16A34A" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={styles.priorityBadgeGreen}>
                    <Text style={styles.priorityTextGreen}>NUTRIENT MANAGEMENT</Text>
                  </View>
                  <Text style={[styles.adviceTitle, { fontSize: 15 * fontMultiplier }]}>{t.fertilizer}</Text>
                </View>
              </View>
              <Text style={[styles.adviceBody, { fontSize: 13 * fontMultiplier, lineHeight: 19 * fontMultiplier }]}>
                {language === 'ur'
                  ? 'اس مرحلے پر یوریا کھاد کا اضافی استعمال مت کریں تاکہ پودا گرنے سے محفوظ رہے، اور جھنڈا پتے کی صحت کا خیال رکھیں۔'
                  : selectedField.advisory.nutrientGuidance}
              </Text>
            </View>

            {/* 3. Disease Alert Card */}
            <View style={styles.diseaseCard}>
              <View style={styles.adviceHeaderRow}>
                <View style={styles.adviceIconWrapAmber}>
                  <Ionicons name="warning" size={18} color="#D97706" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={styles.priorityBadgeAmber}>
                    <Text style={styles.priorityTextAmber}>ACTIVE SCOUTING ALERT</Text>
                  </View>
                  <Text style={[styles.adviceTitle, { fontSize: 15 * fontMultiplier }]}>{t.diseaseWatch}</Text>
                </View>
              </View>
              <Text style={[styles.adviceBody, { fontSize: 13 * fontMultiplier, lineHeight: 19 * fontMultiplier }]}>
                {language === 'ur'
                  ? 'پتوں پر زرد کنگی (دھبے / پاؤڈر) کا معائنہ کریں اور صبح کی دھند میں روزانہ چیک کریں۔'
                  : selectedField.advisory.riskAlerts[0]}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Quick Scan Action Banner ─── */}
        <TouchableOpacity
          onPress={() => router.push('/scan')}
          style={styles.quickScanBanner}
          activeOpacity={0.85}>
          <View style={styles.quickScanLeft}>
            <View style={styles.quickScanIconCircle}>
              <Ionicons name="camera" size={22} color="#16A34A" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.quickScanTitle, { fontSize: 15 * fontMultiplier }]}>
                {language === 'ur' ? 'کھیت کی نئی تصویر اسکین کریں' : 'Capture Field Photo'}
              </Text>
              <Text style={[styles.quickScanSubtitle, { fontSize: 12 * fontMultiplier }]}>
                {language === 'ur' ? 'AI سے گندم کا مرحلہ اور بیماری چیک کریں' : 'AI Crop Growth & Disease Verification'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#16A34A" />
        </TouchableOpacity>

        {/* ─── Field History Timeline ─── */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionHeading, { fontSize: 18 * fontMultiplier }]}>{t.fieldHistory}</Text>
              <Text style={[styles.sectionSub, { fontSize: 12 * fontMultiplier }]}>
                {selectedField.wheatVariety} · {language === 'ur' ? 'بوائی' : 'Sown'} {selectedField.sowingDate}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/field-profile')}
              style={styles.textLinkBtn}
              activeOpacity={0.7}>
              <Text style={[styles.textLink, { fontSize: 13 * fontMultiplier }]}>{t.viewFullDetails}</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.light.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Timeline entries */}
          <View style={styles.historyTimeline}>
            {selectedField.history.map((item, idx) => (
              <View key={item.id} style={styles.historyItem}>
                {/* Timeline dot + line */}
                <View style={styles.historyDotCol}>
                  <View style={[styles.historyDot, { backgroundColor: STAGE_CONFIG[item.stageIndex]?.color || theme.primary }]} />
                  {idx < selectedField.history.length - 1 && <View style={styles.historyLine} />}
                </View>

                {/* Entry content */}
                <View style={styles.historyContent}>
                  <View style={styles.historyRow}>
                    <Image source={{ uri: item.imageUri }} style={styles.photoThumb} />
                    <View style={styles.historyMeta}>
                      <Text style={[styles.historyStage, { fontSize: 14 * fontMultiplier }]}>
                        {language === 'ur' ? stageNames[item.stageIndex] : item.stageName}
                      </Text>
                      <Text style={styles.historyDate}>{item.date}</Text>
                    </View>
                    <View style={styles.confidenceChip}>
                      <Text style={styles.confidenceChipText}>
                        {(item.confidence * 100).toFixed(0)}% Match
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* Floating Audio Mini-Player */}
      <AudioMiniPlayer />

      {/* Start Crop Cycle Modal */}
      {isStartCycleOpen && (
        <StartCycleModal
          visible={isStartCycleOpen}
          field={selectedField}
          onClose={() => setIsStartCycleOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ─── Header ───────────────────────────────
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 8,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  profileAvatarBtn: {
    padding: 1,
  },
  profileAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DCFCE7',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  brandTextCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
    flexShrink: 0,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  appName: {
    fontFamily: FontFamily.extraBold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    gap: 3,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#16A34A',
  },
  liveText: {
    fontFamily: FontFamily.bold,
    fontSize: 8.5,
    color: '#15803D',
    letterSpacing: 0.2,
  },
  appLocation: {
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 1,
  },

  // Field selector carousel
  fieldChipsList: {
    gap: Spacing.sm,
    paddingBottom: 2,
    alignItems: 'center',
  },
  fieldCardChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minWidth: 130,
  },
  fieldCardChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  fieldChipCode: {
    fontFamily: FontFamily.bold,
    color: '#334155',
  },
  fieldChipCodeActive: {
    color: '#15803D',
  },
  acresBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  acresBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  acresText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: '#64748B',
  },
  acresTextActive: {
    color: '#15803D',
  },
  fieldChipVariety: {
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 2,
    marginLeft: 13,
  },
  fieldChipVarietyActive: {
    color: '#166534',
    fontFamily: FontFamily.semiBold,
  },
  addFieldChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderStyle: 'dashed',
    gap: 4,
  },
  addFieldText: {
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },

  // ─── Scroll Content ───────────────────────
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },

  // ─── Fallow Card ──────────────────────────
  fallowCard: {
    ...CardStyle,
    borderColor: '#FED7AA',
    overflow: 'hidden',
    padding: 0,
  },
  fallowAccentBar: {
    height: 5,
    backgroundColor: '#D97706',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  fallowContent: {
    padding: 18,
  },
  fallowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  fallowIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallowBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  fallowBadgeText: {
    fontFamily: FontFamily.extraBold,
    fontSize: 10,
    color: '#B45309',
    letterSpacing: 0.5,
  },
  fallowTitle: {
    fontFamily: FontFamily.extraBold,
    color: '#0F172A',
  },
  fallowSub: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  fallowDesc: {
    fontFamily: FontFamily.regular,
    color: '#475569',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  startCycleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: Radius.md,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  startCycleButtonText: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  // ─── Hero Command Stage Card ──────────────
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stageAccentBar: {
    height: 5,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  heroCardContent: {
    padding: 16,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  stageStatusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stageLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stageCardOverline: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  stageName: {
    fontFamily: FontFamily.extraBold,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  stageMeta: {
    alignItems: 'flex-end',
    gap: 5,
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  stageBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
  },
  dasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dasText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: '#475569',
  },
  stageSummaryText: {
    fontFamily: FontFamily.regular,
    color: '#334155',
    marginVertical: Spacing.sm,
  },

  // 6-step progress container
  progressContainer: {
    position: 'relative',
    paddingTop: 16,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  progressTrack: {
    position: 'absolute',
    top: 29,
    left: 18,
    right: 18,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  progressFill: {
    position: 'absolute',
    top: 29,
    left: 18,
    height: 4,
    borderRadius: 2,
  },
  stepTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    zIndex: 2,
  },
  stepDotNum: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#64748B',
  },
  stepLabel: {
    fontFamily: FontFamily.medium,
    color: '#64748B',
    textAlign: 'center',
  },

  // Telemetry vitals mini grid
  telemetryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    paddingHorizontal: 6,
    paddingVertical: 10,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 2,
    overflow: 'hidden',
  },
  telemetryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  telemetryValue: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    textAlign: 'center',
  },
  telemetryLabel: {
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center',
  },
  telemetryDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },

  // ─── Section Card ─────────────────────────
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  sectionSub: {
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 2,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    gap: 5,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  voiceButtonActive: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  voiceButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#15803D',
  },
  voiceButtonTextActive: {
    color: '#FFFFFF',
  },

  // ─── Redesigned Actionable Advice Cards ───
  adviceList: {
    gap: Spacing.md,
  },
  irrigationCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: 14,
  },
  fertilizerCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: 14,
  },
  diseaseCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: 14,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adviceIconWrapBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  adviceIconWrapGreen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  adviceIconWrapAmber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  priorityBadgeBlue: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  priorityTextBlue: {
    fontFamily: FontFamily.extraBold,
    fontSize: 9,
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  priorityBadgeGreen: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  priorityTextGreen: {
    fontFamily: FontFamily.extraBold,
    fontSize: 9,
    color: '#15803D',
    letterSpacing: 0.5,
  },
  priorityBadgeAmber: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  priorityTextAmber: {
    fontFamily: FontFamily.extraBold,
    fontSize: 9,
    color: '#B45309',
    letterSpacing: 0.5,
  },
  adviceTitle: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  adviceBody: {
    fontFamily: FontFamily.regular,
    color: '#334155',
  },

  // ─── Quick Scan Action Banner ─────────────
  quickScanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  quickScanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickScanIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickScanTitle: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  quickScanSubtitle: {
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 2,
  },

  // ─── Field History ────────────────────────
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  textLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  textLink: {
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  historyTimeline: {
    gap: 0,
  },
  historyItem: {
    flexDirection: 'row',
  },
  historyDotCol: {
    alignItems: 'center',
    width: 20,
    marginRight: Spacing.md,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  historyLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  historyContent: {
    flex: 1,
    paddingBottom: Spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  photoThumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    backgroundColor: '#E2E8F0',
  },
  historyMeta: {
    flex: 1,
  },
  historyStage: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  historyDate: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  confidenceChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  confidenceChipText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#15803D',
  },
  aiFeatureBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  aiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiBannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiBadgePill: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  aiBadgePillText: {
    fontFamily: FontFamily.bold,
    fontSize: 9.5,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  gpuBadgePill: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  gpuBadgePillText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#4F46E5',
  },
  aiBannerTitle: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  aiBannerSubtitle: {
    fontFamily: FontFamily.regular,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  aiBannerArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
