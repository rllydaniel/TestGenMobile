import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { RADIUS, SPACING } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = RADIUS.sm,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000 }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  style?: ViewStyle;
}

export function SkeletonText({ lines = 3, style }: SkeletonTextProps) {
  return (
    <View style={[{ gap: 10 }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={16}
        />
      ))}
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View style={{ paddingHorizontal: SPACING.screenH, gap: SPACING.md }}>
      {/* Greeting */}
      <Skeleton width={200} height={28} />

      {/* Exam pill */}
      <Skeleton width={160} height={32} borderRadius={RADIUS.full} />

      {/* Banner */}
      <Skeleton height={72} borderRadius={RADIUS.md} />

      {/* Stats 2x2 grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={{ width: '48%' }}>
            <Skeleton height={100} borderRadius={RADIUS.md} />
          </View>
        ))}
      </View>

      {/* Quick access cards */}
      <Skeleton height={72} borderRadius={RADIUS.md} />
      <Skeleton height={72} borderRadius={RADIUS.md} />

      {/* Recent performance */}
      <Skeleton height={200} borderRadius={RADIUS.md} />
    </View>
  );
}

export function TestHistorySkeleton() {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} height={60} borderRadius={RADIUS.sm} />
      ))}
    </View>
  );
}

export function FlashcardsSkeleton() {
  return (
    <View style={{ gap: SPACING.md }}>
      {/* Header line */}
      <Skeleton width="50%" height={24} />

      {/* 2x2 grid of cards */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={{ width: '48%' }}>
            <Skeleton height={140} borderRadius={RADIUS.md} />
          </View>
        ))}
      </View>
    </View>
  );
}
