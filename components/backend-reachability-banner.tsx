import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, Spacing, Radius } from '@/constants/theme';
import { getBackendBaseUrl } from '@/services/api-client';

declare const __DEV__: boolean;

interface BackendReachabilityBannerProps {
  isUrdu?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  style?: object;
  message?: string;
}

export function BackendReachabilityBanner({
  isUrdu = false,
  error,
  onRetry,
  style,
  message,
}: BackendReachabilityBannerProps) {
  const targetUrl = getBackendBaseUrl();
  const rawMsg = error?.message || message || '';
  const isUnreachable =
    rawMsg.includes('Unable to reach backend') ||
    rawMsg.includes('Network request failed') ||
    rawMsg.includes('Failed to fetch') ||
    rawMsg.includes('Network unavailable');

  const title = isUnreachable
    ? (isUrdu ? 'سرور سے رابطہ نہیں ہو سکا' : 'Unable to reach backend')
    : (isUrdu ? 'سرور الرٹ' : 'Server Notice');

  const defaultMsg = isUnreachable
    ? (isUrdu
        ? `سرور (${targetUrl}) سے رابطہ ممکن نہیں۔ براہ کرم اپنا نیٹ ورک یا سرور چیک کریں۔`
        : `Could not connect to backend at ${targetUrl}. Please check your connection or server status.`)
    : rawMsg;

  return (
    <View style={[styles.container, isUnreachable ? styles.unreachableBg : styles.noticeBg, style]}>
      <Ionicons
        name={isUnreachable ? 'cloud-offline-outline' : 'alert-circle-outline'}
        size={22}
        color={isUnreachable ? '#DC2626' : '#D97706'}
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: isUnreachable ? '#991B1B' : '#92400E' }]}>
          {title}
        </Text>
        <Text style={[styles.message, { color: isUnreachable ? '#B91C1C' : '#B45309' }]}>
          {defaultMsg}
        </Text>

        {typeof __DEV__ !== 'undefined' && __DEV__ && (
          <Text style={styles.devHint}>
            [DEV] Target: {targetUrl}
          </Text>
        )}

        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryBtn} activeOpacity={0.8}>
            <Ionicons name="refresh" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.retryBtnText}>
              {isUrdu ? 'دوبارہ کوشش کریں' : 'Retry'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
  },
  unreachableBg: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  noticeBg: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  icon: {
    marginTop: 2,
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
  },
  message: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  devHint: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    marginTop: 8,
  },
  retryBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
});

export default BackendReachabilityBanner;
