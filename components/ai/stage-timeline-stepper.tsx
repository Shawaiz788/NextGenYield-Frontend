import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, Radius, STAGE_CONFIG } from '@/constants/theme';

interface StageTimelineStepperProps {
  currentStageIndex: number;
  confidence?: number;
  isUrdu?: boolean;
}

const URDU_STAGE_NAMES: Record<number, string> = {
  0: 'شگوفے (ٹلرنگ)',
  1: 'نالی / گانٹھیں',
  2: 'گوبھ (بوٹنگ)',
  3: 'بور / پھول',
  4: 'دانہ بننا',
  5: 'پکائی و کٹائی',
};

export function StageTimelineStepper({
  currentStageIndex,
  isUrdu = false,
}: StageTimelineStepperProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>
          {isUrdu ? 'ترقی کا مرحلہ وار ٹائم لائن' : 'Growth Timeline Stepper'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isUrdu ? `مرحلہ ${currentStageIndex + 1} از 6` : `Stage ${currentStageIndex + 1} of 6`}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepperScroll}>
        {STAGE_CONFIG.map((stage, idx) => {
          const isCurrent = idx === currentStageIndex;
          const isPast = idx < currentStageIndex;
          const displayName = isUrdu ? URDU_STAGE_NAMES[idx] || stage.name : stage.name;

          return (
            <React.Fragment key={stage.key}>
              <View style={styles.stepNode}>
                {/* Node Circle */}
                <View
                  style={[
                    styles.nodeCircle,
                    isCurrent && { backgroundColor: stage.color, borderColor: '#FFFFFF', transform: [{ scale: 1.1 }] },
                    isPast && { backgroundColor: '#10B981', borderColor: '#DCFCE7' },
                    !isCurrent && !isPast && styles.nodeUpcoming,
                  ]}>
                  {isPast ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.nodeIndexText,
                        (isCurrent || isPast) && styles.nodeActiveText,
                      ]}>
                      {idx}
                    </Text>
                  )}
                </View>

                {/* Stage Title */}
                <Text
                  numberOfLines={1}
                  style={[
                    styles.nodeLabel,
                    isCurrent && [styles.nodeLabelActive, { color: stage.color }],
                    isPast && styles.nodeLabelPast,
                  ]}>
                  {displayName}
                </Text>

                {/* Active Indicator Chip */}
                {isCurrent && (
                  <View style={[styles.activeIndicator, { backgroundColor: stage.lightBg, borderColor: stage.color }]}>
                    <Text style={[styles.activeIndicatorText, { color: stage.color }]}>
                      {isUrdu ? 'موجودہ' : 'Active'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Connecting Line between steps */}
              {idx < STAGE_CONFIG.length - 1 && (
                <View
                  style={[
                    styles.connectLine,
                    idx < currentStageIndex ? styles.connectLinePast : styles.connectLineFuture,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  stepperScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  stepNode: {
    alignItems: 'center',
    width: 78,
  },
  nodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  nodeUpcoming: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  nodeIndexText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#64748B',
  },
  nodeActiveText: {
    color: '#FFFFFF',
  },
  nodeLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  nodeLabelActive: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },
  nodeLabelPast: {
    color: '#10B981',
    fontFamily: FontFamily.semiBold,
  },
  activeIndicator: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  activeIndicatorText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  connectLine: {
    width: 24,
    height: 3,
    borderRadius: 2,
    marginHorizontal: -4,
    marginBottom: 24,
  },
  connectLinePast: {
    backgroundColor: '#10B981',
  },
  connectLineFuture: {
    backgroundColor: '#E2E8F0',
  },
});
