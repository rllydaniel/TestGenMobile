import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
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
  const lastValue = useRef(value);

  const showProBadge = value > freeMax && !isPremium;

  function handleValueChange(v: number) {
    const snapped = Math.round(v / step) * step;
    const clamped = Math.max(min, Math.min(max, snapped));
    if (clamped !== lastValue.current) {
      lastValue.current = clamped;
      impact();
      onChange(clamped);
    }
  }

  return (
    <View style={styles.container}>
      {/* Value + badge */}
      <View style={styles.valueRow}>
        <Text style={[styles.valueText, { color: colors.textPrimary }]}>
          {value}
        </Text>
        {showProBadge && (
          <View style={[styles.proBadge, { backgroundColor: '#7C3AED' }]}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        )}
      </View>

      {/* Native slider */}
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={handleValueChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />

      {/* Min / max labels */}
      <View style={styles.labelsRow}>
        <Text style={[styles.labelText, { color: colors.textMuted }]}>{min}</Text>
        <Text style={[styles.labelText, { color: colors.textMuted }]}>{max}</Text>
      </View>

      {/* Upsell */}
      {showProBadge && (
        <Text style={[styles.upsellText, { color: colors.textMuted }]}>
          Upgrade to generate more than {freeMax} questions
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    paddingTop: SPACING.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  valueText: {
    fontSize: FONT_SIZES.display,
    fontFamily: FONTS.displayBold,
    includeFontPadding: false,
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
  slider: {
    width: '100%',
    height: 40,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: -4,
  },
  labelText: {
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
