import React from 'react';
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

  const showProBadge = value > freeMax && !isPremium;

  const handleValueChange = (val: number) => {
    const snapped = Math.round(val / step) * step;
    const clamped = Math.max(min, Math.min(max, snapped));
    if (clamped !== value) {
      impact();
      onChange(clamped);
    }
  };

  const thumbColor = showProBadge ? '#7C3AED' : colors.primary;

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

      {/* Native slider */}
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={handleValueChange}
        minimumTrackTintColor={thumbColor}
        maximumTrackTintColor={colors.border}
        thumbTintColor={thumbColor}
      />

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

const styles = StyleSheet.create({
  container: {
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
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.sansBold,
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
  slider: {
    width: '100%',
    height: 40,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
