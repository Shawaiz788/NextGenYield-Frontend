import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { logger } from '@/services/logger';

export const BLUR_VARIANCE_THRESHOLD = 100;
export const SHARP_VARIANCE_THRESHOLD = 180;
const BLUR_ANALYSIS_SIZE = 256;
const BRIDGE_TIMEOUT_MS = 1500;
const CHUNK_SIZE = 262144; // 256 KB per injectJavaScript call

export interface LaplacianBlurResult {
  laplacianVariance: number;
  sharpnessScore: number; // 0 to 100
  isBlurry: boolean;
  qualityLabel: 'sharp' | 'acceptable' | 'blurry';
  threshold: number;
}

/**
 * Classifies a 2D Laplacian variance value into sharpness status and a 0-100 score.
 */
export function classifyLaplacianVariance(
  variance: number,
  threshold: number = BLUR_VARIANCE_THRESHOLD
): LaplacianBlurResult {
  const safeVariance = Number.isFinite(variance) ? Math.max(0, variance) : 0;
  const roundedVariance = Math.round(safeVariance * 100) / 100;

  let sharpnessScore: number;
  if (safeVariance < threshold) {
    sharpnessScore = (safeVariance / threshold) * 55;
  } else {
    sharpnessScore = 55 + ((safeVariance - threshold) / 250) * 45;
  }
  const clampedScore = Math.round(Math.min(100, Math.max(0, sharpnessScore)));

  const isBlurry = safeVariance < threshold;
  const qualityLabel: LaplacianBlurResult['qualityLabel'] = isBlurry
    ? 'blurry'
    : safeVariance >= SHARP_VARIANCE_THRESHOLD
    ? 'sharp'
    : 'acceptable';

  return {
    laplacianVariance: roundedVariance,
    sharpnessScore: clampedScore,
    isBlurry,
    qualityLabel,
    threshold,
  };
}

function getMimeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function resolveImageDataUri(
  imageUri: string,
  base64?: string | null
): Promise<string> {
  if (imageUri.startsWith('data:')) {
    return imageUri;
  }
  if (base64 && base64.length > 0) {
    if (base64.startsWith('data:')) {
      return base64;
    }
    const mime = getMimeFromUri(imageUri);
    return `data:${mime};base64,${base64}`;
  }

  // Fallback for local URIs / blob URLs when base64 is not supplied
  const response = await fetch(imageUri);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to encode image as data URL'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error while reading image'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Self-contained HTML5 Canvas 2D Laplacian analyzer shared across Web iframe and Native WebView.
 */
const LAPLACIAN_ANALYZER_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body>
<script>
(function () {
  var SIZE = ${BLUR_ANALYSIS_SIZE};
  var chunks = [];
  var activeRequestId = null;

  function sendToHost(payload) {
    var json = JSON.stringify(payload);
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(json);
    } else if (window.parent && window.parent !== window) {
      window.parent.postMessage(json, '*');
    }
  }

  function computeVarianceFromRgba(rgba, width, height) {
    var totalPixels = width * height;
    var gray = new Float32Array(totalPixels);

    for (var i = 0; i < totalPixels; i++) {
      var off = i * 4;
      gray[i] = 0.299 * rgba[off] + 0.587 * rgba[off + 1] + 0.114 * rgba[off + 2];
    }

    var interiorW = width - 2;
    var interiorH = height - 2;
    var interiorCount = interiorW * interiorH;
    if (interiorCount <= 0) return 0;

    var lapValues = new Float32Array(interiorCount);
    var sum = 0;
    var idx = 0;

    // 3x3 Discrete Laplacian kernel: [0, 1, 0; 1, -4, 1; 0, 1, 0]
    for (var y = 1; y < height - 1; y++) {
      var row = y * width;
      for (var x = 1; x < width - 1; x++) {
        var pos = row + x;
        var lap =
          gray[pos - width] +
          gray[pos + width] +
          gray[pos - 1] +
          gray[pos + 1] -
          4 * gray[pos];
        lapValues[idx++] = lap;
        sum += lap;
      }
    }

    var mean = sum / interiorCount;
    var sqDiffSum = 0;
    for (var j = 0; j < interiorCount; j++) {
      var diff = lapValues[j] - mean;
      sqDiffSum += diff * diff;
    }

    return sqDiffSum / interiorCount;
  }

  function analyzeSource(requestId, dataUrl) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      try {
        var canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          throw new Error('2D canvas context unavailable');
        }
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        var imageData = ctx.getImageData(0, 0, SIZE, SIZE);
        var variance = computeVarianceFromRgba(imageData.data, SIZE, SIZE);
        img.src = '';
        canvas.width = 0;
        canvas.height = 0;
        sendToHost({ type: 'blur_result', id: requestId, variance: variance });
      } catch (err) {
        sendToHost({
          type: 'blur_result',
          id: requestId,
          error: (err && err.message) ? err.message : 'Canvas analysis failed',
        });
      }
    };
    img.onerror = function () {
      sendToHost({
        type: 'blur_result',
        id: requestId,
        error: 'Image decode error in canvas bridge',
      });
    };
    img.src = dataUrl;
  }

  window.__blurReset = function (requestId) {
    activeRequestId = requestId;
    chunks = [];
  };

  window.__blurAppend = function (chunk) {
    chunks.push(chunk);
  };

  window.__blurAnalyze = function (requestId) {
    var dataUrl = chunks.join('');
    chunks = [];
    analyzeSource(requestId || activeRequestId, dataUrl);
  };

  window.addEventListener('message', function (event) {
    try {
      var msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (msg && msg.type === 'analyze' && msg.id && msg.src) {
        analyzeSource(msg.id, msg.src);
      }
    } catch (_) {}
  });

  sendToHost({ type: 'blur_bridge_ready' });
})();
</script>
</body>
</html>`;

interface PendingRequest {
  resolve: (result: LaplacianBlurResult | null) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Hook providing an off-screen HTML5 Canvas Laplacian blur checker and its hidden bridge element.
 */
export function useLaplacianBlurChecker() {
  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isBridgeReadyRef = useRef<boolean>(false);
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map());
  const requestSeqRef = useRef<number>(0);

  const settleRequest = useCallback(
    (id: string, result: LaplacianBlurResult | null) => {
      const pending = pendingRef.current.get(id);
      if (!pending) return;
      clearTimeout(pending.timer);
      pendingRef.current.delete(id);
      pending.resolve(result);
    },
    []
  );

  const handleRawBridgePayload = useCallback(
    (rawData: string) => {
      try {
        const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        if (!parsed || typeof parsed !== 'object') return;

        if (parsed.type === 'blur_bridge_ready') {
          isBridgeReadyRef.current = true;
          return;
        }

        if (parsed.type === 'blur_result' && parsed.id) {
          if (parsed.error || typeof parsed.variance !== 'number') {
            logger.warn('[NextGenYield:BlurCheck]', 'Bridge returned error:', parsed.error);
            settleRequest(parsed.id, null);
            return;
          }

          const evaluation = classifyLaplacianVariance(parsed.variance);
          logger.info('[NextGenYield:BlurCheck]', {
            laplacianVariance: evaluation.laplacianVariance,
            sharpnessScore: evaluation.sharpnessScore,
            isBlurry: evaluation.isBlurry,
            qualityLabel: evaluation.qualityLabel,
          });
          settleRequest(parsed.id, evaluation);
        }
      } catch {
        // Ignore unrelated window messages on Web
      }
    },
    [settleRequest]
  );

  // Listen for iframe messages on Web
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const onWindowMessage = (event: MessageEvent) => {
      handleRawBridgePayload(event.data);
    };

    window.addEventListener('message', onWindowMessage);
    return () => window.removeEventListener('message', onWindowMessage);
  }, [handleRawBridgePayload]);

  // Cleanup any dangling timeouts on unmount
  useEffect(() => {
    const pendingMap = pendingRef.current;
    return () => {
      pendingMap.forEach((entry) => clearTimeout(entry.timer));
      pendingMap.clear();
    };
  }, []);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      handleRawBridgePayload(event.nativeEvent.data);
    },
    [handleRawBridgePayload]
  );

  const checkBlur = useCallback(
    async (
      imageUri: string,
      base64?: string | null
    ): Promise<LaplacianBlurResult | null> => {
      const requestId = `blur_${Date.now()}_${++requestSeqRef.current}`;

      let dataUri: string;
      try {
        dataUri = await resolveImageDataUri(imageUri, base64);
      } catch (err: any) {
        logger.warn(
          '[NextGenYield:BlurCheck]',
          'Could not read image data for blur check:',
          err?.message || err
        );
        return null;
      }

      return new Promise<LaplacianBlurResult | null>((resolve) => {
        const timer = setTimeout(() => {
          logger.warn('[NextGenYield:BlurCheck]', `Timed out after ${BRIDGE_TIMEOUT_MS}ms`);
          settleRequest(requestId, null);
        }, BRIDGE_TIMEOUT_MS);

        pendingRef.current.set(requestId, { resolve, timer });

        if (Platform.OS === 'web') {
          const targetWindow = iframeRef.current?.contentWindow;
          if (!targetWindow) {
            logger.warn('[NextGenYield:BlurCheck]', 'Web iframe bridge not ready');
            settleRequest(requestId, null);
            return;
          }
          targetWindow.postMessage(
            JSON.stringify({ type: 'analyze', id: requestId, src: dataUri }),
            '*'
          );
          return;
        }

        const webView = webViewRef.current;
        if (!webView) {
          logger.warn('[NextGenYield:BlurCheck]', 'Native WebView bridge not mounted');
          settleRequest(requestId, null);
          return;
        }

        webView.injectJavaScript(`window.__blurReset(${JSON.stringify(requestId)}); true;`);
        for (let offset = 0; offset < dataUri.length; offset += CHUNK_SIZE) {
          const slice = dataUri.slice(offset, offset + CHUNK_SIZE);
          webView.injectJavaScript(`window.__blurAppend(${JSON.stringify(slice)}); true;`);
        }
        webView.injectJavaScript(`window.__blurAnalyze(${JSON.stringify(requestId)}); true;`);
      });
    },
    [settleRequest]
  );

  const BlurCheckerBridge = useMemo(() => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.hiddenContainer} pointerEvents="none">
          <iframe
            ref={iframeRef}
            srcDoc={LAPLACIAN_ANALYZER_HTML}
            style={{ width: 1, height: 1, border: 'none', opacity: 0 }}
            title="Laplacian Blur Analyzer"
          />
        </View>
      );
    }

    return (
      <View style={styles.hiddenContainer} pointerEvents="none">
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: LAPLACIAN_ANALYZER_HTML }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={false}
          style={styles.hiddenWebView}
        />
      </View>
    );
  }, [handleWebViewMessage]);

  return {
    checkBlur,
    BlurCheckerBridge,
  };
}

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
    top: -10,
    left: -10,
    zIndex: -1,
  },
  hiddenWebView: {
    width: 1,
    height: 1,
    opacity: 0,
    backgroundColor: 'transparent',
  },
});
