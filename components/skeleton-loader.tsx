import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ViewStyle } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = Radius.sm,
  style,
}: SkeletonProps) {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

/**
 * Dashboard Hero & Metrics Skeleton Loader
 * Emulates the top field selector and the main card while fields/cycles are loading.
 */
export function DashboardFieldsSkeleton() {
  return (
    <View style={styles.container}>
      {/* Field Carousel Chip Skeleton Row */}
      <View style={styles.chipsRow}>
        <SkeletonLoader width={110} height={34} borderRadius={Radius.full} />
        <SkeletonLoader width={125} height={34} borderRadius={Radius.full} />
        <SkeletonLoader width={90} height={34} borderRadius={Radius.full} />
      </View>

      {/* Main Growth Stage / Field Summary Card Skeleton */}
      <View style={styles.cardSkeleton}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonLoader width="35%" height={12} />
            <SkeletonLoader width="65%" height={24} />
            <SkeletonLoader width="45%" height={14} />
          </View>
          <SkeletonLoader width={48} height={48} borderRadius={24} />
        </View>

        {/* Advisory Box Skeleton */}
        <View style={styles.advisoryBox}>
          <SkeletonLoader width="90%" height={14} style={{ marginBottom: 6 }} />
          <SkeletonLoader width="70%" height={14} />
        </View>

        {/* 2x2 Metric Grid Skeleton */}
        <View style={styles.gridRow}>
          <SkeletonLoader width="48%" height={68} borderRadius={Radius.md} />
          <SkeletonLoader width="48%" height={68} borderRadius={Radius.md} />
          <SkeletonLoader width="48%" height={68} borderRadius={Radius.md} />
          <SkeletonLoader width="48%" height={68} borderRadius={Radius.md} />
        </View>
      </View>

      {/* Action Buttons Skeleton */}
      <View style={styles.cardSkeleton}>
        <SkeletonLoader width="40%" height={18} style={{ marginBottom: 12 }} />
        <SkeletonLoader width="100%" height={48} borderRadius={Radius.md} style={{ marginBottom: 10 }} />
        <SkeletonLoader width="100%" height={48} borderRadius={Radius.md} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#CBD5E1',
  },
  container: {
    gap: Spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  cardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advisoryBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
});

