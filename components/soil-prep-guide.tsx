import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, Spacing, Radius, CardStyle } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import {
  useMachineryListingsQuery,
  useBookMachineryMutation,
  useCreateMachineryMutation,
} from '@/hooks/use-machinery';
import { MachineryListingDTO } from '@/services/api-client';
import { logger } from '@/services/logger';
import { MachineryBookingCalendarModal } from '@/components/machinery-booking-calendar';

interface SoilPrepStep {
  id: number;
  machineryType: string;
  titleEn: string;
  titleUr: string;
  descEn: string;
  descUr: string;
  keyMetricEn: string;
  keyMetricUr: string;
  equipmentEn: string;
  equipmentUr: string;
  timingEn: string;
  timingUr: string;
  tipEn: string;
  tipUr: string;
  icon: string;
  color: string;
}

const PREP_STEPS: SoilPrepStep[] = [
  {
    id: 1,
    machineryType: 'chisel_plow',
    titleEn: 'Deep Plowing & Hardpan Breaking',
    titleUr: 'گہرا ہل چلانا اور سخت مٹی توڑنا',
    descEn:
      'Chisel plowing to 25–30 cm depth breaks the dense plow-pan created by previous paddy or cotton crops, allowing wheat roots to penetrate up to 1.5 meters.',
    descUr:
      'چزل یا مٹی پلٹنے والے ہل سے ۲۵ تا ۳۰ سینٹی میٹر گہرا ہل چلائیں تاکہ دھان یا کپاس کی بنائی ہوئی سخت تہہ ٹوٹے اور گندم کی جڑیں گہرائی تک پھیل سکیں۔',
    keyMetricEn: '25–30 cm Depth · 1.5m Root Room',
    keyMetricUr: '۲۵ تا ۳۰ سینٹی میٹر گہرائی · جڑوں کی نشوونما',
    equipmentEn: '75+ HP Tractor & Chisel Plow',
    equipmentUr: '۷۵ ہارس پاور ٹریکٹر اور چزل ہل',
    timingEn: '15–20 Days Pre-Sowing',
    timingUr: 'بوائی سے ۱۵ تا ۲۰ دن قبل',
    tipEn: 'Run chisel plow once every 2–3 years in rice-wheat belts to prevent subsoil compaction and improve drainage.',
    tipUr: 'دھان کے علاقوں میں ہر ۲ سے ۳ سال بعد گہرا ہل چلانے سے زمین میں پانی جذب ہونے کی صلاحیت بڑھتی ہے۔',
    icon: 'tractor',
    color: '#D97706',
  },
  {
    id: 2,
    machineryType: 'laser_leveler',
    titleEn: 'Precision Laser Land Leveling',
    titleUr: 'لیزر لینڈ لیولنگ (زمین کی ہمواری)',
    descEn:
      'Using a laser transmitter and scraper bucket to level fields ensures 25–30% water savings, eliminates low-spot waterlogging, and guarantees uniform crop stand.',
    descUr:
      'لیزر ٹرانسمیٹر کی مدد سے کھیت کو مکمل ہموار کریں۔ اس سے ۲۵ تا ۳۰ فیصد پانی کی بچت ہوتی ہے، نشیب میں پانی کھڑا نہیں ہوتا اور اگاؤ بالکل یکساں ہوتا ہے۔',
    keyMetricEn: '25–30% Water Savings · 100% Uniformity',
    keyMetricUr: '۲۵ تا ۳۰ فیصد پانی کی بچت · یکساں اگاؤ',
    equipmentEn: 'Dual-Slope Laser Leveler + 85 HP',
    equipmentUr: 'لیزر لیولر سسٹم اور ۸۵ ہارس پاور ٹریکٹر',
    timingEn: '10–14 Days Pre-Sowing',
    timingUr: 'بوائی سے ۱۰ تا ۱۴ دن قبل',
    tipEn: 'Always plow and lightly plank before laser leveling so the scraper moves loose topsoil evenly without straining the tractor.',
    tipUr: 'لیزر لیولنگ سے پہلے ہلکا ہل اور سہاگہ چلائیں تاکہ مٹی آسانی سے برابر ہو سکے۔',
    icon: 'ray-start-arrow',
    color: '#16A34A',
  },
  {
    id: 3,
    machineryType: 'tractor',
    titleEn: 'Pre-sowing Irrigation ("Rauni")',
    titleUr: 'رونی آبپاشی (بوائی سے قبل پہلا پانی)',
    descEn:
      'Apply a heavy 3 to 4-inch soaking irrigation ("Rauni") 7–10 days before sowing to establish deep soil moisture reserves necessary for rapid seed emergence.',
    descUr:
      'بوائی سے ۷ تا ۱۰ دن قبل ۳ سے ۴ انچ گہرا بھاری پانی (رونی) لگائیں تاکہ مٹی میں گہرائی تک وافر نمی ذخیرہ ہو سکے جو تیز رفتار اگاؤ کی ضمانت ہے۔',
    keyMetricEn: '3–4 Inches Flood · Deep Moisture',
    keyMetricUr: '۳ تا ۴ انچ پانی · گہری نمی',
    equipmentEn: 'Canal Supply / Tube-well Turbine',
    equipmentUr: 'نہر کا پانی یا ٹیوب ویل موٹر',
    timingEn: '7–10 Days Pre-Sowing',
    timingUr: 'بوائی سے ۷ تا ۱۰ دن قبل',
    tipEn: 'Check bunds (watts) before Rauni watering to prevent uneven seepage and germinate dormant weed seeds before tillage.',
    tipUr: 'رونی سے قبل کھیت کے بنّے مضبوط کریں تاکہ پانی ضائع نہ ہو اور جڑی بوٹیاں پہلے ہی اگ کر تلف ہو سکیں۔',
    icon: 'water',
    color: '#2563EB',
  },
  {
    id: 4,
    machineryType: 'rotavator',
    titleEn: 'Disc Harrowing & Rotavating ("Watter")',
    titleUr: 'روٹاویٹر اور وتر حالت میں باریک مٹی',
    descEn:
      'When soil reaches workable moisture ("Watter" condition), rotavate twice to crush heavy clods into a fine, crumbly seedbed suitable for certified seeds.',
    descUr:
      'جب رونی کا پانی جذب ہو کر زمین "وتر" حالت میں آئے تو دو بار روٹاویٹر چلائیں تاکہ ڈھیلے پھوٹ کر مٹی باریک، نرم اور بیج کے لیے سازگار ہو جائے۔',
    keyMetricEn: '2 Passes · Fine Crumb Seedbed',
    keyMetricUr: '۲ چکر روٹاویٹر · نرم اور باریک مٹی',
    equipmentEn: '48-Blade Rotary Tiller (Rotavator)',
    equipmentUr: '۴۸ بلیڈ والا ہیوی روٹاویٹر',
    timingEn: '2–3 Days Pre-Sowing',
    timingUr: 'بوائی سے ۲ تا ۳ دن قبل',
    tipEn: 'Test Watter by squeezing soil in your palm — it should form a ball that breaks cleanly without sticking to your fingers.',
    tipUr: 'وتر کی جانچ کے لیے مٹی کو مٹھی میں دبائیں؛ اگر لڈو بن کر آسانی سے ٹوٹ جائے اور ہاتھ کو نہ چپکے تو وتر بہترین ہے۔',
    icon: 'rotate-3d-variant',
    color: '#7C3AED',
  },
  {
    id: 5,
    machineryType: 'seed_drill',
    titleEn: 'Basal Fertilizer & Precision Drilling',
    titleUr: 'بنیادی کھاد اور خودکار ڈرل بوائی',
    descEn:
      'Incorporate basal DAP (1 to 1.5 bags/acre) into the top 10 cm. Drill certified seed (Akbar-19/Dilkash-20) at 2–3 cm depth with 22 cm row-to-row spacing.',
    descUr:
      'بوائی کے وقت ۱ تا ۱.۵ بوری ڈی اے پی فی ایکڑ ڈالیں۔ خودکار ڈرل کے ذریعے ۲ تا ۳ سینٹی میٹر گہرائی اور ۲۲ سینٹی میٹر قطار کے فاصلے پر بیج کی بوائی کریں۔',
    keyMetricEn: '50 kg DAP / Acre · 22 cm Rows',
    keyMetricUr: '۵۰ کلو ڈی اے پی · ۲۲ سینٹی میٹر فاصلہ',
    equipmentEn: 'Rabi Seed-cum-Fertilizer Drill',
    equipmentUr: 'رابی سیڈ کم فرٹیلائزر ڈرل',
    timingEn: 'Day 0 (Nov 1 – Nov 20)',
    timingUr: 'بوائی کا دن (۱ تا ۲۰ نومبر)',
    tipEn: 'Calibrate seed drill flow to 50 kg/acre before entering the field to ensure uniform plant population and higher tillering.',
    tipUr: 'بوائی شروع کرنے سے پہلے ڈرل کو ۵۰ کلو فی ایکڑ بیج پر سیٹ کریں تاکہ فصل کا اگاؤ یکساں ہو۔',
    icon: 'seed',
    color: '#EA580C',
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onStartCycle?: () => void;
}

export function SoilPrepGuideModal({ visible, onClose, onStartCycle }: Props) {
  const { language, t } = useApp();
  const isUrdu = language === 'ur';

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<MachineryListingDTO | null>(null);
  const [bookingDays, setBookingDays] = useState('2');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  // Offer Machinery modal state
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerType, setOfferType] = useState('laser_leveler');
  const [offerHP, setOfferHP] = useState('85');
  const [offerDailyRate, setOfferDailyRate] = useState('18000');
  const [offerDistrict, setOfferDistrict] = useState('Faisalabad');
  const [offerPhone, setOfferPhone] = useState('03001234567');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerStatus, setOfferStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const currentStep = PREP_STEPS[activeStepIndex];

  // TanStack Queries & Mutations
  const machineryQuery = useMachineryListingsQuery({
    machinery_type: currentStep.machineryType,
  });
  const allMachineryQuery = useMachineryListingsQuery();
  const bookMutation = useBookMachineryMutation();
  const createMachineryMutation = useCreateMachineryMutation();

  const handleBookSlot = async () => {
    if (!selectedMachine) return;
    const days = Math.max(1, parseInt(bookingDays, 10) || 1);
    setBookingStatus('sending');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    try {
      await bookMutation.mutateAsync({
        machineryId: selectedMachine.machinery_id,
        data: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          purpose_step: currentStep.machineryType,
          notes: bookingNotes || `Booked for ${currentStep.titleEn}`,
        },
      });
      setBookingStatus('success');
      setTimeout(() => {
        setBookingStatus('idle');
        setSelectedMachine(null);
        Alert.alert(
          isUrdu ? 'بکنگ کامیاب' : 'Booking Confirmed!',
          isUrdu
            ? `مشینری ${selectedMachine.title} کامیابی کے ساتھ بک ہو گئی ہے۔ مالک جلد آپ سے فون ${selectedMachine.contact_phone} پر رابطہ کرے گا۔`
            : `Booking confirmed for ${selectedMachine.title}. The owner will contact you at ${selectedMachine.contact_phone}.`
        );
      }, 1200);
    } catch (err: any) {
      setBookingStatus('idle');
      Alert.alert(isUrdu ? 'خرابی' : 'Booking Error', err?.message || 'Unable to complete booking.');
    }
  };

  const handleOfferMachinery = async () => {
    if (!offerTitle.trim()) {
      Alert.alert(isUrdu ? 'نام درکار ہے' : 'Title Required', isUrdu ? 'مشینری کا نام درج کریں۔' : 'Please enter machinery title.');
      return;
    }
    const cleanPhone = offerPhone.replace(/[\s\-]/g, '');
    const pakPhoneRegex = /^(03\d{9}|\+923\d{9})$/;
    if (!pakPhoneRegex.test(cleanPhone)) {
      Alert.alert(isUrdu ? 'غلط فون نمبر' : 'Invalid Phone', isUrdu ? 'درست پاکستانی موبائل نمبر درج کریں (03XXXXXXXXX)' : 'Enter valid Pakistani phone (03XXXXXXXXX)');
      return;
    }

    setOfferStatus('sending');
    try {
      await createMachineryMutation.mutateAsync({
        title: offerTitle.trim(),
        machinery_type: offerType,
        horsepower: parseFloat(offerHP) || undefined,
        daily_rate_pkr: parseFloat(offerDailyRate) || 10000,
        district: offerDistrict.trim() || 'Faisalabad',
        contact_phone: cleanPhone,
        description: offerDesc.trim() || undefined,
      });
      setOfferStatus('success');
      setTimeout(() => {
        setOfferStatus('idle');
        setIsOfferModalOpen(false);
        setOfferTitle('');
        setOfferDesc('');
        Alert.alert(
          isUrdu ? 'کامیابی' : 'Listed Successfully!',
          isUrdu ? 'آپ کی مشینری کرایہ کے لیے کامیابی سے پوسٹ ہو چکی ہے۔' : 'Your machinery is now available for rent on NextGenYield.'
        );
      }, 1000);
    } catch (err: any) {
      setOfferStatus('idle');
      Alert.alert(isUrdu ? 'خرابی' : 'Error', err?.message || 'Failed to list machinery.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>
              {isUrdu ? 'گندم کی بوائی سے قبل زمین کی تیاری' : 'Soil Pre-processing Guide'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isUrdu ? 'پیداوار بڑھانے کے ۵ سنہری اصول اور مشینری کرایہ' : '5 Essential Soil Stages Before Sowing'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.offerBtnTop}
            onPress={() => setIsOfferModalOpen(true)}>
            <MaterialCommunityIcons name="plus-circle" size={18} color="#16A34A" />
            <Text style={styles.offerBtnText}>{isUrdu ? 'مشین دیں' : 'Rent Out'}</Text>
          </TouchableOpacity>
        </View>

        {/* Step Progress Bar & Pills */}
        <View style={styles.stepsPillsScrollWrap}>
          <View style={styles.progressBarTrack}>
            {PREP_STEPS.map((s, idx) => (
              <View
                key={s.id}
                style={[
                  styles.progressSegment,
                  idx <= activeStepIndex && { backgroundColor: currentStep.color },
                ]}
              />
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepsPillScroll}>
            {PREP_STEPS.map((s, idx) => {
              const active = idx === activeStepIndex;
              const completed = idx < activeStepIndex;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.stepPill,
                    active && { backgroundColor: s.color, borderColor: s.color },
                    completed && styles.stepPillCompleted,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setActiveStepIndex(idx)}>
                  {completed ? (
                    <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                  ) : (
                    <MaterialCommunityIcons
                      name={s.icon as any}
                      size={16}
                      color={active ? '#FFFFFF' : '#64748B'}
                    />
                  )}
                  <Text
                    style={[
                      styles.stepPillText,
                      active && styles.stepPillTextActive,
                      completed && { color: '#15803D' },
                    ]}>
                    {isUrdu ? `مرحلہ ${idx + 1}` : `Stage ${idx + 1}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Main Content Area */}
        <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          {/* Redesigned Agronomic Stage Card */}
          <View style={styles.stageCard}>
            {/* Tinted Hero Banner */}
            <View style={[styles.stageHeroBanner, { backgroundColor: currentStep.color + '12', borderBottomColor: currentStep.color + '25' }]}>
              <View style={[styles.heroIconMedallion, { backgroundColor: currentStep.color }]}>
                <MaterialCommunityIcons name={currentStep.icon as any} size={28} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={styles.stageBadgeRow}>
                  <View style={[styles.stageCountPill, { backgroundColor: currentStep.color + '20' }]}>
                    <Text style={[styles.stageCountText, { color: currentStep.color }]}>
                      {isUrdu ? `مرحلہ ${currentStep.id} از 5` : `STAGE ${currentStep.id} OF 5`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.stepTitle}>
                  {isUrdu ? currentStep.titleUr : currentStep.titleEn}
                </Text>
              </View>
            </View>

            {/* Card Body */}
            <View style={styles.stageCardBody}>
              {/* Key Metric Highlight */}
              <View style={[styles.metricHighlightPill, { backgroundColor: currentStep.color + '10', borderColor: currentStep.color + '30' }]}>
                <Ionicons name="speedometer-outline" size={16} color={currentStep.color} />
                <Text style={[styles.metricHighlightText, { color: currentStep.color }]}>
                  {isUrdu ? currentStep.keyMetricUr : currentStep.keyMetricEn}
                </Text>
              </View>

              {/* Stage Description & Guidance */}
              <Text style={styles.stepDescription}>
                {isUrdu ? currentStep.descUr : currentStep.descEn}
              </Text>

              {/* 2-Column Quick Specs Grid */}
              <View style={styles.specsGrid}>
                <View style={styles.specBox}>
                  <View style={styles.specBoxHeader}>
                    <MaterialCommunityIcons name="wrench-outline" size={15} color="#16A34A" />
                    <Text style={styles.specBoxLabel}>{isUrdu ? 'تجویز کردہ مشینری' : 'EQUIPMENT'}</Text>
                  </View>
                  <Text style={styles.specBoxVal}>
                    {isUrdu ? currentStep.equipmentUr : currentStep.equipmentEn}
                  </Text>
                </View>

                <View style={styles.specBox}>
                  <View style={styles.specBoxHeader}>
                    <Ionicons name="calendar-outline" size={15} color="#0284C7" />
                    <Text style={styles.specBoxLabel}>{isUrdu ? 'مناسب وقت' : 'TIMING'}</Text>
                  </View>
                  <Text style={styles.specBoxVal}>
                    {isUrdu ? currentStep.timingUr : currentStep.timingEn}
                  </Text>
                </View>
              </View>

              {/* Agronomist Pro Tip */}
              <View style={styles.proTipBox}>
                <View style={styles.proTipIconWrap}>
                  <Ionicons name="bulb" size={16} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.proTipLabel}>{isUrdu ? 'ماہرِ زراعت کا مشورہ' : 'AGRONOMIST TIP'}</Text>
                  <Text style={styles.proTipText}>
                    {isUrdu ? currentStep.tipUr : currentStep.tipEn}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Single Unified Machinery Rental CTA */}
          <TouchableOpacity
            style={styles.rentMachineryCta}
            activeOpacity={0.85}
            onPress={() => setIsRentalModalOpen(true)}>
            <View style={styles.rentCtaIconWrap}>
              <MaterialCommunityIcons name="tractor" size={22} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rentMachineryCtaTitle}>
                {isUrdu ? 'مشینری کرایہ پر لیں اور بک کریں' : 'Rent Machinery & Book Slot'}
              </Text>
              <Text style={styles.rentMachineryCtaSub}>
                {isUrdu
                  ? 'ٹریکٹر، لیزر لیولر، روٹاویٹر اور ڈرل دستیاب ہیں'
                  : 'Browse verified tractors, laser levelers, rotavators & drills'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>

        {/* Sticky Bottom Navigation Bar */}
        <View style={styles.stickyFooter}>
          <TouchableOpacity
            style={[styles.navBtn, activeStepIndex === 0 && { opacity: 0.4 }]}
            disabled={activeStepIndex === 0}
            activeOpacity={0.75}
            onPress={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}>
            <Ionicons name="arrow-back" size={18} color="#475569" />
            <Text style={styles.navBtnText}>{isUrdu ? 'پچھلا' : 'Previous'}</Text>
          </TouchableOpacity>

          {activeStepIndex < PREP_STEPS.length - 1 ? (
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnPrimary]}
              activeOpacity={0.85}
              onPress={() => setActiveStepIndex((prev) => prev + 1)}>
              <Text style={styles.navBtnPrimaryText}>{isUrdu ? 'اگلا مرحلہ' : 'Next Stage'}</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnSuccess]}
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                if (onStartCycle) onStartCycle();
              }}>
              <Text style={styles.navBtnPrimaryText}>{isUrdu ? 'فصل شروع کریں' : 'Start Crop Cycle'}</Text>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Machinery Hire & Booking Modal */}
        <Modal visible={isRentalModalOpen} animationType="slide" transparent={false} statusBarTranslucent onRequestClose={() => setIsRentalModalOpen(false)}>
          <SafeAreaView style={styles.modalFullContainer} edges={['top', 'bottom']}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setIsRentalModalOpen(false)} style={styles.closeBtn}>
                <Ionicons name="arrow-back" size={24} color="#0F172A" />
              </TouchableOpacity>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.headerTitle}>
                  {isUrdu ? 'مشینری کرایہ اور بکنگ' : 'Farm Machinery Rentals'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {isUrdu ? 'ٹریکٹر، لیزر لیولر، روٹاویٹر وقت پر بک کریں' : 'Verified agricultural equipment in Punjab'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.offerBtnTop}
                onPress={() => {
                  setIsRentalModalOpen(false);
                  setIsOfferModalOpen(true);
                }}>
                <MaterialCommunityIcons name="plus" size={18} color="#16A34A" />
                <Text style={styles.offerBtnText}>{isUrdu ? 'لسٹ کریں' : '+ List'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
              {allMachineryQuery.isLoading ? (
                <View style={styles.centerState}>
                  <ActivityIndicator size="large" color="#16A34A" />
                  <Text style={styles.centerStateText}>{isUrdu ? 'مشینری لوڈ ہو رہی ہے...' : 'Loading machinery listings...'}</Text>
                </View>
              ) : allMachineryQuery.data?.length === 0 ? (
                <View style={styles.centerState}>
                  <MaterialCommunityIcons name="tractor" size={48} color="#94A3B8" />
                  <Text style={styles.centerStateText}>{isUrdu ? 'کوئی مشینری دستیاب نہیں ہے' : 'No machinery listed currently.'}</Text>
                </View>
              ) : (
                allMachineryQuery.data?.map((item) => (
                  <View key={item.machinery_id} style={styles.machineryCard}>
                    <View style={styles.machineryCardHeader}>
                      <View style={styles.machineryTypeBadge}>
                        <MaterialCommunityIcons name="tractor" size={18} color="#16A34A" />
                        <Text style={styles.machineryTypeBadgeText}>{item.machinery_type.replace('_', ' ').toUpperCase()}</Text>
                      </View>
                      <View style={styles.districtBadge}>
                        <Ionicons name="location-outline" size={14} color="#64748B" />
                        <Text style={styles.districtBadgeText}>{item.district}</Text>
                      </View>
                    </View>

                    <Text style={styles.machineryTitle}>{item.title}</Text>
                    {item.brand_model ? <Text style={styles.brandModelText}>{item.brand_model} · {item.horsepower ? `${item.horsepower} HP` : 'Heavy Duty'}</Text> : null}
                    {item.description ? <Text style={styles.machineryDesc}>{item.description}</Text> : null}

                    {/* Price and Action */}
                    <View style={styles.priceRow}>
                      <View>
                        <Text style={styles.priceRateLabel}>{isUrdu ? 'کرایہ فی دن' : 'Daily Hire Rate:'}</Text>
                        <Text style={styles.priceValue}>PKR {item.daily_rate_pkr.toLocaleString()} <Text style={styles.perUnit}>/ day</Text></Text>
                        {item.hourly_rate_pkr ? (
                          <Text style={styles.hourlyText}>PKR {item.hourly_rate_pkr.toLocaleString()} / hour</Text>
                        ) : null}
                      </View>

                      <TouchableOpacity
                        style={styles.bookSlotBtn}
                        onPress={() => setSelectedMachine(item)}>
                        <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.bookSlotBtnText}>{isUrdu ? 'بک کریں' : 'Book Slot'}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Existing Booked Slots Indicator */}
                    {item.bookings && item.bookings.length > 0 ? (
                      <View style={styles.bookedBanner}>
                        <Ionicons name="time-outline" size={14} color="#D97706" />
                        <Text style={styles.bookedBannerText}>
                          {isUrdu
                            ? `${item.bookings.length} تاریخیں پہلے سے بک ہیں`
                            : `${item.bookings.length} active schedule booking(s)`}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Interactive Machinery Booking Calendar & Daily Slots Modal */}
        <MachineryBookingCalendarModal
          visible={!!selectedMachine}
          machinery={selectedMachine}
          purposeStep={currentStep.machineryType}
          onClose={() => setSelectedMachine(null)}
          onBookingSuccess={() => setSelectedMachine(null)}
        />

        {/* Offer Machinery for Rent Modal */}
        <Modal visible={isOfferModalOpen} animationType="slide" transparent={false} statusBarTranslucent onRequestClose={() => setIsOfferModalOpen(false)}>
          <SafeAreaView style={styles.modalFullContainer} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setIsOfferModalOpen(false)} style={styles.closeBtn}>
                  <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                  <Text style={styles.headerTitle}>
                    {isUrdu ? 'اپنی مشینری کرایہ کے لیے پیش کریں' : 'List Machinery for Rent'}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    {isUrdu ? 'علاقے کے کسانوں کو کرایہ پر دے کر آمدنی حاصل کریں' : 'Offer your tractor, laser leveler or drill'}
                  </Text>
                </View>
              </View>

              <ScrollView
                style={styles.bodyScroll}
                contentContainerStyle={styles.bodyContent}
                keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>{isUrdu ? 'مشینری کا نام اور ماڈل *' : 'Machinery Name & Model *'}</Text>
              <TextInput
                style={styles.textInput}
                value={offerTitle}
                onChangeText={setOfferTitle}
                placeholder="e.g. Massey Ferguson 385 + Laser Leveler"
              />

              <Text style={styles.inputLabel}>{isUrdu ? 'مشینری کی قسم' : 'Machinery Category'}</Text>
              <View style={styles.typeSelectorRow}>
                {[
                  { key: 'laser_leveler', label: 'Laser Leveler' },
                  { key: 'tractor', label: 'Tractor' },
                  { key: 'rotavator', label: 'Rotavator' },
                  { key: 'seed_drill', label: 'Seed Drill' },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.typeOptionPill, offerType === t.key && styles.typeOptionPillActive]}
                    onPress={() => setOfferType(t.key)}>
                    <Text style={[styles.typeOptionText, offerType === t.key && styles.typeOptionTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{isUrdu ? 'ہارس پاور' : 'Horsepower (HP)'}</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={offerHP}
                    onChangeText={setOfferHP}
                    placeholder="85"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{isUrdu ? 'کرایہ فی دن (PKR) *' : 'Daily Rate (PKR) *'}</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={offerDailyRate}
                    onChangeText={setOfferDailyRate}
                    placeholder="18000"
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{isUrdu ? 'ضلع / علاقہ *' : 'District *'}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={offerDistrict}
                    onChangeText={setOfferDistrict}
                    placeholder="Faisalabad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{isUrdu ? 'موبائل نمبر *' : 'Contact Phone *'}</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="phone-pad"
                    value={offerPhone}
                    onChangeText={setOfferPhone}
                    placeholder="03001234567"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>{isUrdu ? 'تفصیل اور خصوصیات' : 'Description / Condition'}</Text>
              <TextInput
                style={[styles.textInput, { height: 70 }]}
                multiline
                value={offerDesc}
                onChangeText={setOfferDesc}
                placeholder="High precision mast, experienced driver included, etc."
              />

              <TouchableOpacity
                style={[styles.confirmBookingBtn, offerStatus === 'sending' && { opacity: 0.7 }]}
                disabled={offerStatus === 'sending'}
                onPress={handleOfferMachinery}>
                {offerStatus === 'sending' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="publish" size={20} color="#FFFFFF" />
                    <Text style={styles.confirmBookingBtnText}>
                      {isUrdu ? 'مشینری کرایہ کے لیے لسٹ کریں' : 'Publish Machinery Listing'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalFullContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    marginTop: 2,
  },
  offerBtnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  offerBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: '#16A34A',
  },
  stepsPillsScrollWrap: {
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  progressBarTrack: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  stepsPillScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepPillCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  stepPillText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  stepPillTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semiBold,
  },
  bodyScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 24,
  },
  stageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...CardStyle,
  },
  stageHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  heroIconMedallion: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageBadgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  stageCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stageCountText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: 16.5,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    lineHeight: 22,
  },
  stageCardBody: {
    padding: 16,
  },
  metricHighlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  metricHighlightText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    flex: 1,
  },
  stepDescription: {
    fontSize: 13.5,
    lineHeight: 21,
    fontFamily: FontFamily.regular,
    color: '#334155',
    marginBottom: 16,
  },
  specsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  specBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  specBoxLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#64748B',
    letterSpacing: 0.4,
  },
  specBoxVal: {
    fontSize: 12.5,
    fontFamily: FontFamily.semiBold,
    color: '#0F172A',
    lineHeight: 17,
  },
  proTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  proTipIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  proTipLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#15803D',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  proTipText: {
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    color: '#166534',
    lineHeight: 18,
  },
  rentMachineryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#16A34A',
    ...CardStyle,
  },
  rentCtaIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rentMachineryCtaTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: FontFamily.bold,
  },
  rentMachineryCtaSub: {
    color: '#DCFCE7',
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
  stickyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  navBtnText: {
    fontSize: 13.5,
    fontFamily: FontFamily.semiBold,
    color: '#475569',
  },
  navBtnPrimary: {
    flex: 1.5,
    backgroundColor: '#0F172A',
  },
  navBtnSuccess: {
    flex: 1.5,
    backgroundColor: '#16A34A',
  },
  navBtnPrimaryText: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  machineryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...CardStyle,
  },
  machineryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  machineryTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  machineryTypeBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  districtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  districtBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  machineryTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  brandModelText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 2,
  },
  machineryDesc: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#334155',
    marginVertical: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceRateLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  priceValue: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  perUnit: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
  },
  hourlyText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  bookSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  bookSlotBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
  },
  bookedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  bookedBannerText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#B45309',
  },
  centerState: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  centerStateText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    padding: 20,
  },
  bookingDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    ...CardStyle,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dialogTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  dialogMachineTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: '#16A34A',
  },
  dialogMachineLocation: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#334155',
    marginBottom: 4,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  costBox: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#166534',
  },
  costValue: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  confirmBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 16,
  },
  confirmBookingBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  typeOptionPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeOptionPillActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  typeOptionText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
});
