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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, Spacing, Radius, CardStyle, PrimaryButtonShadow } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import {
  useEmployeesQuery,
  useAddEmployeeMutation,
  useAssignFieldsMutation,
  useDeleteEmployeeMutation,
} from '@/hooks/use-employees';
import { FarmEmployeeDTO } from '@/services/api-client';

const ROLES = [
  { key: 'farmhand', labelEn: 'Farmhand / Labor', labelUr: 'کھیت مزدور', icon: 'hand-left-outline' as const },
  { key: 'operator', labelEn: 'Tractor / Machine Operator', labelUr: 'ٹریکٹر و مشین آپریٹر', icon: 'cog-outline' as const },
  { key: 'agronomist', labelEn: 'Field Agronomist', labelUr: 'زرعی ماہر', icon: 'leaf-outline' as const },
  { key: 'manager', labelEn: 'Farm Supervisor', labelUr: 'فارم سپروائزر', icon: 'shield-checkmark-outline' as const },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function FarmTeamModal({ visible, onClose }: Props) {
  const { language, fields, t } = useApp();
  const isUrdu = language === 'ur';

  // Add Employee Form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('03001234567');
  const [role, setRole] = useState('farmhand');
  const [accessAll, setAccessAll] = useState(false);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  // Assign Fields Modal
  const [assigningEmp, setAssigningEmp] = useState<FarmEmployeeDTO | null>(null);
  const [assignFieldIds, setAssignFieldIds] = useState<string[]>([]);
  const [assignAll, setAssignAll] = useState(false);

  // TanStack Hooks
  const employeesQuery = useEmployeesQuery();
  const addMutation = useAddEmployeeMutation();
  const assignMutation = useAssignFieldsMutation();
  const deleteMutation = useDeleteEmployeeMutation();

  const handleAddEmployee = async () => {
    if (!name.trim()) {
      Alert.alert(isUrdu ? 'نام درکار ہے' : 'Name Required', isUrdu ? 'ملازم کا نام درج کریں۔' : 'Please enter employee name.');
      return;
    }
    const cleanPhone = phone.replace(/[\s\-]/g, '');
    const pakPhoneRegex = /^(03\d{9}|\+923\d{9})$/;
    if (!pakPhoneRegex.test(cleanPhone)) {
      Alert.alert(isUrdu ? 'غلط فون نمبر' : 'Invalid Phone', isUrdu ? 'درست پاکستانی موبائل نمبر درج کریں (03XXXXXXXXX)' : 'Enter valid Pakistani phone (03XXXXXXXXX)');
      return;
    }

    setSubmitStatus('sending');
    try {
      await addMutation.mutateAsync({
        employee_name: name.trim(),
        employee_phone: cleanPhone,
        role,
        access_all_fields: accessAll,
        assigned_field_ids: accessAll ? [] : selectedFieldIds,
      });
      setSubmitStatus('success');
      setTimeout(() => {
        setSubmitStatus('idle');
        setIsAddOpen(false);
        setName('');
        setSelectedFieldIds([]);
        setAccessAll(false);
        Alert.alert(
          isUrdu ? 'ملازم شامل کر دیا گیا' : 'Employee Added!',
          isUrdu
            ? `ملازم ${name} کو فارم ٹیم میں شامل کر دیا گیا ہے۔ جب وہ اپنے فون سے لاگ ان کرے گا تو اسے تمام تفویض کردہ کھیت نظر آئیں گے۔`
            : `${name} has been added to your farm team. When logging in with their phone, they will have access to monitor the assigned fields.`
        );
      }, 800);
    } catch (err: any) {
      setSubmitStatus('idle');
      Alert.alert(isUrdu ? 'خرابی' : 'Error', err?.message || 'Failed to add employee.');
    }
  };

  const handleSaveAssignments = async () => {
    if (!assigningEmp) return;
    try {
      await assignMutation.mutateAsync({
        employeeRecordId: assigningEmp.employee_record_id,
        data: {
          field_ids: assignAll ? [] : assignFieldIds,
          access_all_fields: assignAll,
        },
      });
      setAssigningEmp(null);
      Alert.alert(isUrdu ? 'کامیابی' : 'Updated!', isUrdu ? 'کھیتوں کی تقسیم اپ ڈیٹ کر دی گئی ہے۔' : 'Field assignments updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update field assignments.');
    }
  };

  const toggleFieldSelect = (fieldId: string) => {
    setSelectedFieldIds((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  const toggleAssignFieldSelect = (fieldId: string) => {
    setAssignFieldIds((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{isUrdu ? 'ملازمین اور فارم ٹیم' : 'Farm Team & Delegation'}</Text>
            <Text style={styles.headerSubtitle}>
              {isUrdu ? 'ملازمین کو کھیت سونپیں اور مانیٹرنگ نتائج خود دیکھیں' : 'Delegate field monitoring to your farmhands'}
            </Text>
          </View>
          <TouchableOpacity style={styles.addBtnTop} onPress={() => setIsAddOpen(true)}>
            <Ionicons name="person-add" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnTopText}>{isUrdu ? 'شامل کریں' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {/* Employees List */}
        <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
          {employeesQuery.isLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#16A34A" />
              <Text style={styles.loadingText}>{isUrdu ? 'ٹیم لوڈ ہو رہی ہے...' : 'Loading farm team...'}</Text>
            </View>
          ) : employeesQuery.data?.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="account-group" size={54} color="#94A3B8" />
              <Text style={styles.emptyTitle}>{isUrdu ? 'کوئی ملازم شامل نہیں ہے' : 'No Employees Added Yet'}</Text>
              <Text style={styles.emptyDesc}>
                {isUrdu
                  ? 'اپنے ٹریکٹر ڈرائیور یا مزدور کو شامل کریں تاکہ وہ کھیتوں کی تصاویر اور معائنہ ریکارڈ کر سکیں اور آپ کے ڈیش بورڈ پر فوری نظر آئے۔'
                  : 'Add farmhands or operators so they can scan canopies and monitor fields directly under your account.'}
              </Text>
              <TouchableOpacity style={styles.emptyActionBtn} onPress={() => setIsAddOpen(true)}>
                <Text style={styles.emptyActionBtnText}>{isUrdu ? 'پہلا ملازم شامل کریں' : 'Add First Employee'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            employeesQuery.data?.map((emp) => (
              <View key={emp.employee_record_id} style={styles.employeeCard}>
                <View style={styles.employeeCardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{emp.employee_name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.empName}>{emp.employee_name}</Text>
                    <Text style={styles.empPhone}>📞 {emp.employee_phone}</Text>
                  </View>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{emp.role.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Assigned Fields Section */}
                <View style={styles.assignedFieldsBox}>
                  <Text style={styles.assignedLabel}>{isUrdu ? 'سونپے گئے کھیت:' : 'Assigned Fields:'}</Text>
                  {emp.access_all_fields ? (
                    <View style={styles.allFieldsBadge}>
                      <Ionicons name="globe-outline" size={14} color="#16A34A" />
                      <Text style={styles.allFieldsBadgeText}>{isUrdu ? 'تمام کھیتوں تک رسائی' : 'Access to ALL Fields'}</Text>
                    </View>
                  ) : emp.assigned_fields && emp.assigned_fields.length > 0 ? (
                    <View style={styles.fieldsPillsWrap}>
                      {emp.assigned_fields.map((af) => (
                        <View key={af.assignment_id} style={styles.fieldPill}>
                          <Ionicons name="leaf-outline" size={12} color="#16A34A" />
                          <Text style={styles.fieldPillText}>{af.field_name || af.field_id}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noFieldsText}>{isUrdu ? 'ابھی کوئی کھیت نہیں سونپا گیا' : 'No specific fields assigned'}</Text>
                  )}
                </View>

                {/* Card Actions */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.assignFieldsBtn}
                    onPress={() => {
                      setAssigningEmp(emp);
                      setAssignAll(emp.access_all_fields);
                      setAssignFieldIds(emp.assigned_fields?.map((f) => f.field_id) || []);
                    }}>
                    <Ionicons name="options-outline" size={16} color="#16A34A" />
                    <Text style={styles.assignFieldsBtnText}>{isUrdu ? 'کھیت تفویض کریں' : 'Assign Fields'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteEmpBtn}
                    onPress={() => {
                      Alert.alert(
                        isUrdu ? 'ملازم ختم کریں' : 'Remove Employee',
                        isUrdu ? `کیا آپ ${emp.employee_name} کو فارم ٹیم سے نکالنا چاہتے ہیں؟` : `Remove ${emp.employee_name} from your team?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => deleteMutation.mutate(emp.employee_record_id) },
                        ]
                      );
                    }}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Add Employee Modal */}
        <Modal visible={isAddOpen} animationType="slide" transparent={false} statusBarTranslucent onRequestClose={() => setIsAddOpen(false)}>
          <SafeAreaView style={styles.modalFullContainer} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setIsAddOpen(false)} style={styles.closeBtn}>
                  <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                  <Text style={styles.headerTitle}>{isUrdu ? 'نیا ملازم شامل کریں' : 'Add Farm Employee'}</Text>
                  <Text style={styles.headerSubtitle}>{isUrdu ? 'نام، موبائل نمبر اور عہدہ منتخب کریں' : 'Enter employee contact & roles'}</Text>
                </View>
              </View>

              <ScrollView
                style={styles.bodyScroll}
                contentContainerStyle={styles.bodyContent}
                keyboardShouldPersistTaps="handled">
                <Text style={styles.inputLabel}>{isUrdu ? 'ملازم کا نام *' : 'Employee Full Name *'}</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Muhammad Aslam"
                  placeholderTextColor="#94A3B8"
                />

                <Text style={styles.inputLabel}>{isUrdu ? 'موبائل نمبر (پاکستانی) *' : 'Phone Number (Pakistani) *'}</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="03001234567"
                  placeholderTextColor="#94A3B8"
                />

                <Text style={styles.inputLabel}>{isUrdu ? 'عہدہ / ذمہ داری' : 'Employee Role'}</Text>
                <View style={styles.typeSelectorRow}>
                  {ROLES.map((r) => {
                    const active = role === r.key;
                    return (
                      <TouchableOpacity
                        key={r.key}
                        style={[styles.typeOptionPill, active && styles.typeOptionPillActive]}
                        onPress={() => setRole(r.key)}>
                        <Ionicons
                          name={r.icon}
                          size={14}
                          color={active ? '#FFFFFF' : '#475569'}
                          style={{ marginRight: 5 }}
                        />
                        <Text style={[styles.typeOptionText, active && styles.typeOptionTextActive]}>
                          {isUrdu ? r.labelUr : r.labelEn}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

              {/* Access All Fields Toggle */}
              <TouchableOpacity
                style={styles.accessAllToggleRow}
                onPress={() => setAccessAll(!accessAll)}>
                <Ionicons
                  name={accessAll ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={accessAll ? '#16A34A' : '#94A3B8'}
                />
                <Text style={styles.accessAllToggleText}>
                  {isUrdu ? 'تمام کھیتوں تک رسائی دیں (فارم مینیجر کے لیے)' : 'Grant access to ALL fields (Supervisory)'}
                </Text>
              </TouchableOpacity>

              {/* Field Checkboxes */}
              {!accessAll && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.inputLabel}>{isUrdu ? 'مخصوص کھیت منتخب کریں:' : 'Select Specific Fields to Assign:'}</Text>
                  {fields.map((f) => {
                    const isSelected = selectedFieldIds.includes(f.id);
                    return (
                      <TouchableOpacity
                        key={f.id}
                        style={[styles.fieldCheckboxRow, isSelected && styles.fieldCheckboxRowActive]}
                        onPress={() => toggleFieldSelect(f.id)}>
                        <Ionicons
                          name={isSelected ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={isSelected ? '#16A34A' : '#94A3B8'}
                        />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={styles.fieldCheckboxName}>{f.displayName || f.code}</Text>
                          <Text style={styles.fieldCheckboxMeta}>{f.areaAcres} acres · {f.soilTexture || 'Loam'}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, submitStatus === 'sending' && { opacity: 0.7 }]}
                disabled={submitStatus === 'sending'}
                onPress={handleAddEmployee}>
                {submitStatus === 'sending' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>
                      {isUrdu ? 'ٹیم میں شامل کریں' : 'Add to Farm Team'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>

        {/* Assign Fields Dialog Modal */}
        <Modal visible={!!assigningEmp} animationType="fade" transparent={true} statusBarTranslucent onRequestClose={() => setAssigningEmp(null)}>
          <View style={styles.backdrop}>
            <View style={styles.dialogBox}>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>{isUrdu ? 'کھیت تفویض کریں' : 'Assign Fields'}</Text>
                <TouchableOpacity onPress={() => setAssigningEmp(null)}>
                  <Ionicons name="close-circle" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.dialogSubTitle}>{assigningEmp?.employee_name}</Text>

              <TouchableOpacity
                style={styles.accessAllToggleRow}
                onPress={() => setAssignAll(!assignAll)}>
                <Ionicons
                  name={assignAll ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={assignAll ? '#16A34A' : '#94A3B8'}
                />
                <Text style={styles.accessAllToggleText}>
                  {isUrdu ? 'تمام کھیتوں تک رسائی دیں' : 'Assign All Fields'}
                </Text>
              </TouchableOpacity>

              {!assignAll && (
                <ScrollView style={{ maxHeight: 220, marginVertical: 8 }}>
                  {fields.map((f) => {
                    const isSelected = assignFieldIds.includes(f.id);
                    return (
                      <TouchableOpacity
                        key={f.id}
                        style={[styles.fieldCheckboxRow, isSelected && styles.fieldCheckboxRowActive]}
                        onPress={() => toggleAssignFieldSelect(f.id)}>
                        <Ionicons
                          name={isSelected ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={isSelected ? '#16A34A' : '#94A3B8'}
                        />
                        <Text style={[styles.fieldCheckboxName, { marginLeft: 10 }]}>{f.displayName || f.code} ({f.areaAcres} ac)</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <TouchableOpacity style={styles.saveAssignBtn} onPress={handleSaveAssignments}>
                <Text style={styles.saveAssignBtnText}>{isUrdu ? 'محفوظ کریں' : 'Save Assignments'}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  addBtnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addBtnTopText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  bodyScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerLoading: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
    ...CardStyle,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    marginVertical: 10,
  },
  emptyActionBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FontFamily.bold,
  },
  employeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...CardStyle,
  },
  employeeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16A34A20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  empName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  empPhone: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  roleBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  assignedFieldsBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  assignedLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginBottom: 6,
  },
  allFieldsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  allFieldsBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#16A34A',
  },
  fieldsPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  fieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  fieldPillText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#334155',
  },
  noFieldsText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#94A3B8',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  assignFieldsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
  },
  assignFieldsBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: '#16A34A',
  },
  deleteEmpBtn: {
    padding: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#334155',
    marginBottom: 4,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  typeOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
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
  accessAllToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  accessAllToggleText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#1E293B',
    flex: 1,
  },
  fieldCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  fieldCheckboxRowActive: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  fieldCheckboxName: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: '#0F172A',
  },
  fieldCheckboxMeta: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
  },
  submitBtn: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 24,
    ...PrimaryButtonShadow,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    padding: 20,
  },
  dialogBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    ...CardStyle,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dialogTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  dialogSubTitle: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: '#16A34A',
    marginBottom: 10,
  },
  saveAssignBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  saveAssignBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
});
