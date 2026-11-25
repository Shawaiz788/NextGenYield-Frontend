import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, Spacing, Radius, CardStyle, PrimaryButtonShadow, MetricNumberStyle } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import {
  MachineryListingDTO,
  MachineryDayAvailabilityDTO,
  MachineryDailySlotDTO,
} from '@/services/api-client';
import {
  useMachineryScheduleQuery,
  useBookMachineryMutation,
} from '@/hooks/use-machinery';

interface MachineryBookingCalendarModalProps {
  visible: boolean;
  machinery: MachineryListingDTO | null;
  purposeStep?: string;
  onClose: () => void;
  onBookingSuccess?: () => void;
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_UR = [
  'جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون',
  'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'
];

const WEEKDAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const WEEKDAYS_UR = ['سو', 'من', 'بد', 'جمع', 'جم', 'ہف', 'ات'];

export function MachineryBookingCalendarModal({
  visible,
  machinery,
  purposeStep,
  onClose,
  onBookingSuccess,
}: MachineryBookingCalendarModalProps) {
  const { language, fontMultiplier } = useApp();
  const isUrdu = language === 'ur';

  const today = useMemo(() => new Date(), []);
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [selectedSlotId, setSelectedSlotId] = useState<string>('morning');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const monthParam = useMemo(() => {
    const y = selectedMonthDate.getFullYear();
    const m = String(selectedMonthDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [selectedMonthDate]);

  const scheduleQuery = useMachineryScheduleQuery(
    visible && machinery ? machinery.machinery_id : null,
    monthParam
  );
  const bookMutation = useBookMachineryMutation();

  const handlePrevMonth = () => {
    const prev = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() - 1, 1);
    // Don't go to past months
    if (prev.getFullYear() < today.getFullYear() || 
       (prev.getFullYear() === today.getFullYear() && prev.getMonth() < today.getMonth())) {
      return;
    }
    setSelectedMonthDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() + 1, 1);
    setSelectedMonthDate(next);
  };

  // Calendar day grid calculation
  const calendarGrid = useMemo(() => {
    const year = selectedMonthDate.getFullYear();
    const month = selectedMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    // Monday as 0, Sunday as 6
    let startingDay = firstDay.getDay() - 1;
    if (startingDay === -1) startingDay = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const blanks: number[] = Array.from({ length: startingDay }, (_, i) => i);
    const days: number[] = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return { blanks, days, year, month };
  }, [selectedMonthDate]);

  // Client-side fallback schedule calculation from machinery.bookings
  const fallbackSchedule = useMemo(() => {
    if (!machinery) return new Map<string, MachineryDayAvailabilityDTO>();

    const year = selectedMonthDate.getFullYear();
    const month = selectedMonthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const map = new Map<string, MachineryDayAvailabilityDTO>();

    const hourlyRate = machinery.hourly_rate_pkr || Math.round(machinery.daily_rate_pkr / 8);
    const dailyRate = machinery.daily_rate_pkr;
    const bookings = machinery.bookings || [];

    const slotDefs = [
      { slot_id: 'morning', label_en: 'Morning Slot (8 AM - 12 PM)', label_ur: 'صبح کا وقت (8 تا 12)', start: [8, 0], end: [12, 0], hours: 4.0, price: Math.round(hourlyRate * 4.0) },
      { slot_id: 'afternoon', label_en: 'Afternoon Slot (1 PM - 5 PM)', label_ur: 'دوپہر کا وقت (1 تا 5)', start: [13, 0], end: [17, 0], hours: 4.0, price: Math.round(hourlyRate * 4.0) },
      { slot_id: 'evening', label_en: 'Evening Slot (6 PM - 9 PM)', label_ur: 'شام کا وقت (6 تا 9)', start: [18, 0], end: [21, 0], hours: 3.0, price: Math.round(hourlyRate * 3.0) },
      { slot_id: 'full_day', label_en: 'Full Working Day (8 AM - 6 PM)', label_ur: 'مکمل دن (8 تا 6)', start: [8, 0], end: [18, 0], hours: 10.0, price: dailyRate },
    ];

    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d);
      const isPast = dayDate < todayDate;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      let regularSlotsBooked = 0;
      const slots: MachineryDailySlotDTO[] = [];

      for (const sDef of slotDefs) {
        const slotStart = new Date(year, month, d, sDef.start[0], sDef.start[1], 0);
        const slotEnd = new Date(year, month, d, sDef.end[0], sDef.end[1], 0);

        // 1-hour transit buffer
        let isAvail = !isPast;
        if (isAvail) {
          for (const b of bookings) {
            const bStart = new Date(b.start_date);
            const bEnd = new Date(b.end_date);
            const bufferMs = 60 * 60 * 1000;
            if (slotStart.getTime() < (bEnd.getTime() + bufferMs) && slotEnd.getTime() > (bStart.getTime() - bufferMs)) {
              isAvail = false;
              break;
            }
          }
        }

        if (sDef.slot_id !== 'full_day' && !isAvail) {
          regularSlotsBooked++;
        }

        slots.push({
          slot_id: sDef.slot_id,
          label_en: sDef.label_en,
          label_ur: sDef.label_ur,
          start_time: `${String(sDef.start[0]).padStart(2, '0')}:${String(sDef.start[1]).padStart(2, '0')}`,
          end_time: `${String(sDef.end[0]).padStart(2, '0')}:${String(sDef.end[1]).padStart(2, '0')}`,
          duration_hours: sDef.hours,
          is_available: isAvail,
          price_pkr: sDef.price,
        });
      }

      // Full day is only available if all 3 partial slots are available
      for (const s of slots) {
        if (s.slot_id === 'full_day' && regularSlotsBooked > 0) {
          s.is_available = false;
        }
      }

      const isFullyBooked = !isPast && regularSlotsBooked >= 3;
      const dayStatus = isPast ? 'past' : isFullyBooked ? 'fully_booked' : 'available';

      map.set(dateStr, {
        date: dateStr,
        day_status: dayStatus,
        is_fully_booked: isFullyBooked,
        slots,
      });
    }

    return map;
  }, [machinery, selectedMonthDate, today]);

  // Combined availability map: prefer server data if available, fallback to client-side
  const availabilityMap = useMemo(() => {
    if (scheduleQuery.data?.days && scheduleQuery.data.days.length > 0) {
      const map = new Map<string, MachineryDayAvailabilityDTO>();
      for (const d of scheduleQuery.data.days) {
        map.set(d.date, d);
      }
      return map;
    }
    return fallbackSchedule;
  }, [scheduleQuery.data, fallbackSchedule]);

  const selectedDayAvailability = useMemo(() => {
    return availabilityMap.get(selectedDateStr);
  }, [availabilityMap, selectedDateStr]);

  const selectedSlot = useMemo(() => {
    if (!selectedDayAvailability) return null;
    return selectedDayAvailability.slots.find((s) => s.slot_id === selectedSlotId) || null;
  }, [selectedDayAvailability, selectedSlotId]);

  const handleConfirmBooking = async () => {
    if (!machinery || !selectedDayAvailability || !selectedSlot) {
      Alert.alert(isUrdu ? 'سلاٹ منتخب کریں' : 'Select Slot', isUrdu ? 'براہ کرم دستیاب سلاٹ منتخب کریں۔' : 'Please select an available time slot.');
      return;
    }

    if (!selectedSlot.is_available) {
      Alert.alert(isUrdu ? 'سلاٹ بک شدہ ہے' : 'Slot Unavailable', isUrdu ? 'یہ وقت پہلے سے بک ہے، دوسرا سلاٹ منتخب کریں۔' : 'This time slot is already booked. Please choose another.');
      return;
    }

    const [startH, startM] = selectedSlot.start_time.split(':').map(Number);
    const [endH, endM] = selectedSlot.end_time.split(':').map(Number);
    const [y, m, d] = selectedDateStr.split('-').map(Number);

    const startDt = new Date(y, m - 1, d, startH, startM, 0);
    const endDt = new Date(y, m - 1, d, endH, endM, 0);

    setBookingStatus('sending');
    try {
      await bookMutation.mutateAsync({
        machineryId: machinery.machinery_id,
        data: {
          start_date: startDt.toISOString(),
          end_date: endDt.toISOString(),
          total_hours: selectedSlot.duration_hours,
          purpose_step: purposeStep || machinery.machinery_type,
          notes: bookingNotes.trim() || `Booked for ${selectedSlot.label_en}`,
        },
      });

      setBookingStatus('success');
      setTimeout(() => {
        setBookingStatus('idle');
        onClose();
        if (onBookingSuccess) onBookingSuccess();
        Alert.alert(
          isUrdu ? 'بکنگ کامیاب!' : 'Booking Confirmed!',
          isUrdu
            ? `مشینری ${machinery.title} بتاریخ ${selectedDateStr} (${selectedSlot.label_ur}) کامیابی کے ساتھ بک ہو گئی ہے۔ مالک آپ سے ${machinery.contact_phone} پر رابطہ کرے گا۔`
            : `Booking confirmed for ${machinery.title} on ${selectedDateStr} (${selectedSlot.label_en}). Total: PKR ${selectedSlot.price_pkr.toLocaleString()}. Owner will contact you at ${machinery.contact_phone}.`
        );
      }, 1000);
    } catch (err: any) {
      setBookingStatus('idle');
      Alert.alert(isUrdu ? 'بکنگ کی خرابی' : 'Booking Error', err?.message || 'Could not complete slot reservation.');
    }
  };

  if (!visible || !machinery) return null;

  const currentYear = selectedMonthDate.getFullYear();
  const currentMonthIdx = selectedMonthDate.getMonth();
  const monthTitle = isUrdu ? MONTH_NAMES_UR[currentMonthIdx] + ' ' + currentYear : MONTH_NAMES_EN[currentMonthIdx] + ' ' + currentYear;

  const canGoPrev = !(selectedMonthDate.getFullYear() === today.getFullYear() && selectedMonthDate.getMonth() <= today.getMonth());

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Navigation Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}>
            <Ionicons name="close" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={[styles.headerTitle, { fontSize: 16 * fontMultiplier }]} numberOfLines={1}>
              {isUrdu ? 'مشینری کیلنڈر اور ٹائم سلاٹ' : 'Machinery Schedule & Booking'}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {machinery.title}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Equipment Quick Overview Card */}
          <View style={styles.equipCard}>
            <View style={styles.equipIconWrap}>
              <MaterialCommunityIcons name="tractor" size={24} color="#16A34A" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.equipTitle}>{machinery.title}</Text>
              <Text style={styles.equipMeta}>
                📍 {machinery.district} · {machinery.horsepower ? `${machinery.horsepower} HP · ` : ''}
                {isUrdu ? `روزانہ PKR ${machinery.daily_rate_pkr.toLocaleString()}` : `PKR ${machinery.daily_rate_pkr.toLocaleString()}/day`}
              </Text>
            </View>
          </View>

          {/* Month Selector Bar */}
          <View style={styles.monthBar}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              disabled={!canGoPrev}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={[styles.monthNavBtn, !canGoPrev && { opacity: 0.3 }]}
              activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.monthTitleWrap}>
              <Ionicons name="calendar" size={16} color="#16A34A" style={{ marginRight: 6 }} />
              <Text style={[styles.monthTitleText, { fontSize: 15 * fontMultiplier }]}>{monthTitle}</Text>
            </View>

            <TouchableOpacity
              onPress={handleNextMonth}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={styles.monthNavBtn}
              activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Monthly Calendar View */}
          <View style={styles.calendarCard}>
            {/* Weekday headers */}
            <View style={styles.weekdaysRow}>
              {(isUrdu ? WEEKDAYS_UR : WEEKDAYS_EN).map((w, idx) => (
                <Text key={idx} style={styles.weekdayText}>{w}</Text>
              ))}
            </View>

            {/* Days Grid */}
            {scheduleQuery.isLoading && !scheduleQuery.data ? (
              <View style={styles.calendarLoadingBox}>
                <ActivityIndicator size="small" color="#16A34A" />
                <Text style={styles.loadingText}>
                  {isUrdu ? 'دستیاب تاریخیں چیک کی جا رہی ہیں...' : 'Checking date availability...'}
                </Text>
              </View>
            ) : (
              <View style={styles.daysGrid}>
                {calendarGrid.blanks.map((b) => (
                  <View key={`b-${b}`} style={styles.emptyDayCell} />
                ))}

                {calendarGrid.days.map((dayNum) => {
                  const dateStr = `${calendarGrid.year}-${String(calendarGrid.month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayDate = new Date(calendarGrid.year, calendarGrid.month, dayNum);
                  const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const isSelected = selectedDateStr === dateStr;

                  const avail = availabilityMap.get(dateStr);
                  const isFullyBooked = avail?.is_fully_booked || false;

                  let cellBg = '#F8FAFC';
                  let textColor = '#0F172A';
                  let borderColor = 'transparent';
                  let statusBadge = null;

                  if (isPast) {
                    textColor = '#CBD5E1';
                  } else if (isFullyBooked) {
                    cellBg = '#FEE2E2'; // RED for fully booked
                    textColor = '#DC2626';
                    borderColor = '#FCA5A5';
                    statusBadge = 'red';
                  } else {
                    cellBg = '#DCFCE7'; // GREEN for available
                    textColor = '#15803D';
                    borderColor = '#86EFAC';
                    statusBadge = 'green';
                  }

                  if (isSelected) {
                    borderColor = '#16A34A';
                  }

                  return (
                    <TouchableOpacity
                      key={dateStr}
                      disabled={isPast}
                      activeOpacity={0.7}
                      style={[
                        styles.dayCell,
                        { backgroundColor: cellBg, borderColor: isSelected ? '#16A34A' : borderColor, borderWidth: isSelected ? 2 : 1 },
                      ]}
                      onPress={() => {
                        setSelectedDateStr(dateStr);
                        // Pick first available slot on this date
                        if (avail?.slots) {
                          const openSlot = avail.slots.find((s) => s.is_available);
                          if (openSlot) setSelectedSlotId(openSlot.slot_id);
                        }
                      }}>
                      <Text style={[styles.dayNumberText, { color: textColor, fontWeight: isSelected ? '700' : '500' }]}>
                        {dayNum}
                      </Text>
                      {statusBadge && (
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: statusBadge === 'red' ? '#EF4444' : '#16A34A' },
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Legend Bar */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
                <Text style={styles.legendText}>
                  {isUrdu ? 'دستیاب تاریخیں (سبز)' : 'Available (Green)'}
                </Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>
                  {isUrdu ? 'مکمل بک شدہ (سرخ)' : 'Fully Booked (Red)'}
                </Text>
              </View>
            </View>
          </View>

          {/* Time Slots Selection for Selected Date */}
          <View style={styles.slotsCard}>
            <View style={styles.slotsHeaderRow}>
              <Text style={[styles.sectionHeading, { fontSize: 14 * fontMultiplier }]}>
                {isUrdu ? `تاریخ: ${selectedDateStr} کے دستیاب اوقات` : `Available Time Slots (${selectedDateStr})`}
              </Text>
              {selectedDayAvailability?.is_fully_booked && (
                <View style={styles.fullyBookedBadge}>
                  <Text style={styles.fullyBookedBadgeText}>
                    {isUrdu ? 'مکمل بک ہے' : 'Fully Booked'}
                  </Text>
                </View>
              )}
            </View>

            {/* 1-Hour Gap Transit Notice */}
            <View style={styles.bufferNoticeBox}>
              <Ionicons name="time-outline" size={16} color="#0284C7" style={{ marginTop: 1 }} />
              <Text style={styles.bufferNoticeText}>
                {isUrdu
                  ? 'مشینری کی منتقلی اور دیکھ بھال کے لیے ہر سلاٹ کے درمیان 1 گھنٹے کا وقفہ خودکار طور پر محفوظ کیا جاتا ہے۔'
                  : 'A 1-hour buffer gap is preserved between bookings for equipment transit and setup.'}
              </Text>
            </View>

            {/* Slots List */}
            {selectedDayAvailability?.slots && selectedDayAvailability.slots.length > 0 ? (
              <View style={styles.slotsList}>
                {selectedDayAvailability.slots.map((slot) => {
                  const isSelected = selectedSlotId === slot.slot_id && slot.is_available;
                  return (
                    <TouchableOpacity
                      key={slot.slot_id}
                      disabled={!slot.is_available}
                      activeOpacity={0.7}
                      style={[
                        styles.slotCard,
                        isSelected && styles.slotCardSelected,
                        !slot.is_available && styles.slotCardDisabled,
                      ]}
                      onPress={() => setSelectedSlotId(slot.slot_id)}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialCommunityIcons
                            name={slot.slot_id === 'full_day' ? 'clock-time-eight' : 'clock-outline'}
                            size={16}
                            color={slot.is_available ? (isSelected ? '#15803D' : '#0F172A') : '#94A3B8'}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={[
                              styles.slotTitle,
                              isSelected && { color: '#15803D', fontWeight: '700' },
                              !slot.is_available && { color: '#94A3B8' },
                            ]}>
                            {isUrdu ? slot.label_ur : slot.label_en}
                          </Text>
                        </View>
                        <Text style={styles.slotHoursSub}>
                          {slot.duration_hours} {isUrdu ? 'گھنٹے' : 'hours'} · {slot.start_time} - {slot.end_time}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          style={[
                            styles.slotPrice,
                            isSelected && { color: '#15803D' },
                            !slot.is_available && { color: '#94A3B8' },
                          ]}>
                          PKR {slot.price_pkr.toLocaleString()}
                        </Text>
                        <View
                          style={[
                            styles.slotStatusBadge,
                            { backgroundColor: slot.is_available ? '#DCFCE7' : '#FEE2E2' },
                          ]}>
                          <Text
                            style={[
                              styles.slotStatusBadgeText,
                              { color: slot.is_available ? '#15803D' : '#B91C1C' },
                            ]}>
                            {slot.is_available
                              ? (isUrdu ? 'دستیاب ✓' : 'Available ✓')
                              : (isUrdu ? 'بک شدہ 🔒' : 'Booked 🔒')}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptySlotsBox}>
                <ActivityIndicator size="small" color="#16A34A" />
                <Text style={styles.emptySlotsText}>
                  {isUrdu ? 'سلاٹس معلومات لوڈ ہو رہی ہے...' : 'Loading slots...'}
                </Text>
              </View>
            )}

            {/* Special Instructions / Notes */}
            <Text style={styles.inputLabel}>
              {isUrdu ? 'کھیت کا پتہ / اضافی ہدایات:' : 'Field Location & Special Instructions:'}
            </Text>
            <TextInput
              style={styles.notesInput}
              value={bookingNotes}
              onChangeText={setBookingNotes}
              placeholder={isUrdu ? 'مثلاً چک 214، نہر والا کھیت...' : 'e.g. Plot near main canal, Chak 214-RB'}
              placeholderTextColor="#94A3B8"
              multiline
            />
          </View>
        </ScrollView>

        {/* Thumb-Zone Sticky Summary & Confirm Dock */}
        {selectedSlot && (
          <View style={styles.stickySummaryDock}>
            <View style={styles.summaryPriceCol}>
              <Text style={styles.summaryTotalLabel}>
                {isUrdu ? 'کل کرایہ' : 'TOTAL RENTAL'}
              </Text>
              <Text style={styles.summaryTotalPrice}>
                PKR {selectedSlot.price_pkr.toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                bookingStatus === 'success' && { backgroundColor: '#15803D' },
                (!selectedSlot.is_available || bookingStatus === 'sending') && { opacity: 0.6 },
              ]}
              disabled={!selectedSlot.is_available || bookingStatus === 'sending' || bookingStatus === 'success'}
              onPress={handleConfirmBooking}
              activeOpacity={0.85}>
              {bookingStatus === 'sending' ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmBtnText}>{isUrdu ? 'بک ہو رہا ہے...' : 'Booking...'}</Text>
                </>
              ) : bookingStatus === 'success' ? (
                <>
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmBtnText}>{isUrdu ? 'بک ہو گیا!' : 'Confirmed!'}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="calendar-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmBtnText}>{isUrdu ? 'سلاٹ بک کریں' : 'Confirm Slot'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: 'rgba(15, 23, 42, 0.62)',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  equipCard: {
    ...CardStyle,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  equipIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#0F172A',
  },
  equipMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: 'rgba(15, 23, 42, 0.62)',
    marginTop: 3,
  },
  monthBar: {
    ...CardStyle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  monthNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthTitleText: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  calendarCard: {
    ...CardStyle,
    padding: 16,
    marginBottom: 16,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#64748B',
  },
  calendarLoadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#64748B',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDayCell: {
    width: `${100 / 7}%`,
    height: 44,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    position: 'relative',
  },
  dayNumberText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    fontVariant: ['tabular-nums'],
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: 'absolute',
    bottom: 4,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#64748B',
  },
  slotsCard: {
    ...CardStyle,
    padding: 18,
  },
  slotsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeading: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  fullyBookedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fullyBookedBadgeText: {
    color: '#B91C1C',
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  bufferNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 14,
  },
  bufferNoticeText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#0369A1',
    lineHeight: 16,
  },
  slotsList: {
    gap: 10,
    marginBottom: 16,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 14,
    minHeight: 62,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
    borderWidth: 2,
  },
  slotCardDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.7,
  },
  slotTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13.5,
    color: '#0F172A',
  },
  slotHoursSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: 'rgba(15, 23, 42, 0.62)',
    marginTop: 2,
  },
  slotPrice: {
    ...MetricNumberStyle,
    fontSize: 15,
    color: '#0F172A',
  },
  slotStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  slotStatusBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },
  emptySlotsBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptySlotsText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: FontFamily.medium,
    marginTop: 6,
  },
  inputLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: '#0F172A',
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#0F172A',
    minHeight: 58,
  },
  stickySummaryDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.08)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 8,
    gap: 12,
  },
  summaryPriceCol: {
    justifyContent: 'center',
  },
  summaryTotalLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    letterSpacing: 0.5,
    color: 'rgba(15, 23, 42, 0.62)',
  },
  summaryTotalPrice: {
    ...MetricNumberStyle,
    fontSize: 20,
    color: '#16A34A',
    marginTop: 1,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 22,
    minHeight: 50,
    borderRadius: Radius.md,
    ...PrimaryButtonShadow,
  },
  confirmBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
