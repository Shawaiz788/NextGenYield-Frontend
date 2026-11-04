import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp, MapFieldItem } from '@/context/app-context';
import { FieldData } from '@/constants/mock-data';

interface StartCycleModalProps {
  visible: boolean;
  field: FieldData | MapFieldItem | null;
  onClose: () => void;
  onSuccess?: (fieldCode: string) => void;
}

const WHEAT_VARIETIES = [
  { name: 'Akbar-2019', note: 'High yield & rust resistance', noteUrdu: 'زیادہ پیداوار، کنگی سے محفوظ' },
  { name: 'Dilkash-20', note: 'Heat tolerant & early maturity', noteUrdu: 'گرمی برداشت، جلدی پکنے والی' },
  { name: 'Fakhar-e-Bhakkar', note: 'Thal & water scarce zones', noteUrdu: 'کم پانی اور ریتلے رقبوں کے لیے' },
  { name: 'Subhani-21', note: 'High grain weight & protein', noteUrdu: 'موٹا دانہ، زیادہ پروٹین' },
];

const SEED_COMPANIES = [
  'Punjab Seed Corporation (PSC)',
  'Fauji Fresh / FFC Seeds',
  'Guard Agricultural Research',
  'ICI Pakistan Seeds',
];

const FERTILIZER_COMPANIES = [
  { name: 'FFC (Fauji Fertilizer Company)', badge: 'Sona Urea & DAP', color: '#15803D' },
  { name: 'Engro Fertilizers', badge: 'Zarkhez Plus & Urea', color: '#0369A1' },
  { name: 'Fatima Fertilizer Group', badge: 'Sarsabz CAN & Nitrophos', color: '#B45309' },
];

const SOWING_METHODS = [
  { id: 'drill', label: 'Drill Sowing (9 inch)', labelUrdu: 'ڈرل کاشت (9 انچ فاصلہ)' },
  { id: 'broadcast', label: 'Broadcasting (Chhatta)', labelUrdu: 'چھٹہ کا روایتی طریقہ' },
  { id: 'bed', label: 'Raised Bed Planter', labelUrdu: 'بیڈ پلانٹر پر کاشت' },
];

export function StartCycleModal({ visible, field, onClose, onSuccess }: StartCycleModalProps) {
  const { startCropCycle, language, fontMultiplier, t } = useApp();

  const [selectedVariety, setSelectedVariety] = useState('Akbar-2019');
  const [customVariety, setCustomVariety] = useState('');
  const [isCustomVariety, setIsCustomVariety] = useState(false);

  const [selectedSeedCompany, setSelectedSeedCompany] = useState('Punjab Seed Corporation (PSC)');
  const [selectedFertilizerCompany, setSelectedFertilizerCompany] = useState('FFC (Fauji Fertilizer Company)');
  const [sowingDate, setSowingDate] = useState('02 Oct 2026');
  const [sowingMethod, setSowingMethod] = useState('Drill Sowing (9 inch)');
  const [targetYield, setTargetYield] = useState('55');

  if (!visible || !field) return null;

  const handleConfirm = () => {
    const varietyToUse = isCustomVariety && customVariety.trim() ? customVariety.trim() : selectedVariety;
    const yieldNum = parseFloat(targetYield) || 55.0;

    startCropCycle({
      fieldId: field.id,
      wheatVariety: varietyToUse,
      seedCompany: selectedSeedCompany,
      fertilizerCompany: selectedFertilizerCompany,
      sowingDate,
      sowingMethod,
      targetYieldMaunds: yieldNum,
    });

    onClose();
    if (onSuccess) {
      onSuccess(field.code);
    }
  };

  const fieldName = 'name' in field ? field.name : field.displayName;
  const fieldAcres = 'acres' in field ? field.acres : field.areaAcres;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="seed" size={24} color="#16A34A" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.title, { fontSize: 18 * fontMultiplier }]}>
                {language === 'ur' ? 'فصل کا نیا دورانیہ شروع کریں' : 'Start Crop Cycle'}
              </Text>
              <Text style={[styles.subtitle, { fontSize: 13 * fontMultiplier }]}>
                {field.code} · {fieldName} ({fieldAcres} ac)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Helper Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={18} color="#0284C7" style={{ marginTop: 1 }} />
            <Text style={[styles.infoBannerText, { fontSize: 12 * fontMultiplier }]}>
              {language === 'ur'
                ? 'بیج کی قسم اور کھاد کمپنی صرف ایک بار منتخب کریں۔ یہ معلومات فصل کے پورے 140 دن کے شیڈول کے لیے استعمال ہوں گی۔'
                : 'Configure seed variant and fertilizer company once. This establishes your full 140-day watering, weed filtering, and fertilization calendar.'}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
            {/* 1. Wheat Variety (Seed) */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontSize: 13 * fontMultiplier }]}>
                {language === 'ur' ? '1. گندم کے بیج کی قسم (Wheat Seed Variant):' : '1. WHEAT SEED VARIETY:'}
              </Text>
              <View style={styles.varietiesGrid}>
                {WHEAT_VARIETIES.map((v) => {
                  const isSelected = !isCustomVariety && selectedVariety === v.name;
                  return (
                    <TouchableOpacity
                      key={v.name}
                      onPress={() => {
                        setSelectedVariety(v.name);
                        setIsCustomVariety(false);
                      }}
                      style={[styles.varietyCard, isSelected && styles.varietyCardSelected]}
                      activeOpacity={0.8}>
                      <View style={styles.varietyCardHeader}>
                        <Text style={[styles.varietyName, isSelected && styles.varietyNameSelected]}>
                          {v.name}
                        </Text>
                        {isSelected && <Ionicons name="checkmark-circle" size={16} color="#16A34A" />}
                      </View>
                      <Text style={styles.varietyNote}>
                        {language === 'ur' ? v.noteUrdu : v.note}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Variety write-in */}
              <TouchableOpacity
                onPress={() => setIsCustomVariety(true)}
                style={[styles.customChip, isCustomVariety && styles.customChipActive]}>
                <Ionicons
                  name="create-outline"
                  size={15}
                  color={isCustomVariety ? '#16A34A' : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.customChipText, isCustomVariety && styles.customChipTextActive]}>
                  {language === 'ur' ? 'دیگر قسم لکھیں (Other Variant)' : 'Custom / Other Variety'}
                </Text>
              </TouchableOpacity>

              {isCustomVariety && (
                <TextInput
                  value={customVariety}
                  onChangeText={setCustomVariety}
                  placeholder={language === 'ur' ? 'مثلاً: بھکر سٹار، اجالا 16' : 'e.g., Fakhar-e-Bhakkar, Ujala-16'}
                  style={styles.textInput}
                />
              )}
            </View>

            {/* 2. Seed Supplier Company */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontSize: 13 * fontMultiplier }]}>
                {language === 'ur' ? '2. بیج فراہم کنندہ / کمپنی (Seed Supplier):' : '2. SEED CERTIFICATION / SUPPLIER:'}
              </Text>
              <View style={styles.chipsRow}>
                {SEED_COMPANIES.map((sc) => {
                  const isSelected = selectedSeedCompany === sc;
                  return (
                    <TouchableOpacity
                      key={sc}
                      onPress={() => setSelectedSeedCompany(sc)}
                      style={[styles.companyChip, isSelected && styles.companyChipSelected]}
                      activeOpacity={0.8}>
                      <Text style={[styles.companyChipText, isSelected && styles.companyChipTextSelected]}>
                        {sc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Fertilizer Company */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontSize: 13 * fontMultiplier }]}>
                {language === 'ur' ? '3. کھاد کی کمپنی (Fertilizer Company):' : '3. FERTILIZER COMPANY BRAND:'}
              </Text>
              <View style={styles.fertilizerList}>
                {FERTILIZER_COMPANIES.map((fc) => {
                  const isSelected = selectedFertilizerCompany === fc.name;
                  return (
                    <TouchableOpacity
                      key={fc.name}
                      onPress={() => setSelectedFertilizerCompany(fc.name)}
                      style={[styles.fertilizerCard, isSelected && styles.fertilizerCardSelected]}
                      activeOpacity={0.8}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.fertilizerName, isSelected && styles.fertilizerNameSelected]}>
                          {fc.name}
                        </Text>
                        <Text style={styles.fertilizerBadge}>{fc.badge}</Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Sowing Date & Method */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontSize: 13 * fontMultiplier }]}>
                {language === 'ur' ? '4. بوائی کی تاریخ اور طریقہ:' : '4. SOWING DATE & METHOD:'}
              </Text>
              <View style={styles.inlineInputs}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.inputSubLabel}>{language === 'ur' ? 'تاریخِ بوائی' : 'Sowing Date'}</Text>
                  <TextInput
                    value={sowingDate}
                    onChangeText={setSowingDate}
                    placeholder="e.g. 02 Oct 2026"
                    style={styles.textInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputSubLabel}>{language === 'ur' ? 'ہدف پیداوار (من)' : 'Target Yield (Maunds/Ac)'}</Text>
                  <TextInput
                    value={targetYield}
                    onChangeText={setTargetYield}
                    keyboardType="numeric"
                    placeholder="55"
                    style={styles.textInput}
                  />
                </View>
              </View>

              <Text style={[styles.inputSubLabel, { marginTop: 10 }]}>
                {language === 'ur' ? 'کاشت کی تکنیک' : 'Sowing Technique'}
              </Text>
              <View style={styles.chipsRow}>
                {SOWING_METHODS.map((sm) => {
                  const isSelected = sowingMethod === sm.label;
                  return (
                    <TouchableOpacity
                      key={sm.id}
                      onPress={() => setSowingMethod(sm.label)}
                      style={[styles.methodChip, isSelected && styles.methodChipSelected]}
                      activeOpacity={0.8}>
                      <Text style={[styles.methodChipText, isSelected && styles.methodChipTextSelected]}>
                        {language === 'ur' ? sm.labelUrdu : sm.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>{t.cancel}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleConfirm} style={styles.startBtn} activeOpacity={0.85}>
              <Ionicons name="leaf" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={[styles.startBtnText, { fontSize: 15 * fontMultiplier }]}>
                {language === 'ur' ? 'تصدیق کریں اور فصل شروع کریں' : 'Confirm & Start Cycle'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 28,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 8,
    color: '#0369A1',
    lineHeight: 18,
    fontWeight: '500',
  },
  scrollArea: {
    maxHeight: 460,
  },
  section: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  varietiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  varietyCard: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
  },
  varietyCardSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  varietyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  varietyName: {
    fontWeight: '700',
    fontSize: 13,
    color: '#1E293B',
  },
  varietyNameSelected: {
    color: '#15803D',
  },
  varietyNote: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
  },
  customChipActive: {
    backgroundColor: '#DCFCE7',
  },
  customChipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  customChipTextActive: {
    color: '#15803D',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  companyChip: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  companyChipSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
  },
  companyChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  companyChipTextSelected: {
    color: '#15803D',
    fontWeight: '700',
  },
  fertilizerList: {
    gap: 8,
  },
  fertilizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 10,
  },
  fertilizerCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
  },
  fertilizerName: {
    fontWeight: '700',
    fontSize: 13,
    color: '#1E293B',
  },
  fertilizerNameSelected: {
    color: '#15803D',
  },
  fertilizerBadge: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  radioCircleSelected: {
    borderColor: '#16A34A',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
  },
  inlineInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputSubLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  methodChip: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  methodChipSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
  },
  methodChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  methodChipTextSelected: {
    color: '#15803D',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  startBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#16A34A',
  },
  startBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
