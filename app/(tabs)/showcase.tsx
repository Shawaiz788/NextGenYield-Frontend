import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp } from '@/context/app-context';
import { PeerShowcaseField, CropCycleEvent } from '@/constants/mock-data';
import { AccessibilityControls, AudioMiniPlayer } from '@/components/accessibility-bar';
import { Colors, FontFamily, Spacing, Radius, CardStyle } from '@/constants/theme';

const CATEGORY_COLORS: Record<CropCycleEvent['category'], string> = {
  water: '#3B82F6',
  fertilizer: '#16A34A',
  filter: '#7C3AED',
  sow: '#D97706',
  harvest: '#EA580C',
};

export default function BestPracticeShowcaseScreen() {
  const { peerShowcase, adoptedPlaybooks, adoptPlaybook, selectedField, t, language, fontMultiplier } = useApp();

  const [varietyFilter, setVarietyFilter] = useState<'all' | 'Akbar-2019' | 'Dilkash-20'>('all');
  const [expandedId, setExpandedId] = useState<string | null>('peer_field_01');
  const [adoptingField, setAdoptingField] = useState<PeerShowcaseField | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = peerShowcase.filter((f) => {
    if (varietyFilter === 'all') return true;
    return f.wheatVariety === varietyFilter;
  });

  const handleAdopt = (field: PeerShowcaseField) => {
    adoptPlaybook(field.fieldId);
    setAdoptingField(null);
    setToastMessage(`${field.code} schedule applied to ${selectedField.code}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getCategoryIcon = (category: CropCycleEvent['category']) => {
    switch (category) {
      case 'water':
        return <Ionicons name="water" size={14} color="#3B82F6" />;
      case 'fertilizer':
        return <Ionicons name="nutrition" size={14} color="#16A34A" />;
      case 'filter':
        return <Ionicons name="filter" size={14} color="#7C3AED" />;
      case 'sow':
        return <MaterialCommunityIcons name="seed" size={14} color="#D97706" />;
      case 'harvest':
        return <Ionicons name="ribbon" size={14} color="#EA580C" />;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { fontSize: 22 * fontMultiplier }]}>
              {language === 'ur' ? 'کامیاب فصلوں کا شیڈول' : 'Proven Yields'}
            </Text>
            <Text style={[styles.headerSubtitle, { fontSize: 13 * fontMultiplier }]}>
              {language === 'ur'
                ? 'بہترین فصل کے 140 روزہ شیڈول'
                : 'Top harvest cycles to adopt'}
            </Text>
          </View>
          <AccessibilityControls />
        </View>

        {/* Variety Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[
            { key: 'all' as const, label: t.allVarieties },
            { key: 'Akbar-2019' as const, label: 'Akbar-2019' },
            { key: 'Dilkash-20' as const, label: 'Dilkash-20' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setVarietyFilter(f.key)}
              style={[styles.filterChip, varietyFilter === f.key && styles.filterChipActive]}
              activeOpacity={0.7}>
              <Text style={[styles.filterChipText, varietyFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Toast */}
      {toastMessage && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {filtered.map((item) => {
          const isAdopted = adoptedPlaybooks.includes(item.fieldId);
          const isExpanded = expandedId === item.fieldId;

          return (
            <View key={item.fieldId} style={styles.card}>
              {/* Hero Header — Yield front and center */}
              <View style={styles.cardHeader}>
                <View style={styles.yieldHero}>
                  <Text style={styles.yieldNumber}>{item.yieldMaundsPerAcre}</Text>
                  <Text style={styles.yieldUnitLabel}>Maunds/Ac</Text>
                  <Text style={styles.yieldSqm}>({item.yieldKgSqm} kg/m²)</Text>
                </View>

                <View style={{ flex: 1, marginLeft: Spacing.lg }}>
                  <View style={styles.benchmarkTag}>
                    <Ionicons name="trophy" size={10} color="#D97706" style={{ marginRight: 3 }} />
                    <Text style={styles.benchmarkTagText}>
                      {language === 'ur' ? 'بہترین پیداوار' : 'Top Yield'}
                    </Text>
                  </View>
                  <Text style={[styles.cardCode, { fontSize: 16 * fontMultiplier }]}>{item.code}</Text>
                  <Text style={styles.cardLocation}>{item.district}</Text>
                </View>
              </View>

              {/* Specs — 2-column grid */}
              <View style={styles.specGrid}>
                <View style={styles.specGridItem}>
                  <Ionicons name="scan-outline" size={13} color={Colors.light.primary} />
                  <Text style={styles.specGridLabel}>
                    {language === 'ur' ? 'شکل/سائز' : 'Shape'}
                  </Text>
                  <Text style={[styles.specGridValue, { fontSize: 12 * fontMultiplier }]} numberOfLines={2}>
                    {item.shapeDescription}
                  </Text>
                </View>
                <View style={styles.specGridItem}>
                  <MaterialCommunityIcons name="seed-outline" size={13} color={Colors.light.primary} />
                  <Text style={styles.specGridLabel}>
                    {language === 'ur' ? 'بیج' : 'Seed'}
                  </Text>
                  <Text style={[styles.specGridValue, { fontSize: 12 * fontMultiplier }]}>
                    {item.wheatVariety}
                  </Text>
                </View>
                <View style={styles.specGridItem}>
                  <Ionicons name="business-outline" size={13} color={Colors.light.primary} />
                  <Text style={styles.specGridLabel}>
                    {language === 'ur' ? 'کھاد' : 'Fertilizer'}
                  </Text>
                  <Text style={[styles.specGridValue, { fontSize: 12 * fontMultiplier }]}>
                    {item.fertilizerCompany}
                  </Text>
                </View>
                <View style={styles.specGridItem}>
                  <Ionicons name="resize-outline" size={13} color={Colors.light.primary} />
                  <Text style={styles.specGridLabel}>
                    {language === 'ur' ? 'رقبہ' : 'Area'}
                  </Text>
                  <Text style={[styles.specGridValue, { fontSize: 12 * fontMultiplier }]}>
                    {item.areaAcres} Acres
                  </Text>
                </View>
              </View>

              {/* Expand / Collapse Toggle */}
              <TouchableOpacity
                onPress={() => toggleExpand(item.fieldId)}
                style={styles.toggleRow}
                activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time-outline" size={16} color={Colors.light.primary} />
                  <Text style={[styles.toggleText, { fontSize: 13 * fontMultiplier }]}>
                    {isExpanded
                      ? language === 'ur' ? 'شیڈول چھپائیں' : 'Hide Cycle'
                      : language === 'ur' ? '140 روزہ شیڈول دیکھیں' : 'View 140-Day Cycle'}
                  </Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.light.primary}
                />
              </TouchableOpacity>

              {/* Expanded Timeline */}
              {isExpanded && (
                <View style={styles.cycleTimelineContainer}>
                  <Text style={styles.cycleHeading}>
                    {language === 'ur'
                      ? 'مکمل 140 روزہ شیڈول:'
                      : 'Day-by-Day Lifecycle:'}
                  </Text>

                  <View style={styles.cycleList}>
                    {item.cropCycle.map((ev, idx) => (
                      <View key={idx} style={styles.cycleItem}>
                        {/* Day Column */}
                        <View style={styles.dayCol}>
                          <View style={[styles.dayPill, { backgroundColor: `${CATEGORY_COLORS[ev.category]}15`, borderColor: `${CATEGORY_COLORS[ev.category]}40` }]}>
                            <Text style={[styles.dayPillText, { color: CATEGORY_COLORS[ev.category] }]}>Day {ev.day}</Text>
                          </View>
                          {idx < item.cropCycle.length - 1 && (
                            <View style={[styles.dayLine, { backgroundColor: `${CATEGORY_COLORS[ev.category]}30` }]} />
                          )}
                        </View>

                        {/* Event Card */}
                        <View style={[styles.eventCard, idx % 2 === 1 && { backgroundColor: '#FAFBFC' }]}>
                          <View style={styles.eventHeaderRow}>
                            <View style={[styles.eventIconWrap, { backgroundColor: `${CATEGORY_COLORS[ev.category]}15` }]}>
                              {getCategoryIcon(ev.category)}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.eventTitle, { fontSize: 13 * fontMultiplier }]}>{ev.title}</Text>
                              <Text style={styles.eventDate}>
                                {ev.date} · {ev.stageName}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.eventSource}>
                            📍 {ev.companyOrSource}
                          </Text>

                          <Text style={[styles.eventDescription, { fontSize: 12 * fontMultiplier }]}>
                            {ev.description}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Adopt Button */}
                  <TouchableOpacity
                    onPress={() => setAdoptingField(item)}
                    style={[styles.adoptButton, isAdopted && styles.adoptButtonDone]}
                    disabled={isAdopted}
                    activeOpacity={0.85}>
                    <Ionicons
                      name={isAdopted ? 'checkmark-circle' : 'copy-outline'}
                      size={16}
                      color={isAdopted ? Colors.light.primary : '#FFFFFF'}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.adoptButtonText, isAdopted && styles.adoptButtonTextDone, { fontSize: 13 * fontMultiplier }]}>
                      {isAdopted
                        ? language === 'ur' ? 'محفوظ ہو چکا ہے' : 'Already Applied'
                        : language === 'ur' ? 'اپنے کھیت پر لگائیں' : 'Apply to My Field'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Teaser link when collapsed */}
              {!isExpanded && !isAdopted && (
                <TouchableOpacity
                  onPress={() => setAdoptingField(item)}
                  style={styles.teaserAdopt}
                  activeOpacity={0.7}>
                  <Ionicons name="copy-outline" size={14} color={Colors.light.primary} />
                  <Text style={styles.teaserAdoptText}>
                    {language === 'ur' ? 'یہ شیڈول لاگو کریں →' : 'Adopt this schedule →'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* Floating Audio Player */}
      <AudioMiniPlayer />

      {/* Confirmation Modal */}
      {adoptingField !== null && (
        <Modal visible={true} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHandle} />
              <Text style={[styles.modalTitle, { fontSize: 17 * fontMultiplier }]}>
                {language === 'ur' ? 'کیا یہ شیڈول لاگو کریں؟' : 'Apply This Schedule?'}
              </Text>
              <Text style={[styles.modalBody, { fontSize: 13 * fontMultiplier, lineHeight: 20 * fontMultiplier }]}>
                {language === 'ur'
                  ? `${adoptingField?.code} کا شیڈول آپ کے کھیت (${selectedField.code}) کے لیے ایڈجسٹ ہو جائے گا۔`
                  : `This will calibrate the schedule from ${adoptingField?.code} for your field (${selectedField.code} · ${selectedField.areaAcres} Acres).`}
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setAdoptingField(null)}
                  style={styles.modalCancel}
                  activeOpacity={0.7}>
                  <Text style={styles.modalCancelText}>{t.cancel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => adoptingField && handleAdopt(adoptingField)}
                  style={styles.modalConfirm}
                  activeOpacity={0.85}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.modalConfirmText}>{t.confirm}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontFamily: FontFamily.extraBold,
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontFamily: FontFamily.medium,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  filterRow: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primaryLight,
    borderColor: Colors.light.primary,
  },
  filterChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#475569',
  },
  filterChipTextActive: {
    color: Colors.light.primaryDark,
    fontFamily: FontFamily.bold,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    gap: Spacing.sm,
  },
  toastText: {
    fontFamily: FontFamily.semiBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },

  // ─── Card ─────────────────────────────────
  card: {
    ...CardStyle,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  yieldHero: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    width: 76,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  yieldNumber: {
    fontFamily: FontFamily.extraBold,
    fontSize: 28,
    color: Colors.light.primaryDark,
    lineHeight: 32,
  },
  yieldUnitLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: Colors.light.primary,
    marginTop: 1,
  },
  yieldSqm: {
    fontFamily: FontFamily.medium,
    fontSize: 8,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  benchmarkTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  benchmarkTagText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#B45309',
  },
  cardCode: {
    fontFamily: FontFamily.extraBold,
    color: Colors.light.text,
  },
  cardLocation: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },

  // ─── Spec Grid ────────────────────────────
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  specGridItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    gap: 2,
  },
  specGridLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: Colors.light.textMuted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  specGridValue: {
    fontFamily: FontFamily.semiBold,
    color: Colors.light.text,
  },

  // ─── Toggle ───────────────────────────────
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  toggleText: {
    fontFamily: FontFamily.bold,
    color: Colors.light.primary,
  },

  // ─── Timeline ─────────────────────────────
  cycleTimelineContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  cycleHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  cycleList: {
    gap: 0,
  },
  cycleItem: {
    flexDirection: 'row',
  },
  dayCol: {
    alignItems: 'center',
    width: 58,
  },
  dayPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dayPillText: {
    fontFamily: FontFamily.extraBold,
    fontSize: 10,
  },
  dayLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
    borderRadius: 1,
  },
  eventCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 10,
    marginLeft: Spacing.sm,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eventIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTitle: {
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },
  eventDate: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  eventSource: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#475569',
    marginBottom: 4,
  },
  eventDescription: {
    fontFamily: FontFamily.regular,
    color: '#334155',
    lineHeight: 17,
  },
  adoptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    paddingVertical: 13,
    marginTop: Spacing.sm,
  },
  adoptButtonDone: {
    backgroundColor: Colors.light.primaryLight,
  },
  adoptButtonText: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  adoptButtonTextDone: {
    color: Colors.light.primaryDark,
  },

  // ─── Teaser Adopt Link ────────────────────
  teaserAdopt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.md,
    gap: 4,
  },
  teaserAdoptText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.light.primary,
  },

  // ─── Modal ────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontFamily: FontFamily.extraBold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  modalBody: {
    fontFamily: FontFamily.regular,
    color: '#475569',
    marginBottom: Spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  modalConfirm: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.light.primary,
    paddingVertical: 13,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    fontSize: 13,
  },
});
