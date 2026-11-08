import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp, MapFieldItem } from '@/context/app-context';
import { STAGE_CONFIG, FontFamily, Colors, Spacing, Radius } from '@/constants/theme';
import { AccessibilityControls, AudioMiniPlayer } from '@/components/accessibility-bar';
import { StartCycleModal } from '@/components/start-cycle-modal';
import { RealLeafletMap } from '@/components/real-leaflet-map';
import { useFieldsQuery, useCreateFieldMutation } from '@/hooks/use-fields';
import { BackendReachabilityBanner } from '@/components/backend-reachability-banner';
import { logger } from '@/services/logger';
import { ActivityIndicator } from 'react-native';


export default function FarmMapScreen() {
  const { fields, setSelectedFieldId, mapFields, addNewField, t, language, fontMultiplier } = useApp();

  const [showLegend, setShowLegend] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedMapField, setSelectedMapField] = useState<MapFieldItem | null>(null);

  // Add Field / Real Draw Boundary State
  const [isDrawModeOpen, setIsDrawModeOpen] = useState(false);
  const [selectedShape, setSelectedShape] = useState<'polygon' | 'rectangle' | 'square' | 'circle'>('polygon');
  const [fieldCodeInput, setFieldCodeInput] = useState('PK-FSD-05');
  const [fieldNameInput, setFieldNameInput] = useState('');
  const [acresInput, setAcresInput] = useState('3.8');
  const [soilTextureInput, setSoilTextureInput] = useState('Sandy Loam');
  const [drawnCoords, setDrawnCoords] = useState<[number, number][]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fieldsQuery = useFieldsQuery();
  const createFieldMutation = useCreateFieldMutation();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [saveError, setSaveError] = useState<Error | null>(null);

  const liveMapFields = React.useMemo<MapFieldItem[]>(() => {
    // Prefer fieldsQuery.data, fallback to context fields
    const rawList = (fieldsQuery.data && fieldsQuery.data.length > 0)
      ? fieldsQuery.data
      : (fields.length > 0 ? fields : []);

    if (rawList.length === 0) {
      return mapFields.filter((m) => m.isMine && !m.id.startsWith('field_0'));
    }

    return rawList.map((f: any, idx: number) => {
      const fieldId = f.field_id || f.id;
      const contextField = fields.find((cf) => cf.id === fieldId);
      const localMapField = mapFields.find((mf) => mf.id === fieldId);

      let coords: [number, number][] = [];
      try {
        if (f.boundary_geojson?.type === 'Polygon' && f.boundary_geojson.coordinates?.[0]) {
          coords = f.boundary_geojson.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
        }
      } catch (_) {}

      if (coords.length === 0 && localMapField?.coordinates) {
        coords = localMapField.coordinates;
      }
      if (coords.length === 0 && contextField?.coordinates) {
        const { latitude, longitude } = contextField.coordinates;
        coords = [
          [latitude - 0.0015, longitude - 0.0015],
          [latitude + 0.0015, longitude - 0.0015],
          [latitude + 0.0015, longitude + 0.0015],
          [latitude - 0.0015, longitude + 0.0015],
        ];
      }

      const isCycleActive = Boolean(f.current_cycle_id || contextField?.cycleStatus === 'active');
      const stageIdx = contextField?.currentStageIndex ?? 0;
      const stageInfo = STAGE_CONFIG[stageIdx] || STAGE_CONFIG[0];
      const stageName = isCycleActive ? stageInfo.name : 'Fallow';
      const color = isCycleActive ? stageInfo.color : '#64748B';

      return {
        id: fieldId,
        code: f.field_code || contextField?.code || ("PK-FSD-0" + (idx + 1)),
        name: f.field_name || contextField?.displayName || ('Field ' + (idx + 1)),
        stageIndex: isCycleActive ? stageIdx : 0,
        stageName,
        variety: contextField?.wheatVariety || 'Akbar-2019',
        yieldKgSqm: contextField?.yieldReturnKgSqm || 0.38,
        color,
        acres: f.area_acres || contextField?.areaAcres || 3.8,
        isMine: true,
        shapeType: (f.shape_type as any) || (contextField as any)?.shapeType || 'polygon',
        cycleStatus: isCycleActive ? 'active' : 'not_started',
        coordinates: coords.length >= 3 ? coords : undefined,
      };
    });
  }, [fieldsQuery.data, fields, mapFields]);

  const handleSelectShape = (shape: 'polygon' | 'rectangle' | 'square' | 'circle') => {
    setSelectedShape(shape);
    setDrawnCoords([]);
  };

  // Map layer controls: Satellite (Esri) vs Cadastral (OSM standard) — ZERO API KEYS
  const [mapType, setMapType] = useState<'satellite' | 'cadastral'>('satellite');

  // Start Crop Cycle Modal State
  const [isStartCycleOpen, setIsStartCycleOpen] = useState(false);

  // Compute dynamic filter options based on actual field stages present
  const filterOptions = React.useMemo(() => {
    const list: { id: string; labelEn: string; labelUr: string; count: number; color?: string }[] = [
      { id: 'all', labelEn: 'All Plots', labelUr: 'تمام رقبے', count: liveMapFields.length },
    ];

    const fallowFields = liveMapFields.filter((f) => f.cycleStatus === 'not_started');
    if (fallowFields.length > 0) {
      list.push({
        id: 'fallow',
        labelEn: 'Fallow / Ready',
        labelUr: 'تیار زمین',
        count: fallowFields.length,
        color: '#64748B',
      });
    }

    const stagesSeen = new Set<string>();
    liveMapFields.forEach((f) => {
      if (f.cycleStatus === 'active' && f.stageName && f.stageName !== 'Fallow') {
        stagesSeen.add(f.stageName);
      }
    });

    stagesSeen.forEach((stName) => {
      const count = liveMapFields.filter((f) => f.stageName === stName).length;
      const stageObj = STAGE_CONFIG.find((s) => s.name.toLowerCase() === stName.toLowerCase());
      list.push({
        id: stName.toLowerCase(),
        labelEn: `${stName} Stage`,
        labelUr: stageObj ? ((t as any)[`stage${stageObj.index}Name`] || stName) : stName,
        count,
        color: stageObj?.color || '#16A34A',
      });
    });

    return list;
  }, [liveMapFields, t]);

  const filteredFields = React.useMemo(() => {
    if (activeFilter === 'all') return liveMapFields;
    if (activeFilter === 'fallow') return liveMapFields.filter((f) => f.cycleStatus === 'not_started');
    return liveMapFields.filter((f) => f.stageName.toLowerCase() === activeFilter.toLowerCase());
  }, [liveMapFields, activeFilter]);

  const handleSelectField = (fieldId: string) => {
    const f = liveMapFields.find((item) => item.id === fieldId);
    if (f) {
      setSelectedMapField(f);
      if (f.isMine) {
        setSelectedFieldId(f.id);
      }
    }
  };

  const handleBoundaryUpdated = (data: { acres: number; areaSqm: number; coords: [number, number][] }) => {
    if (data.acres > 0) {
      setAcresInput(data.acres.toString());
    }
    setDrawnCoords(data.coords);
  };

  const handleSaveDrawnField = async () => {
    if (drawnCoords.length < 3) {
      Alert.alert(
        language === 'ur' ? 'باؤنڈری نامکمل ہے' : 'Incomplete Boundary',
        language === 'ur'
          ? 'براہ کرم نقشے پر باؤنڈری کے کم از کم 3 کونے منتخب کریں۔'
          : 'Please tap on the satellite map to place at least 3 corner boundary points.'
      );
      return;
    }

    const acresNum = parseFloat(acresInput) || 3.8;
    const ring = drawnCoords.map(([lat, lng]) => [lng, lat]);
    ring.push([drawnCoords[0][1], drawnCoords[0][0]]);

    const boundary_geojson = {
      type: 'Polygon',
      coordinates: [ring],
    };

    setSaveStatus('saving');
    setSaveError(null);

    try {
      const createdField = await createFieldMutation.mutateAsync({
        field_name: fieldNameInput.trim() || 'Wheat Parcel',
        shape_type: selectedShape,
        area_acres: acresNum,
        boundary_geojson,
        soil_texture: soilTextureInput,
      });

      addNewField({
        id: createdField.field_id,
        code: createdField?.field_code || 'PK-FSD-01',
        displayName: fieldNameInput || 'Wheat Parcel',
        areaAcres: acresNum,
        shapeType: selectedShape,
        soilTexture: soilTextureInput,
        coordinates: drawnCoords,
      });

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        setIsDrawModeOpen(false);
        setToastMessage(
          language === 'ur'
            ? `${fieldNameInput} محفوظ ہو گیا ہے!`
            : `Field ${fieldNameInput} saved successfully!`
        );
        setTimeout(() => setToastMessage(null), 3500);
      }, 500);
    } catch (err: any) {
      logger.warn('Failed to save field to backend:', err.message);
      setSaveError(err);
      setSaveStatus('idle');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ─── Top Control Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="map-marker-radius" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.screenTitle, { fontSize: 15 * fontMultiplier }]}>
                {language === 'ur' ? 'کھیت کا نقشہ اور سیٹلائٹ' : 'Farm Map & Satellite'}
              </Text>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.screenSubtitle, { fontSize: 10.5 * fontMultiplier }]}>
                {language === 'ur' ? '📍 حقیقی سیٹلائٹ و کیڈسٹرل نقشہ' : '📍 Satellite & Cadastral GIS'}
              </Text>
            </View>
          </View>
          <AccessibilityControls />
        </View>

        {/* Layer Switcher & Add Field Action Row */}
        <View style={styles.controlsRow}>
          {/* Map Layer Switcher: Satellite (Esri) vs Cadastral (OSM) — ZERO API KEYS */}
          <View style={styles.layerSwitcher}>
            <TouchableOpacity
              onPress={() => setMapType('satellite')}
              style={[styles.layerBtn, mapType === 'satellite' && styles.layerBtnActive]}
              activeOpacity={0.8}>
              <Ionicons
                name="earth"
                size={13}
                color={mapType === 'satellite' ? '#16A34A' : '#64748B'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.layerBtnText, mapType === 'satellite' && styles.layerBtnTextActive]}>
                Satellite (Esri)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMapType('cadastral')}
              style={[styles.layerBtn, mapType === 'cadastral' && styles.layerBtnActive]}
              activeOpacity={0.8}>
              <Ionicons
                name="map"
                size={13}
                color={mapType === 'cadastral' ? '#16A34A' : '#64748B'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.layerBtnText, mapType === 'cadastral' && styles.layerBtnTextActive]}>
                Cadastral (OSM)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add Field Action Button */}
          <TouchableOpacity
            onPress={() => setIsDrawModeOpen(true)}
            style={styles.addFieldBtn}
            activeOpacity={0.85}>
            <Ionicons name="add-circle" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.addFieldBtnText}>
              {language === 'ur' ? '+ نیا کھیت' : '+ Add Field'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}>
          {filterOptions.map((opt) => {
            const isActive = activeFilter === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setActiveFilter(opt.id)}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                activeOpacity={0.75}>
                {opt.color && (
                  <View style={[styles.filterDot, { backgroundColor: opt.color }]} />
                )}
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {language === 'ur' ? opt.labelUr : opt.labelEn} ({opt.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── REAL LEAFLET MAP CANVAS (Mustafa Town, Lahore) ─── */}
      <View style={styles.mapContainer}>
        <RealLeafletMap
          fields={filteredFields}
          selectedFieldId={selectedMapField ? selectedMapField.id : ""}
          onSelectField={handleSelectField}
          mapType={mapType}
          isDrawMode={isDrawModeOpen}
          drawShape={selectedShape}
          onBoundaryUpdated={handleBoundaryUpdated}
          language={language}
        />

        {/* Floating Toast Notification */}
        {toastMessage && (
          <View style={styles.toastBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#22C55E" style={{ marginRight: 6 }} />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* Active Draw / Add Field Overlay on Top of Map */}
        {isDrawModeOpen && (
          <View style={styles.drawingTopBar}>
            <View style={styles.drawingTopMain}>
              <View style={styles.drawingTopLeft}>
                <View style={styles.drawingLiveDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.drawingTopTitle}>
                    {drawnCoords.length >= 2
                      ? `${acresInput} Acres · ${selectedShape.toUpperCase()}`
                      : (selectedShape === 'polygon'
                          ? (language === 'ur' ? 'نقشے پر باؤنڈری کے کونے ٹیپ کریں' : 'Tap on Satellite Map to Drop Corners')
                          : selectedShape === 'rectangle'
                          ? (language === 'ur' ? 'مستطیل کے لیے 2 مخالف کونے منتخب کریں' : 'Tap 2 Opposite Corners for Rectangle')
                          : selectedShape === 'square'
                          ? (language === 'ur' ? 'مربع کے لیے 2 کونے منتخب کریں' : 'Tap 2 Corners to Form Square Parcel')
                          : (language === 'ur' ? 'مرکز اور پھر کنارہ منتخب کریں' : 'Tap Center, Then Edge for Pivot Circle'))}
                  </Text>
                  <Text style={styles.drawingTopSub}>
                    {drawnCoords.length >= 2
                      ? `Area: ${((parseFloat(acresInput) || 3.8) * 4046.86).toLocaleString()} m²`
                      : (language === 'ur' ? 'شکل تبدیل کرنے کے لیے نیچے بٹن دبائیں' : 'Choose Polygon, Rectangle, Square, or Circle')}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsDrawModeOpen(false)}
                style={styles.closeDrawBtn}
                activeOpacity={0.7}>
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Quick Shape Selector in Top Bar */}
            <View style={styles.topShapeChipsRow}>
              {[
                { key: 'polygon', label: 'Polygon', icon: 'vector-polygon' },
                { key: 'rectangle', label: 'Rectangle', icon: 'vector-rectangle' },
                { key: 'square', label: 'Square', icon: 'vector-square' },
                { key: 'circle', label: 'Circle', icon: 'circle-outline' },
              ].map((s) => {
                const active = selectedShape === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() => handleSelectShape(s.key as any)}
                    style={[styles.topShapeChip, active && styles.topShapeChipActive]}
                    activeOpacity={0.8}>
                    <MaterialCommunityIcons
                      name={s.icon as any}
                      size={12}
                      color={active ? '#FFFFFF' : '#86EFAC'}
                      style={{ marginRight: 3 }}
                    />
                    <Text style={[styles.topShapeChipText, active && styles.topShapeChipTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Collapsible Stage Legend Overlay */}
        {!isDrawModeOpen && (
          <TouchableOpacity
            onPress={() => setShowLegend(!showLegend)}
            style={styles.legend}
            activeOpacity={0.85}>
            <View style={styles.legendTitleRow}>
              <Ionicons name="layers-outline" size={13} color="#16A34A" style={{ marginRight: 4 }} />
              <Text style={styles.legendTitle}>{showLegend ? t.growthStages : 'Legend'}</Text>
              <Ionicons name={showLegend ? 'chevron-up' : 'chevron-down'} size={12} color="#64748B" style={{ marginLeft: 4 }} />
            </View>
            {showLegend && (
              <View style={styles.legendList}>
                {STAGE_CONFIG.map((s) => (
                  <View key={s.key} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                    <Text style={styles.legendText}>
                      {language === 'ur' ? `مرحلہ ${s.index + 1}` : s.name}
                    </Text>
                  </View>
                ))}
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: '#64748B' }]} />
                  <Text style={styles.legendText}>
                    {language === 'ur' ? 'تیار زمین' : 'Fallow / Ready'}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Bottom Panel: Add Field Sheet OR Selected Field Card ─── */}
      {isDrawModeOpen ? (
        /* ─── Add Field Bottom Setup Sheet (Map remains visible above) ─── */
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
          style={styles.keyboardAvoidingWrap}>
        <View style={styles.addFieldBottomPanel}>
          <View style={styles.bottomCardHandle} />

          <View style={styles.addFieldHeaderRow}>
            <View>
              <Text style={[styles.addFieldTitle, { fontSize: 16 * fontMultiplier }]}>
                {language === 'ur' ? 'نیا کھیت محفوظ کریں' : 'Configure New Field'}
              </Text>
              <Text style={styles.addFieldSub}>
                {language === 'ur' ? 'نقشے پر مطلوبہ باؤنڈری تیار ہے' : 'Boundary placed on satellite view'}
              </Text>
            </View>
            <View style={styles.acresLiveBadge}>
              <Text style={styles.acresLiveText}>{acresInput} Ac</Text>
            </View>
          </View>


          {/* Field Name Input (Field Code is automatically assigned by backend) */}
          <View style={styles.fieldNameInputGroup}>
            <Text style={styles.miniLabel}>
              {language === 'ur' ? 'کھیت کا نام / لوکیشن' : 'Field Name / Location'}
            </Text>
            <TextInput
              value={fieldNameInput}
              onChangeText={setFieldNameInput}
              placeholder={language === 'ur' ? 'کھیت کا نام درج کریں (مثال: نہر والا رقبہ)' : 'Enter field name (e.g. Canal Block West)'}
              placeholderTextColor="#94A3B8"
              style={styles.miniTextInput}
            />
          </View>

          {/* Soil Texture Selection */}
          <View style={styles.soilTextureRow}>
            <Text style={styles.miniLabel}>
              {language === 'ur' ? 'زمین کی بناوٹ:' : 'Soil Texture:'}
            </Text>
            <View style={styles.soilChipsGroup}>
              {['Sandy Loam', 'Clay Loam', 'Silt Loam'].map((st) => (
                <TouchableOpacity
                  key={st}
                  onPress={() => setSoilTextureInput(st)}
                  style={[styles.soilChip, soilTextureInput === st && styles.soilChipActive]}>
                  <Text style={[styles.soilChipText, soilTextureInput === st && styles.soilChipTextActive]}>
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {saveError && (
            <BackendReachabilityBanner
              isUrdu={language === 'ur'}
              error={saveError}
              onRetry={handleSaveDrawnField}
              style={{ marginHorizontal: 0, marginBottom: 8 }}
            />
          )}
          {/* Action Buttons */}
          <View style={styles.addFieldActionsRow}>
            <TouchableOpacity
              onPress={() => setIsDrawModeOpen(false)}
              style={styles.cancelFieldBtn}
              activeOpacity={0.7}>
              <Text style={styles.cancelFieldBtnText}>{t.cancel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveDrawnField}
              style={styles.saveFieldBtn}
              activeOpacity={0.85}>
              <Text style={[styles.saveFieldBtnText, { fontSize: 14 * fontMultiplier }]}>
              {saveStatus === 'saving' ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={[styles.saveFieldBtnText, { fontSize: 14 * fontMultiplier }]}>
                    {language === 'ur' ? 'محفوظ ہو رہا ہے...' : 'Saving Field...'}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={[styles.saveFieldBtnText, { fontSize: 14 * fontMultiplier }]}>
                    {language === 'ur' ? 'کھیت محفوظ کریں' : 'Save Field to Map'}
                  </Text>
                </>
              )}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      ) : selectedMapField ? (
        /* ─── Standard Selected Field Bottom Card (Shown only when a field is selected) ─── */
        <View style={styles.bottomCard}>
          <TouchableOpacity
            style={styles.closeCardBtn}
            onPress={() => setSelectedMapField(null)}
            activeOpacity={0.7}>
            <Ionicons name="close" size={18} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.bottomCardHandle} />
          {/* Accent bar */}
          <View style={[styles.bottomAccent, { backgroundColor: selectedMapField.cycleStatus === 'not_started' ? '#64748B' : selectedMapField.color }]} />

          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <View style={styles.codeRow}>
                <Text style={[styles.cardCode, { fontSize: 17 * fontMultiplier }]}>
                  {selectedMapField.code}
                </Text>
                {selectedMapField.isMine ? (
                  <View style={styles.mineTag}>
                    <Text style={styles.mineTagText}>{t.myFieldTag}</Text>
                  </View>
                ) : (
                  <View style={styles.neighborTag}>
                    <Text style={styles.neighborTagText}>{t.nearbyPlotTag}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardName}>
                {selectedMapField.name} · {selectedMapField.acres} Acres
              </Text>
            </View>

            <View style={[styles.stageTag, { backgroundColor: selectedMapField.cycleStatus === 'not_started' ? '#64748B' : selectedMapField.color }]}>
              <Text style={styles.stageTagText}>
                {selectedMapField.cycleStatus === 'not_started'
                  ? (language === 'ur' ? 'فصل شروع نہیں' : 'Not Started')
                  : selectedMapField.stageName}
              </Text>
            </View>
          </View>

          {selectedMapField.cycleStatus === 'not_started' ? (
            <View style={styles.unstartedCycleBox}>
              <View style={styles.unstartedBanner}>
                <Ionicons name="time-outline" size={16} color="#B45309" style={{ marginTop: 1 }} />
                <Text style={styles.unstartedBannerText}>
                  {language === 'ur' ? 'کھیت کی باؤنڈری درج ہو چکی ہے۔ بیج اور کھاد منتخب کر کے فصل شروع کریں۔' : 'Boundary registered. Choose variant & fertilizer to start crop tracking.'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsStartCycleOpen(true)}
                style={styles.startCycleMainBtn}
                activeOpacity={0.85}>
                <MaterialCommunityIcons name="sprout" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[styles.startCycleMainBtnText, { fontSize: 15 * fontMultiplier }]}>
                  {language === 'ur' ? 'فصل شروع کریں' : 'Start Crop Cycle'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Stats Row with Icons */}
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Ionicons name="resize-outline" size={14} color={Colors.light.textMuted} style={{ marginBottom: 2 }} />
                  <Text style={styles.statLabel}>{t.area}</Text>
                  <Text style={styles.statValue}>{selectedMapField.acres} Ac</Text>
                </View>
                <View style={styles.statCol}>
                  <Ionicons name="analytics-outline" size={14} color={Colors.light.primary} style={{ marginBottom: 2 }} />
                  <Text style={styles.statLabel}>{t.yieldEfficiency}</Text>
                  <Text style={[styles.statValue, { color: Colors.light.primary }]}>{selectedMapField.yieldKgSqm} kg/m²</Text>
                </View>
                <View style={styles.statCol}>
                  <Ionicons name="trophy-outline" size={14} color="#D97706" style={{ marginBottom: 2 }} />
                  <Text style={styles.statLabel}>{t.yieldPerAcre}</Text>
                  <Text style={styles.statValue}>{(selectedMapField.yieldKgSqm * 100).toFixed(0)} M</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/field-profile')}
                style={styles.inspectBtn}
                activeOpacity={0.85}>
                <Text style={[styles.inspectBtnText, { fontSize: 14 * fontMultiplier }]}>{t.viewFullProfile}</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : null}

      {/* Floating Audio Player */}
      <AudioMiniPlayer />

      {/* Start Crop Cycle Modal */}
      {isStartCycleOpen && (
        <StartCycleModal
          visible={isStartCycleOpen}
          field={selectedMapField}
          onClose={() => setIsStartCycleOpen(false)}
          onSuccess={(code) => {
            setToastMessage(
              language === 'ur'
                ? `${code} کے لیے فصل کا دورانیہ کامیابی سے شروع ہو گیا ہے!`
                : `Crop cycle successfully started for ${code}!`
            );
            setTimeout(() => setToastMessage(null), 3500);
          }}
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  screenSubtitle: {
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 1,
  },

  // Controls Row (Layer Switcher & Add Field Btn)
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 8,
  },
  layerSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.sm,
    padding: 3,
    gap: 2,
    flex: 1,
  },
  layerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: Radius.sm - 2,
  },
  layerBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  layerBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#64748B',
  },
  layerBtnTextActive: {
    color: '#15803D',
    fontFamily: FontFamily.bold,
  },
  addFieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addFieldBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Filter Pills Row
  filterPillsRow: {
    gap: 6,
    paddingBottom: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  filterPillText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#15803D',
    fontFamily: FontFamily.bold,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },

  // ─── Real Map Canvas ───────────────────────
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  toastBanner: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    zIndex: 100,
    borderWidth: 1,
    borderColor: '#22C55E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    fontFamily: FontFamily.semiBold,
    color: '#FFFFFF',
    fontSize: 12,
    flex: 1,
  },

  // Floating Drawing Top Bar
  drawingTopBar: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#22C55E',
    zIndex: 95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    gap: 6,
  },
  drawingTopMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawingTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  drawingLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  drawingTopTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  drawingTopSub: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#86EFAC',
  },
  closeDrawBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  topShapeChipsRow: {
    flexDirection: 'row',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 6,
  },
  topShapeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  topShapeChipActive: {
    backgroundColor: '#16A34A',
    borderColor: '#22C55E',
  },
  topShapeChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10.5,
    color: '#94A3B8',
  },
  topShapeChipTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },

  // Collapsible Legend Overlay
  legend: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(8px)',
    borderRadius: Radius.md,
    padding: 8,
    zIndex: 90,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  legendTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#0F172A',
  },
  legendList: {
    marginTop: 6,
    gap: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#475569',
  },

  keyboardAvoidingWrap: {
    width: '100%',
    zIndex: 90,
  },
  // ─── Add Field Bottom Panel ────────────────
  addFieldBottomPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addFieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addFieldTitle: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  addFieldSub: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  acresLiveBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  acresLiveText: {
    fontFamily: FontFamily.extraBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  fieldNameInputGroup: {
    marginBottom: 10,
  },
  inlineInputsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  miniLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10.5,
    color: '#475569',
    marginBottom: 3,
  },
  miniTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#0F172A',
  },
  soilTextureRow: {
    marginBottom: 12,
  },
  soilChipsGroup: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 3,
  },
  soilChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  soilChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  soilChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: '#475569',
  },
  soilChipTextActive: {
    color: '#15803D',
    fontFamily: FontFamily.bold,
  },
  addFieldActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelFieldBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFieldBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: '#64748B',
  },
  saveFieldBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 11,
    borderRadius: Radius.md,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  saveFieldBtnText: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  closeCardBtn: {
    position: 'absolute',
    top: 10,
    right: 14,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ─── Bottom Floating Card ──────────────────
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bottomCardHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 8,
  },
  bottomAccent: {
    height: 3,
    borderRadius: 1.5,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardCode: {
    fontFamily: FontFamily.extraBold,
    color: '#0F172A',
  },
  mineTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mineTagText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#15803D',
  },
  neighborTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  neighborTagText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#64748B',
  },
  cardName: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  stageTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  stageTagText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#64748B',
  },
  statValue: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#0F172A',
    marginTop: 1,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  inspectBtnText: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  // Unstarted Cycle Box
  unstartedCycleBox: {
    gap: 10,
  },
  unstartedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    gap: 6,
  },
  unstartedBannerText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#B45309',
    flex: 1,
  },
  startCycleMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  startCycleMainBtnText: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
});
