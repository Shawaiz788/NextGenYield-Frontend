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
  icon: string;
  color: string;
}

const PREP_STEPS: SoilPrepStep[] = [
  {
    id: 1,
    machineryType: 'chisel_plow',
    titleEn: '1. Deep Plowing & Hardpan Breaking',
    titleUr: '۱. گہرا ہل چلانا اور سخت مٹی توڑنا',
    descEn:
      'Chisel plowing to 25–30 cm depth breaks the dense plow-pan created by previous paddy or cotton crops, allowing wheat roots to penetrate up to 1.5 meters.',
    descUr:
      'چزل یا مٹی پلٹنے والے ہل سے ۲۵ تا ۳۰ سینٹی میٹر گہرا ہل چلائیں تاکہ دھان یا کپاس کی بنائی ہوئی سخت تہہ ٹوٹے اور گندم کی جڑیں گہرائی تک پھیل سکیں۔',
    keyMetricEn: '25–30 cm Depth · 1.5m Root Room',
    keyMetricUr: '۲۵ تا ۳۰ سینٹی میٹر گہرائی · جڑوں کی نشوونما',
    equipmentEn: '75+ HP Tractor & Chisel Plow',
    equipmentUr: '۷۵ ہارس پاور ٹریکٹر اور چزل ہل',
    icon: 'tractor',
    color: '#D97706',
  },
  {
    id: 2,
    machineryType: 'laser_leveler',
    titleEn: '2. Precision Laser Land Leveling',
    titleUr: '۲. لیزر لینڈ لیولنگ (زمین کی ہمواری)',
    descEn:
      'Using a laser transmitter and scraper bucket to level fields ensures 25–30% water savings, eliminates low-spot waterlogging, and guarantees uniform crop stand.',
    descUr:
      'لیزر ٹرانسمیٹر کی مدد سے کھیت کو مکمل ہموار کریں۔ اس سے ۲۵ تا ۳۰ فیصد پانی کی بچت ہوتی ہے، نشیب میں پانی کھڑا نہیں ہوتا اور اگاؤ بالکل یکساں ہوتا ہے۔',
    keyMetricEn: '25–30% Water Savings · 100% Uniformity',
    keyMetricUr: '۲۵ تا ۳۰ فیصد پانی کی بچت · یکساں اگاؤ',
    equipmentEn: 'Dual-Slope Laser Leveler + 85 HP Tractor',
    equipmentUr: 'لیزر لیولر سسٹم اور ۸۵ ہارس پاور ٹریکٹر',
    icon: 'ray-start-arrow',
    color: '#16A34A',
  },
  {
    id: 3,
    machineryType: 'tractor',
    titleEn: '3. Pre-sowing Irrigation ("Rauni")',
    titleUr: '۳. رونی آبپاشی (بوائی سے قبل پہلا پانی)',
    descEn:
      'Apply a heavy 3 to 4-inch soaking irrigation ("Rauni") 7–10 days before sowing to establish deep soil moisture reserves necessary for rapid seed emergence.',
    descUr:
      'بوائی سے ۷ تا ۱۰ دن قبل ۳ سے ۴ انچ گہرا بھاری پانی (رونی) لگائیں تاکہ مٹی میں گہرائی تک وافر نمی ذخیرہ ہو سکے جو تیز رفتار اگاؤ کی ضمانت ہے۔',
    keyMetricEn: '3–4 Inches Flood · 7–10 Days Pre-Sowing',
    keyMetricUr: '۳ تا ۴ انچ پانی · بوائی سے ۷ تا ۱۰ دن قبل',
    equipmentEn: 'Canal Supply / Tube-well Turbine',
    equipmentUr: 'نہر کا پانی یا ٹیوب ویل موٹر',
    icon: 'water',
    color: '#2563EB',
  },
  {
    id: 4,
    machineryType: 'rotavator',
    titleEn: '4. Disc Harrowing & Rotavating ("Watter")',
    titleUr: '۴. روٹاویٹر اور وتر حالت میں باریک مٹی',
    descEn:
      'When soil reaches workable moisture ("Watter" condition), rotavate twice to crush heavy clods into a fine, crumbly seedbed suitable for certified seeds.',
    descUr:
      'جب رونی کا پانی جذب ہو کر زمین "وتر" حالت میں آئے تو دو بار روٹاویٹر چلائیں تاکہ ڈھیلے پھوٹ کر مٹی باریک، نرم اور بیج کے لیے سازگار ہو جائے۔',
    keyMetricEn: '2 Passes · Fine Crumb Seedbed',
    keyMetricUr: '۲ چکر روٹاویٹر · نرم اور باریک بیج کی جگہ',
    equipmentEn: '48-Blade Rotary Tiller (Rotavator)',
    equipmentUr: '۴۸ بلیڈ والا ہیوی روٹاویٹر',
    icon: 'rotate-3d-variant',
    color: '#7C3AED',
  },
  {
    id: 5,
    machineryType: 'seed_drill',
    titleEn: '5. Basal Fertilizer & Precision Drilling',
    titleUr: '۵. بنیادی کھاد اور خودکار ڈرل بوائی',
    descEn:
      'Incorporate basal DAP (1 to 1.5 bags/acre) into the top 10 cm. Drill certified seed (Akbar-19/Dilkash-20) at 2–3 cm depth with 22 cm row-to-row spacing.',
    descUr:
      'بوائی کے وقت ۱ تا ۱.۵ بوری ڈی اے پی فی ایکڑ ڈالیں۔ خودکار ڈرل کے ذریعے ۲ تا ۳ سینٹی میٹر گہرائی اور ۲۲ سینٹی میٹر قطار کے فاصلے پر بیج کی بوائی کریں۔',
    keyMetricEn: '50 kg DAP / Acre · 22 cm Row Spacing',
    keyMetricUr: '۵۰ کلو ڈی اے پی · ۲۲ سینٹی میٹر قطار کا فاصلہ',
    equipmentEn: 'Rabi Seed-cum-Fertilizer Drill',
    equipmentUr: 'رابی سیڈ کم فرٹیلائزر ڈرل',
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

        {/* Step Progress Pills */}
        <View style={styles.stepsPillsScrollWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepsPillScroll}>
            {PREP_STEPS.map((s, idx) => {
              const active = idx === activeStepIndex;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.stepPill, active && { backgroundColor: s.color, borderColor: s.color }]}
                  onPress={() => setActiveStepIndex(idx)}>
                  <MaterialCommunityIcons
                    name={s.icon as any}
                    size={18}
                    color={active ? '#FFFFFF' : '#64748B'}
                  />
                  <Text style={[styles.stepPillText, active && styles.stepPillTextActive]}>
                    {isUrdu ? `مرحلہ ${idx + 1}` : `Stage ${idx + 1}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Main Content Area */}
        <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
          {/* Animated/Interactive Simulation Card */}
          <View style={[styles.simulationCard, { borderColor: currentStep.color + '40' }]}>
            <View style={styles.simulationHeader}>
              <View style={[styles.simIconBadge, { backgroundColor: currentStep.color + '20' }]}>
                <MaterialCommunityIcons name={currentStep.icon as any} size={28} color={currentStep.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.stepTitle}>
                  {isUrdu ? currentStep.titleUr : currentStep.titleEn}
                </Text>
                <Text style={[styles.metricBadgeText, { color: currentStep.color }]}>
                  {isUrdu ? currentStep.keyMetricUr : currentStep.keyMetricEn}
                </Text>
              </View>
            </View>

            {/* Visual Graphic Representation */}
            <View style={styles.visualCanvas}>
              {activeStepIndex === 1 ? (
                // Laser Leveling Animation Graphic
                <View style={styles.laserVisualBox}>
                  <View style={styles.laserTransmitter}>
                    <View style={styles.laserMast} />
                    <View style={styles.laserBeacon} />
                    <View style={styles.laserBeamLine} />
                  </View>
                  <View style={styles.laserTractorWrap}>
                    <MaterialCommunityIcons name="tractor" size={44} color="#16A34A" />
                    <View style={styles.scraperBlade} />
                  </View>
                  <View style={styles.groundLevelLine} />
                  <Text style={styles.laserCaption}>
                    {isUrdu ? 'درست لیزر سگنل · زمین ۱۰۰٪ ہموار' : 'Dual-Slope Laser Alignment · 0% Water Logging'}
                  </Text>
                </View>
              ) : activeStepIndex === 0 ? (
                // Deep Plowing Graphic
                <View style={styles.plowVisualBox}>
                  <View style={styles.soilLayers}>
                    <View style={styles.soilLayerTop}><Text style={styles.layerText}>Topsoil (0–15cm)</Text></View>
                    <View style={styles.soilLayerPan}><Text style={styles.layerPanText}>⚡ Broken Hardpan (25–30cm)</Text></View>
                    <View style={styles.soilLayerSub}><Text style={styles.layerSubText}>Deep Root Zone (up to 1.5m)</Text></View>
                  </View>
                </View>
              ) : activeStepIndex === 2 ? (
                // Rauni Watering Graphic
                <View style={styles.rauniVisualBox}>
                  <MaterialCommunityIcons name="water" size={48} color="#2563EB" />
                  <Text style={styles.rauniWaterCaption}>
                    {isUrdu ? '۳ تا ۴ انچ گہرا پانی مٹی کی گہرائی تک نمی برقرار رکھتا ہے' : 'Heavy 3–4 Inch Rauni Soaking Saturates Profile'}
                  </Text>
                </View>
              ) : (
                <View style={styles.genericVisualBox}>
                  <MaterialCommunityIcons name={currentStep.icon as any} size={54} color={currentStep.color} />
                  <Text style={styles.genericVisualText}>
                    {isUrdu ? currentStep.equipmentUr : currentStep.equipmentEn}
                  </Text>
                </View>
              )}
            </View>

            {/* Stage Description & Guidance */}
            <Text style={styles.stepDescription}>
              {isUrdu ? currentStep.descUr : currentStep.descEn}
            </Text>

            {/* Equipment Recommendation */}
            <View style={styles.equipmentRow}>
              <MaterialCommunityIcons name="wrench-outline" size={18} color="#64748B" />
              <Text style={styles.equipmentLabel}>{isUrdu ? 'تجویز کردہ مشینری:' : 'Equipment:'}</Text>
              <Text style={styles.equipmentVal}>{isUrdu ? currentStep.equipmentUr : currentStep.equipmentEn}</Text>
            </View>
          </View>

          {/* Action CTAs */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.rentMachineryCta, { backgroundColor: currentStep.color }]}
              onPress={() => setIsRentalModalOpen(true)}>
              <MaterialCommunityIcons name="key-variant" size={20} color="#FFFFFF" />
              <Text style={styles.rentMachineryCtaText}>
                {isUrdu ? 'اس مرحلے کی مشینری کرایہ پر لیں' : `Hire ${currentStep.machineryType.replace('_', ' ')}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.allMachineryBtn}
              onPress={() => setIsRentalModalOpen(true)}>
              <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#0F172A" />
              <Text style={styles.allMachineryBtnText}>{isUrdu ? 'تمام مشینری' : 'All Machinery'}</Text>
            </TouchableOpacity>
          </View>

          {/* Next/Prev Navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, activeStepIndex === 0 && { opacity: 0.3 }]}
              disabled={activeStepIndex === 0}
              onPress={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}>
              <Ionicons name="arrow-back" size={18} color="#475569" />
              <Text style={styles.navBtnText}>{isUrdu ? 'پچھلا مرحلہ' : 'Previous'}</Text>
            </TouchableOpacity>

            {activeStepIndex < PREP_STEPS.length - 1 ? (
              <TouchableOpacity
                style={[styles.navBtn, styles.navBtnPrimary]}
                onPress={() => setActiveStepIndex((prev) => prev + 1)}>
                <Text style={styles.navBtnPrimaryText}>{isUrdu ? 'اگلا مرحلہ' : 'Next Step'}</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navBtn, styles.navBtnSuccess]}
                onPress={() => {
                  onClose();
                  if (onStartCycle) onStartCycle();
                }}>
                <Text style={styles.navBtnPrimaryText}>{isUrdu ? 'فصل شروع کریں' : 'Start Cycle'}</Text>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

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

            <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    paddingBottom: 40,
  },
  simulationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    ...CardStyle,
  },
  simulationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  simIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  metricBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    marginTop: 3,
  },
  visualCanvas: {
    height: 140,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginVertical: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  laserVisualBox: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  laserTransmitter: {
    position: 'absolute',
    left: 24,
    bottom: 24,
    alignItems: 'center',
  },
  laserMast: {
    width: 4,
    height: 60,
    backgroundColor: '#64748B',
  },
  laserBeacon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
  },
  laserBeamLine: {
    position: 'absolute',
    top: 6,
    left: 7,
    width: 240,
    height: 2,
    backgroundColor: '#EF4444',
    opacity: 0.7,
  },
  laserTractorWrap: {
    position: 'absolute',
    right: 40,
    bottom: 20,
    alignItems: 'center',
  },
  scraperBlade: {
    width: 50,
    height: 6,
    backgroundColor: '#334155',
    marginTop: -2,
    borderRadius: 2,
  },
  groundLevelLine: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#16A34A',
  },
  laserCaption: {
    position: 'absolute',
    top: 8,
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: '#0F172A',
    backgroundColor: '#FFFFFFCC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  plowVisualBox: {
    width: '90%',
  },
  soilLayers: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  soilLayerTop: {
    backgroundColor: '#78350F',
    padding: 6,
    alignItems: 'center',
  },
  soilLayerPan: {
    backgroundColor: '#451A03',
    padding: 6,
    alignItems: 'center',
  },
  soilLayerSub: {
    backgroundColor: '#1C1917',
    padding: 6,
    alignItems: 'center',
  },
  layerText: {
    color: '#FEF3C7',
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  layerPanText: {
    color: '#F87171',
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  layerSubText: {
    color: '#A8A29E',
    fontSize: 10,
    fontFamily: FontFamily.regular,
  },
  rauniVisualBox: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  rauniWaterCaption: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#1E40AF',
    textAlign: 'center',
  },
  genericVisualBox: {
    alignItems: 'center',
    gap: 6,
  },
  genericVisualText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: '#334155',
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
    color: '#334155',
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  equipmentLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  equipmentVal: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: '#0F172A',
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  rentMachineryCta: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    elevation: 2,
  },
  rentMachineryCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
  },
  allMachineryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  allMachineryBtnText: {
    color: '#0F172A',
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  navBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  navBtnPrimary: {
    backgroundColor: '#0F172A',
  },
  navBtnSuccess: {
    backgroundColor: '#16A34A',
  },
  navBtnPrimaryText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
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
