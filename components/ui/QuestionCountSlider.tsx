import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

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

  // Generate all valid step values
  const steps = useMemo(() => {
    const result: number[] = [];
    for (let v = min; v <= max; v += step) {
      result.push(v);
    }
    return result;
  }, [min, max, step]);

  const handleSelect = useCallback(
    (val: number) => {
      if (val !== value) {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onChange(val);
      }
    },
    [value, onChange],
  );

  const showProBadge = value > freeMax && !isPremium;
  const fraction = (value - min) / (max - min);

  return (
    <View style={styles.container}>
      {/* Value display */}
      <View style={styles.valueRow}>
        <Text style={[styles.valueText, { color: colors.textPrimary }]}>
          {value}
        </Text>
        {showProBadge && (
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        )}
      </View>

      {/* Track with tick marks */}
      <View style={styles.trackContainer}>
        {/* Background track */}
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          {/* Active fill */}
          <View
            style={[
              styles.activeTrack,
              {
                backgroundColor: colors.primary,
                width: `${fraction * 100}%`,
              },
            ]}
          />
        </View>

        {/* Tick marks / step buttons */}
        <View style={styles.tickRow}>
          {steps.map((stepVal) => {
            const pos = ((stepVal - min) / (max - min)) * 100;
            const isSelected = stepVal === value;
            const isActive = stepVal <= value;
            return (
              <Pressable
                key={stepVal}
                onPress={() => handleSelect(stepVal)}
                style={[
                  styles.tickButton,
                  { left: `${pos}%` },
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
              >
                <View
                  style={[
                    isSelected ? styles.thumbDot : styles.tickDot,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : isActive
                        ? colors.primary
                        : colors.border,
                    },
                    isSelected && SHADOWS.md,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Step labels */}
      <View style={styles.labelsRow}>
        {steps.map((stepVal) => {
          const pos = ((stepVal - min) / (max - min)) * 100;
          const isSelected = stepVal === value;
          return (
            <Pressable
              key={stepVal}
              onPress={() => handleSelect(stepVal)}
              style={[styles.labelButton, { left: `${pos}%` }]}
            >
              <Text
                style={[
                  styles.labelText,
                  {
                    color: isSelected ? colors.primary : colors.textMuted,
                    fontFamily: isSelected ? FONTS.sansBold : FONTS.sansRegular,
                  },
                ]}
              >
                {stepVal}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Upsell text */}
      {showProBadge && (
        <Text style={[styles.upsellText, { color: colors.textMuted }]}>
          Upgrade for more questions
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  valueText: {
    fontSize: FONT_SIZES.display,
    fontFamily: FONTS.displayBold,
    includeFontPadding: false,
  },
  proBadge: {
    backgroundColor: '#7C3AED',
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
    width: '100%',
    height: 28,
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  track: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  activeTrack: {
    height: 6,
    borderRadius: 3,
  },
  tickRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 28,
  },
  tickButton: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 28,
    marginLeft: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  thumbDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  labelsRow: {
    width: '100%',
    height: 20,
    position: 'relative',
  },
  labelButton: {
    position: 'absolute',
    top: 0,
    marginLeft: -14,
    width: 28,
    alignItems: 'center',
  },
  labelText: {
    fontSize: FONT_SIZES.xs,
    includeFontPadding: false,
  },
  upsellText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    marginTop: SPACING.md,
    includeFontPadding: false,
  },
});
