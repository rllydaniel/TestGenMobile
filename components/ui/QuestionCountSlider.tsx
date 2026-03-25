import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptic } from '@/hooks/useHaptic';
import { FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';

interface QuestionCountSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  freeMax?: number;
  isPremium?: boolean;
}

export function QuestionCountSlider({
  value,
  onChange,
  min = 5,
  max = 50,
  step = 5,
  freeMax = 20,
  isPremium = false,
}: QuestionCountSliderProps) {
  const { colors } = useTheme();
  const { impact } = useHaptic();

  const trackWidth = useRef(0);
  const lastSnapped = useRef(value);

  const pct = (value - min) / (max - min);
  const showProBadge = value > freeMax && !isPremium;
  const freeMaxPct = (freeMax - min) / (max - min);

  const valueFromX = useCallback(
    (x: number) => {
      const ratio = Math.max(0, Math.min(1, x / trackWidth.current));
      const raw = min + ratio * (max - min);
      const snapped = Math.round(raw / step) * step;
      return Math.max(min, Math.min(max, snapped));
    },
    [min, max, step],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        const v = valueFromX(x);
        if (v !== lastSnapped.current) {
          lastSnapped.current = v;
          impact();
          onChange(v);
        }
      },
      onPanResponderMove: (e) => {
        const x = e.nativeEvent.locationX;
        const v = valueFromX(x);
        if (v !== lastSnapped.current) {
          lastSnapped.current = v;
          impact();
          onChange(v);
        }
      },
    }),
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  };

  const ringColor =
    value >= 40 ? colors.primary : value >= 20 ? colors.success : colors.primary;

  return (
    <View style={styles.container}>
      {/* Value display */}
      <View style={styles.valueRow}>
        <Text style={[styles.valueText, { color: colors.textPrimary }]}>
          {value}
          <Text style={[styles.valueUnit, { color: colors.textMuted }]}> questions</Text>
        </Text>
        {showProBadge && (
          <View style={[styles.proBadge, { backgroundColor: '#7C3AED' }]}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        )}
      </View>

      {/* Track + thumb */}
      <View
        style={styles.trackContainer}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        {/* Background track */}
        <View style={[styles.track, { backgroundColor: colors.border }]} />

        {/* Free tier limit marker */}
        {!isPremium && (
          <View
            style={[
              styles.limitMarker,
              {
                left: `${freeMaxPct * 100}%` as any,
                backgroundColor: colors.textFaint,
              },
            ]}
          />
        )}

        {/* Filled track */}
        <View
          style={[
            styles.fill,
            {
              width: `${pct * 100}%` as any,
              backgroundColor: showProBadge ? '#7C3AED' : ringColor,
            },
          ]}
        />

        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: `${pct * 100}%` as any,
              backgroundColor: showProBadge ? '#7C3AED' : ringColor,
              borderColor: colors.appBackground,
            },
          ]}
        />
      </View>

      {/* Min / max labels */}
      <View style={styles.labelsRow}>
        <Text style={[styles.labelText, { color: colors.textFaint }]}>{min}</Text>
        {!isPremium && (
          <Text style={[styles.labelFree, { color: colors.textFaint }]}>
            Free up to {freeMax}
          </Text>
        )}
        <Text style={[styles.labelText, { color: colors.textFaint }]}>{max}</Text>
      </View>

      {showProBadge && (
        <Text style={[styles.upsellText, { color: colors.textMuted }]}>
          Upgrade to Pro to generate up to {max} questions
        </Text>
      )}
    </View>
  );
}

const TRACK_HEIGHT = 6;
const THUMB_SIZE = 22;

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  valueText: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.displayBold,
    includeFontPadding: false,
  },
  valueUnit: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
  },
  proBadge: {
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansBold,
    includeFontPadding: false,
  },
  trackContainer: {
    height: THUMB_SIZE + 8,
    justifyContent: 'center',
    paddingHorizontal: THUMB_SIZE / 2,
    marginHorizontal: -(THUMB_SIZE / 2),
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    position: 'absolute',
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
  },
  fill: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    position: 'absolute',
    left: THUMB_SIZE / 2,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    position: 'absolute',
    marginLeft: -(THUMB_SIZE / 2),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  limitMarker: {
    position: 'absolute',
    width: 2,
    height: 14,
    borderRadius: 1,
    marginLeft: -1,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: 0,
  },
  labelText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    includeFontPadding: false,
  },
  labelFree: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    includeFontPadding: false,
  },
  upsellText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    marginTop: SPACING.sm,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
