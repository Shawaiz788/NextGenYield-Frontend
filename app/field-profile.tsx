import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp } from '@/context/app-context';
import { Colors, STAGE_CONFIG, FontFamily, Spacing, Radius, CardStyle } from '@/constants/theme';
import { AccessibilityControls } from '@/components/accessibility-bar';
import { useActiveCropCycleQuery, useApplyFertilizerMutation, useCompleteIrrigationMutation } from '@/hooks/use-crop-cycles';
import { BackendReachabilityBanner } from '@/components/backend-reachability-banner';
import { ActivityIndicator } from 'react-native';


export default function FieldProfileScreen() {
  const theme = Colors.light;
  const { selectedField, t, fontMultiplier } = useApp();

  const [activeTab, setActiveTab] = useState<'timeline' | 'fertilizer' | 'irrigation'>('timeline');
  const { data: activeCycle, isLoading: isCycleLoading, isError: isCycleError, error: cycleError, refetch: refetchCycle } = useActiveCropCycleQuery(selectedField?.id);
  const applyFertilizerMutation = useApplyFertilizerMutation(selectedField?.id, activeCycle?.cycle_id);
  const completeIrrigationMutation = useCompleteIrrigationMutation(selectedField?.id, activeCycle?.cycle_id);

  const currentStage = STAGE_CONFIG[selectedField?.currentStageIndex || 0] || STAGE_CONFIG[0];

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

  const tabs = [
    { key: 'timeline' as const, label: t.tabStages, icon: 'time-outline' as const },
    { key: 'fertilizer' as const, label: t.tabFertilizer, icon: 'nutrition-outline' as const },
    { key: 'irrigation' as const, label: t.tabIrrigation, icon: 'water-outline' as const },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.topBarTitleGroup}>
          <Text style={[styles.topBarTitle, { fontSize: 16 * fontMultiplier }]}>{t.fieldProfile}</Text>
          <Text style={styles.topBarSubtitle}>{selectedField.code} · {selectedField.wheatVariety}</Text>
        </View>
        <AccessibilityControls />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {isCycleError && (
          <BackendReachabilityBanner
            isUrdu={false}
            error={cycleError}
            onRetry={() => refetchCycle()}
            style={{ marginHorizontal: 0, marginBottom: 12 }}
          />
        )}
        {/* Field Summary Card */}
        <View style={styles.summaryCard}>
          <View style={[styles.summaryAccent, { backgroundColor: currentStage.color }]} />
          <View style={styles.summaryContent}>
            <View style={styles.summaryTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldTitle, { fontSize: 17 * fontMultiplier }]}>{selectedField.displayName}</Text>
                <Text style={styles.fieldLocation}>{selectedField.district} · {selectedField.soilTexture}</Text>
              </View>
              <View style={[styles.stageBadge, { backgroundColor: currentStage.lightBg }]}>
                <Text style={[styles.stageBadgeText, { color: currentStage.color }]}>
                  {stageNames[selectedField.currentStageIndex]}
                </Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.gridRow}>
              <View style={[styles.gridItem, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="resize-outline" size={14} color={Colors.light.primary} style={{ marginBottom: 2 }} />
                <Text style={styles.gridLabel}>{t.area}</Text>
                <Text style={styles.gridVal}>{selectedField.areaAcres} Acres</Text>
              </View>
              <View style={[styles.gridItem, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="calendar-outline" size={14} color={Colors.light.irrigation} style={{ marginBottom: 2 }} />
                <Text style={styles.gridLabel}>{t.sowingDate}</Text>
                <Text style={styles.gridVal}>{selectedField.sowingDate}</Text>
              </View>
              <View style={[styles.gridItem, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="trophy-outline" size={14} color={Colors.light.primary} style={{ marginBottom: 2 }} />
                <Text style={styles.gridLabel}>{t.harvestReturn}</Text>
                <Text style={[styles.gridVal, { color: Colors.light.primary }]}>{selectedField.yieldMaundsPerAcre} M/Ac</Text>
              </View>
              <View style={[styles.gridItem, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="analytics-outline" size={14} color="#D97706" style={{ marginBottom: 2 }} />
                <Text style={styles.gridLabel}>{t.efficiency}</Text>
                <Text style={[styles.gridVal, { color: '#D97706' }]}>{selectedField.yieldReturnKgSqm} kg/m²</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Underline Tab Switcher */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                activeOpacity={0.7}>
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? Colors.light.primary : Colors.light.textMuted}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab 1: Stage Timeline */}
        {activeTab === 'timeline' && (
          <View style={styles.card}>
            <Text style={[styles.cardHeading, { fontSize: 16 * fontMultiplier }]}>{t.growthMilestones}</Text>
            <Text style={styles.cardSub}>{t.sixBiologicalStages}</Text>

            <View style={styles.timelineList}>
              {STAGE_CONFIG.map((stage, idx) => {
                const isPassed = idx < selectedField.currentStageIndex;
                const isCurrent = idx === selectedField.currentStageIndex;

                return (
                  <View key={stage.key} style={styles.timelineItem}>
                    <View style={styles.dotColumn}>
                      <View
                        style={[
                          styles.dot,
                          isCurrent && { backgroundColor: stage.color, borderColor: '#FFFFFF', borderWidth: 2.5, width: 22, height: 22, borderRadius: 11 },
                          isPassed && { backgroundColor: theme.primary },
                          !isPassed && !isCurrent && { backgroundColor: '#CBD5E1' },
                        ]}>
                        {isPassed && <Ionicons name="checkmark" size={10} color="#FFFFFF" />}
                      </View>
                      {idx < STAGE_CONFIG.length - 1 && (
                        <View style={[styles.stemLine, isPassed && { backgroundColor: theme.primary }]} />
                      )}
                    </View>

                    <View style={styles.stageContent}>
                      <View style={styles.stageTitleRow}>
                        <Text style={[styles.stageName, { fontSize: 14 * fontMultiplier }]}>
                          {stageNames[idx]}
                        </Text>
                        <View
                          style={[
                            styles.statusTag,
                            isCurrent && { backgroundColor: stage.lightBg },
                            isPassed && { backgroundColor: Colors.light.primaryLight },
                            !isPassed && !isCurrent && { backgroundColor: '#F1F5F9' },
                          ]}>
                          <Text
                            style={[
                              styles.statusTagText,
                              isCurrent && { color: stage.color },
                              isPassed && { color: Colors.light.primaryDark },
                              !isPassed && !isCurrent && { color: Colors.light.textSecondary },
                            ]}>
                            {isCurrent ? t.activeNow : isPassed ? t.completed : t.upcoming}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.stageSummary, { fontSize: 12 * fontMultiplier, lineHeight: 18 * fontMultiplier }]}>
                        {stageDescs[idx]}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Tab 2: Fertilizer Schedule */}
        {activeTab === 'fertilizer' && (
          <View style={styles.card}>
            <Text style={[styles.cardHeading, { fontSize: 16 * fontMultiplier }]}>{t.fertilizerApplications}</Text>
            <Text style={styles.cardSub}>{t.dosesPerAcre}</Text>

            <View style={styles.ledgerList}>
              {activeCycle?.fertilizer_schedules && activeCycle.fertilizer_schedules.length > 0 ? (
                activeCycle.fertilizer_schedules.map((entry) => (
                  <View key={entry.schedule_id} style={[styles.ledgerRow, entry.is_applied && styles.ledgerRowApplied]}>
                    <View style={styles.ledgerHeader}>
                      <Text style={[styles.ledgerStage, { fontSize: 13 * fontMultiplier }]}>{entry.stage_name}</Text>
                      <TouchableOpacity
                        onPress={() => applyFertilizerMutation.mutate(entry.schedule_id)}
                        disabled={entry.is_applied || applyFertilizerMutation.isPending}
                        style={[styles.appliedPill, entry.is_applied ? styles.appliedPillDone : styles.appliedPillScheduled]}
                        activeOpacity={0.8}>
                        <Text style={[styles.appliedPillText, entry.is_applied ? styles.appliedPillTextDone : styles.appliedPillTextScheduled]}>
                          {entry.is_applied ? t.applied : t.scheduled}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.ledgerType, { fontSize: 13 * fontMultiplier }]}>{entry.nutrient_type}</Text>
                    <Text style={styles.ledgerDose}>Dose: {entry.dose_per_acre}</Text>
                    <Text style={styles.ledgerDate}>📅 Target DAS: Day {entry.target_das}</Text>
                  </View>
                ))
              ) : (
                selectedField.fertilizerPlan.map((entry, idx) => (
                  <View key={idx} style={[styles.ledgerRow, entry.applied && styles.ledgerRowApplied]}>
                    <View style={styles.ledgerHeader}>
                      <Text style={[styles.ledgerStage, { fontSize: 13 * fontMultiplier }]}>{entry.stage}</Text>
                      <View style={[styles.appliedPill, entry.applied ? styles.appliedPillDone : styles.appliedPillScheduled]}>
                        <Text style={[styles.appliedPillText, entry.applied ? styles.appliedPillTextDone : styles.appliedPillTextScheduled]}>
                          {entry.applied ? t.applied : t.scheduled}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.ledgerType, { fontSize: 13 * fontMultiplier }]}>{entry.type}</Text>
                    <Text style={styles.ledgerDose}>Dose: {entry.dosePerAcre}</Text>
                    <Text style={styles.ledgerDate}>📅 {entry.date}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* Tab 3: Irrigation Log */}
        {activeTab === 'irrigation' && (
          <View style={styles.card}>
            <Text style={[styles.cardHeading, { fontSize: 16 * fontMultiplier }]}>{t.irrigationSchedule}</Text>
            <Text style={styles.cardSub}>{t.waterTimingMatched}</Text>

            <View style={styles.ledgerList}>
              {activeCycle?.irrigation_schedules && activeCycle.irrigation_schedules.length > 0 ? (
                activeCycle.irrigation_schedules.map((irrig) => (
                  <View key={irrig.schedule_id} style={[styles.ledgerRow, irrig.is_completed && styles.ledgerRowApplied]}>
                    <View style={styles.ledgerHeader}>
                      <Text style={[styles.ledgerStage, { fontSize: 13 * fontMultiplier }]}>{irrig.event_name}</Text>
                      <TouchableOpacity
                        onPress={() => completeIrrigationMutation.mutate(irrig.schedule_id)}
                        disabled={irrig.is_completed || completeIrrigationMutation.isPending}
                        style={[styles.appliedPill, irrig.is_completed ? styles.appliedPillDone : styles.appliedPillScheduled]}
                        activeOpacity={0.8}>
                        <Text style={[styles.appliedPillText, irrig.is_completed ? styles.appliedPillTextDone : styles.appliedPillTextScheduled]}>
                          {irrig.is_completed ? t.completed : t.upcoming}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.ledgerType, { fontSize: 13 * fontMultiplier }]}>{irrig.stage_name} · {irrig.water_depth_inches}" Depth</Text>
                    <Text style={styles.ledgerDate}>📅 Target DAS: Day {irrig.target_das}</Text>
                  </View>
                ))
              ) : (
                selectedField.irrigationPlan.map((irrig, idx) => (
                  <View key={idx} style={[styles.ledgerRow, irrig.completed && styles.ledgerRowApplied]}>
                    <View style={styles.ledgerHeader}>
                      <Text style={[styles.ledgerStage, { fontSize: 13 * fontMultiplier }]}>{irrig.event}</Text>
                      <View style={[styles.appliedPill, irrig.completed ? styles.appliedPillDone : styles.appliedPillScheduled]}>
                        <Text style={[styles.appliedPillText, irrig.completed ? styles.appliedPillTextDone : styles.appliedPillTextScheduled]}>
                          {irrig.completed ? t.completed : t.upcoming}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.ledgerType, { fontSize: 13 * fontMultiplier }]}>{t.source}: {irrig.source}</Text>
                    <Text style={styles.ledgerDate}>{t.date}: {irrig.date}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  topBarTitleGroup: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  topBarTitle: {
    fontFamily: FontFamily.extraBold,
    color: Colors.light.text,
  },
  topBarSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: 14,
  },

  // ─── Summary Card ─────────────────────────
  summaryCard: {
    ...CardStyle,
    overflow: 'hidden',
    padding: 0,
  },
  summaryAccent: {
    height: 4,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  summaryContent: {
    padding: 18,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  fieldTitle: {
    fontFamily: FontFamily.extraBold,
    color: Colors.light.text,
  },
  fieldLocation: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  stageBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  gridItem: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'flex-start',
  },
  gridLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  gridVal: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: Colors.light.text,
  },

  // ─── Underline Tabs ───────────────────────
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabBtnActive: {},
  tabText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  tabTextActive: {
    color: Colors.light.primary,
    fontFamily: FontFamily.bold,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 3,
    backgroundColor: Colors.light.primary,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  // ─── Content Card ─────────────────────────
  card: {
    ...CardStyle,
    padding: 18,
  },
  cardHeading: {
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },
  cardSub: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  timelineList: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  dotColumn: {
    alignItems: 'center',
    width: 28,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stemLine: {
    width: 3,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
    borderRadius: 2,
  },
  stageContent: {
    flex: 1,
    marginLeft: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  stageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  stageName: {
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusTagText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
  },
  stageSummary: {
    fontFamily: FontFamily.regular,
    color: Colors.light.textSecondary,
  },

  // ─── Ledger ───────────────────────────────
  ledgerList: {
    gap: 10,
  },
  ledgerRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  ledgerRowApplied: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.light.primaryLight,
  },
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ledgerStage: {
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },
  appliedPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  appliedPillDone: {
    backgroundColor: Colors.light.primaryLight,
  },
  appliedPillScheduled: {
    backgroundColor: '#FEF3C7',
  },
  appliedPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
  },
  appliedPillTextDone: {
    color: Colors.light.primaryDark,
  },
  appliedPillTextScheduled: {
    color: '#B45309',
  },
  ledgerType: {
    fontFamily: FontFamily.semiBold,
    color: Colors.light.primaryDark,
    marginBottom: 2,
  },
  ledgerDose: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#475569',
  },
  ledgerDate: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});
