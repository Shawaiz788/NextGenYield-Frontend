import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { MapFieldItem } from '@/context/app-context';

interface RealLeafletMapProps {
  fields: MapFieldItem[];
  selectedFieldId: string;
  onSelectField: (id: string) => void;
  mapType: 'satellite' | 'cadastral';
  isDrawMode?: boolean;
  drawShape?: 'polygon' | 'rectangle' | 'square' | 'circle';
  onBoundaryUpdated?: (data: { acres: number; areaSqm: number; coords: [number, number][] }) => void;
  language?: string;
}

export function RealLeafletMap({
  fields,
  selectedFieldId,
  onSelectField,
  mapType,
  isDrawMode = false,
  drawShape = 'polygon',
  onBoundaryUpdated,
  language = 'en',
}: RealLeafletMapProps) {
  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Helper to send action to Leaflet (works on both Web and React Native WebView)
  const sendMapAction = (action: string, payload: any = {}) => {
    const dataObj = { action, ...payload };
    const jsonStr = JSON.stringify(dataObj);

    if (Platform.OS === 'web') {
      try {
        iframeRef.current?.contentWindow?.postMessage(jsonStr, '*');
      } catch (err) {
        console.warn('Web iframe postMessage error:', err);
      }
    } else if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.handleParentAction) { window.handleParentAction(${jsonStr}); }
        true;
      `);
    }
  };

  // Sync Layer Type
  useEffect(() => {
    sendMapAction('switchLayer', { type: mapType });
  }, [mapType]);

  // Sync Field Selection
  useEffect(() => {
    sendMapAction('highlightField', { id: selectedFieldId });
  }, [selectedFieldId]);

  // Sync Draw Mode
  useEffect(() => {
    sendMapAction('setDrawMode', { isDraw: isDrawMode, shape: drawShape });
  }, [isDrawMode, drawShape]);

  // Sync Fields
  useEffect(() => {
    sendMapAction('updateFields', { fields });
  }, [fields]);

  // Web Listener for iframe messages
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const onWebMessage = (event: MessageEvent) => {
      try {
        const raw = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!raw || typeof raw !== 'object') return;

        if (raw.type === 'field_selected') {
          onSelectField(raw.id);
        } else if (raw.type === 'boundary_updated' && onBoundaryUpdated) {
          onBoundaryUpdated({
            acres: raw.acres,
            areaSqm: raw.areaSqm,
            coords: raw.coords,
          });
        }
      } catch {
        // non-JSON message, ignore
      }
    };

    window.addEventListener('message', onWebMessage);
    return () => window.removeEventListener('message', onWebMessage);
  }, [onSelectField, onBoundaryUpdated]);

  const handleZoomIn = () => sendMapAction('zoomIn');
  const handleZoomOut = () => sendMapAction('zoomOut');
  const handleFitBounds = () => sendMapAction('fitBounds');

  // HTML content for Leaflet
  const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #0B132B;
      overflow: hidden;
      -webkit-user-select: none;
      user-select: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #map {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      background: #0B132B;
    }
    .field-tag {
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(4px);
      color: #FFFFFF;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      padding: 3px 7px;
      font-size: 11px;
      font-weight: 700;
      box-shadow: 0 4px 10px rgba(0,0,0,0.45);
      white-space: nowrap;
    }
    .leaflet-tooltip-top:before { border-top-color: rgba(15, 23, 42, 0.88); }
    .leaflet-tooltip-bottom:before { border-bottom-color: rgba(15, 23, 42, 0.88); }

    .center-crosshair {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 24px;
      height: 24px;
      margin-top: -12px;
      margin-left: -12px;
      pointer-events: none;
      z-index: 1000;
      display: none;
    }
    .crosshair-line-h {
      position: absolute;
      top: 11px;
      left: 0;
      width: 24px;
      height: 2px;
      background: #22C55E;
    }
    .crosshair-line-v {
      position: absolute;
      top: 0;
      left: 11px;
      width: 2px;
      height: 24px;
      background: #22C55E;
    }
    .crosshair-dot {
      position: absolute;
      top: 9px;
      left: 9px;
      width: 6px;
      height: 6px;
      border-radius: 3px;
      background: #FFFFFF;
    }
    .draw-hint {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.94);
      color: #FFFFFF;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      z-index: 1000;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      border: 1px solid rgba(34, 197, 94, 0.4);
      display: none;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="drawHint" class="draw-hint">Tap on map to place boundary corners</div>
  <div id="crosshair" class="center-crosshair">
    <div class="crosshair-line-h"></div>
    <div class="crosshair-line-v"></div>
    <div class="crosshair-dot"></div>
  </div>

  <script>
    function postToParent(data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      } else if (window.parent && window.parent.postMessage) {
        window.parent.postMessage(JSON.stringify(data), '*');
      }
    }

    window.onerror = function(message, source, lineno, colno, error) {
      postToParent({
        type: 'webview_error',
        message: String(message),
        lineno: lineno
      });
    };

    var MUSTAFA_TOWN = [31.4985, 74.2700];

    var map = L.map('map', {
      center: MUSTAFA_TOWN,
      zoom: 16,
      zoomControl: true,
      attributionControl: false
    });

    // 1. Satellite Layer: Esri World Imagery (Zero API key)
    var satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Esri World Imagery'
      }
    );

    // 2. Cadastral Layer: CartoDB Voyager
    var cadastralLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 19,
        attribution: '&copy; CartoDB &copy; OpenStreetMap'
      }
    );

    satelliteLayer.addTo(map);
    var activeLayer = satelliteLayer;

    window.switchLayer = function(type) {
      if (type === 'cadastral') {
        if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
        if (!map.hasLayer(cadastralLayer)) cadastralLayer.addTo(map);
        activeLayer = cadastralLayer;
      } else {
        if (map.hasLayer(cadastralLayer)) map.removeLayer(cadastralLayer);
        if (!map.hasLayer(satelliteLayer)) satelliteLayer.addTo(map);
        activeLayer = satelliteLayer;
      }
    };

    var fieldsData = ${JSON.stringify(fields)};
    var polygonLayers = {};

    function renderFields() {
      fieldsData.forEach(function(f) {
        if (!f.coordinates || f.coordinates.length < 3) return;

        var isSelected = f.id === '${selectedFieldId}';
        var color = f.color || '#16A34A';
        var fillColor = f.cycleStatus === 'not_started' ? '#64748B' : color;

        var poly = L.polygon(f.coordinates, {
          color: isSelected ? '#FFFFFF' : color,
          weight: isSelected ? 3.5 : 2,
          fillColor: fillColor,
          fillOpacity: isSelected ? 0.48 : 0.28,
          dashArray: isSelected ? '4, 4' : null
        }).addTo(map);

        poly.bindTooltip(
          '<b>' + f.code + '</b> · ' + f.acres + ' ac',
          {
            permanent: true,
            direction: 'center',
            className: 'field-tag'
          }
        );

        poly.on('click', function(ev) {
          if (window.isDrawing) return;
          L.DomEvent.stopPropagation(ev);
          postToParent({
            type: 'field_selected',
            id: f.id
          });
        });

        polygonLayers[f.id] = poly;
      });
    }

    renderFields();

    window.highlightField = function(id) {
      Object.keys(polygonLayers).forEach(function(k) {
        var p = polygonLayers[k];
        var f = fieldsData.find(function(item) { return item.id === k; });
        if (!f) return;

        if (k === id) {
          p.setStyle({
            color: '#FFFFFF',
            weight: 3.5,
            fillOpacity: 0.52,
            dashArray: '4, 4'
          });
          p.bringToFront();
          map.panTo(p.getBounds().getCenter(), { animate: true, duration: 0.5 });
        } else {
          p.setStyle({
            color: f.color || '#16A34A',
            weight: 2,
            fillOpacity: 0.28,
            dashArray: null
          });
        }
      });
    };

    window.updateFields = function(newFields) {
      fieldsData = newFields || [];
      Object.keys(polygonLayers).forEach(function(k) {
        map.removeLayer(polygonLayers[k]);
      });
      polygonLayers = {};
      renderFields();
    };

    window.fitAllBounds = function() {
      var keys = Object.keys(polygonLayers);
      if (keys.length === 0) {
        map.setView(MUSTAFA_TOWN, 16);
        return;
      }
      var group = L.featureGroup(keys.map(function(k) { return polygonLayers[k]; }));
      map.fitBounds(group.getBounds().pad(0.12));
    };

    // Drawing Logic
    window.isDrawing = ${isDrawMode};
    var currentShape = '${drawShape}';
    var drawPoints = [];
    var drawMarkers = [];
    var tempPolygon = null;

    function computeAreaAcres(latlngs) {
      if (latlngs.length < 3) return { acres: 0, areaSqm: 0 };
      var radius = 6378137;
      var total = 0;
      for (var i = 0; i < latlngs.length; i++) {
        var j = (i + 1) % latlngs.length;
        var p1 = latlngs[i];
        var p2 = latlngs[j];
        var p1Lat = Array.isArray(p1) ? p1[0] : p1.lat;
        var p1Lng = Array.isArray(p1) ? p1[1] : p1.lng;
        var p2Lat = Array.isArray(p2) ? p2[0] : p2.lat;
        var p2Lng = Array.isArray(p2) ? p2[1] : p2.lng;

        total += (p2Lng * Math.PI / 180 - p1Lng * Math.PI / 180) *
                 (2 + Math.sin(p1Lat * Math.PI / 180) + Math.sin(p2Lat * Math.PI / 180));
      }
      var sqm = Math.abs(total * radius * radius / 2.0);
      var acres = Math.round((sqm / 4046.86) * 10) / 10;
      return { acres: acres, areaSqm: Math.round(sqm) };
    }

    function sendBoundaryUpdate(acres, areaSqm, coords) {
      postToParent({
        type: 'boundary_updated',
        acres: acres,
        areaSqm: areaSqm,
        coords: coords
      });
    }

    window.setDrawMode = function(isDraw, shape) {
      window.isDrawing = isDraw;
      currentShape = shape || 'polygon';
      var hint = document.getElementById('drawHint');
      var crosshair = document.getElementById('crosshair');
      if (isDraw) {
        if (hint) {
          hint.style.display = 'block';
          hint.innerText = currentShape === 'polygon'
            ? 'Tap on map to place boundary corners'
            : (currentShape === 'rectangle' ? 'Tap 2 opposite corners for rectangle' : 'Tap on map to draw');
        }
        if (crosshair) crosshair.style.display = 'block';
      } else {
        if (hint) hint.style.display = 'none';
        if (crosshair) crosshair.style.display = 'none';
        drawMarkers.forEach(function(m) { map.removeLayer(m); });
        drawMarkers = [];
        drawPoints = [];
        if (tempPolygon) { map.removeLayer(tempPolygon); tempPolygon = null; }
      }
    };

    map.on('click', function(e) {
      if (!window.isDrawing) return;

      var pt = [Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))];

      if (currentShape === 'polygon') {
        drawPoints.push(pt);
        var m = L.circleMarker(pt, {
          radius: 6,
          color: '#FFFFFF',
          fillColor: '#22C55E',
          fillOpacity: 1,
          weight: 2
        }).addTo(map);
        drawMarkers.push(m);

        if (drawPoints.length >= 3) {
          if (tempPolygon) map.removeLayer(tempPolygon);
          tempPolygon = L.polygon(drawPoints, {
            color: '#22C55E',
            fillColor: '#22C55E',
            fillOpacity: 0.35,
            weight: 2.5,
            dashArray: '5, 5'
          }).addTo(map);

          var calc = computeAreaAcres(drawPoints);
          sendBoundaryUpdate(calc.acres, calc.areaSqm, drawPoints);
        }
      } else if (currentShape === 'rectangle') {
        if (drawPoints.length >= 2) {
          drawMarkers.forEach(function(m) { map.removeLayer(m); });
          drawMarkers = [];
          drawPoints = [];
          if (tempPolygon) { map.removeLayer(tempPolygon); tempPolygon = null; }
        }

        drawPoints.push(pt);
        var m = L.circleMarker(pt, {
          radius: 6,
          color: '#FFFFFF',
          fillColor: '#0284C7',
          fillOpacity: 1,
          weight: 2
        }).addTo(map);
        drawMarkers.push(m);

        if (drawPoints.length === 2) {
          var p1 = drawPoints[0];
          var p2 = drawPoints[1];
          var rectCoords = [
            [p1[0], p1[1]],
            [p1[0], p2[1]],
            [p2[0], p2[1]],
            [p2[0], p1[1]]
          ];
          if (tempPolygon) map.removeLayer(tempPolygon);
          tempPolygon = L.polygon(rectCoords, {
            color: '#0284C7',
            fillColor: '#0284C7',
            fillOpacity: 0.35,
            weight: 2.5,
            dashArray: '5, 5'
          }).addTo(map);
          var calc = computeAreaAcres(rectCoords);
          sendBoundaryUpdate(calc.acres, calc.areaSqm, rectCoords);
        }
      } else if (currentShape === 'square') {
        if (drawPoints.length >= 2) {
          drawMarkers.forEach(function(m) { map.removeLayer(m); });
          drawMarkers = [];
          drawPoints = [];
          if (tempPolygon) { map.removeLayer(tempPolygon); tempPolygon = null; }
        }

        drawPoints.push(pt);
        var m = L.circleMarker(pt, {
          radius: 6,
          color: '#FFFFFF',
          fillColor: '#D97706',
          fillOpacity: 1,
          weight: 2
        }).addTo(map);
        drawMarkers.push(m);

        if (drawPoints.length === 2) {
          var p1 = drawPoints[0];
          var p2 = drawPoints[1];
          var dLat = p2[0] - p1[0];
          var dLng = p2[1] - p1[1];
          var side = Math.max(Math.abs(dLat), Math.abs(dLng));
          var sLat = dLat >= 0 ? side : -side;
          var sLng = dLng >= 0 ? side : -side;
          var sqCoords = [
            [p1[0], p1[1]],
            [p1[0], p1[1] + sLng],
            [p1[0] + sLat, p1[1] + sLng],
            [p1[0] + sLat, p1[1]]
          ];
          if (tempPolygon) map.removeLayer(tempPolygon);
          tempPolygon = L.polygon(sqCoords, {
            color: '#D97706',
            fillColor: '#D97706',
            fillOpacity: 0.35,
            weight: 2.5,
            dashArray: '5, 5'
          }).addTo(map);
          var calc = computeAreaAcres(sqCoords);
          sendBoundaryUpdate(calc.acres, calc.areaSqm, sqCoords);
        }
      }
    });

    window.handleParentAction = function(data) {
      if (!data) return;
      if (data.action === 'switchLayer') {
        window.switchLayer(data.type);
      } else if (data.action === 'highlightField') {
        window.highlightField(data.id);
      } else if (data.action === 'setDrawMode') {
        window.setDrawMode(data.isDraw, data.shape);
      } else if (data.action === 'updateFields') {
        window.updateFields(data.fields);
      } else if (data.action === 'fitBounds') {
        window.fitAllBounds();
      } else if (data.action === 'zoomIn') {
        map.zoomIn();
      } else if (data.action === 'zoomOut') {
        map.zoomOut();
      }
    };

    window.addEventListener('message', function(e) {
      try {
        var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        window.handleParentAction(data);
      } catch(err) {}
    });

    setTimeout(function() {
      map.invalidateSize();
    }, 250);
  </script>
</body>
</html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'field_selected') {
        onSelectField(data.id);
      } else if (data.type === 'boundary_updated' && onBoundaryUpdated) {
        onBoundaryUpdated({
          acres: data.acres,
          areaSqm: data.areaSqm,
          coords: data.coords,
        });
      } else if (data.type === 'webview_error') {
        console.warn('WebView Leaflet error:', data.message, data.lineno);
      }
    } catch {
      // Ignore parse error
    }
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <iframe
          ref={iframeRef}
          srcDoc={leafletHtml}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Leaflet Map"
        />
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: leafletHtml, baseUrl: 'https://unpkg.com' }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={false}
          scrollEnabled={false}
          mixedContentMode="always"
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#16A34A" />
            </View>
          )}
        />
      )}

      {/* Floating Map Zoom & Center Control Buttons */}
      <View style={styles.mapToolsCol}>
        <TouchableOpacity style={styles.mapToolBtn} onPress={handleZoomIn} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapToolBtn} onPress={handleZoomOut} activeOpacity={0.85}>
          <Ionicons name="remove" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapToolBtn} onPress={handleFitBounds} activeOpacity={0.85}>
          <Ionicons name="scan-outline" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  mapToolsCol: {
    position: 'absolute',
    right: 14,
    bottom: 16,
    zIndex: 90,
    gap: 8,
  },
  mapToolBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
