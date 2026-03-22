import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
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

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;

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
  const [trackWidth, setTrackWidth] = useState(0);

  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const valueToPosition = useCallback(
    (val: number) => {
      if (trackWidth === 0) return 0;
      const fraction = (val - min) / (max - min);
      return fraction * trackWidth;
    },
    [trackWidth, min, max],
  );

  const positionToValue = useCallback(
    (pos: number) => {
      if (trackWidth === 0) return min;
      const fraction = Math.max(0, Math.min(1, pos / trackWidth));
      const rawValue = min + fraction * (max - min);
      const snapped = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, snapped));
    },
    [trackWidth, min, max, step],
  );

  // Keep shared value in sync with prop value
  React.useEffect(() => {
    const pos = valueToPosition(value);
    translateX.value = withSpring(pos, { damping: 20, stiffness: 200 });
  }, [value, trackWidth]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleChange = useCallback(
    (newValue: number) => {
      if (newValue !== value) {
        triggerHaptic();
        onChange(newValue);
      }
    },
    [value, onChange, triggerHaptic],
  );

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const newPos = Math.max(0, Math.min(trackWidth, startX.value + event.translationX));
      translateX.value = newPos;
      const newValue = positionToValue(newPos);
      runOnJS(handleChange)(newValue);
    })
    .onEnd(() => {
      const snappedValue = positionToValue(translateX.value);
      const snappedPos = valueToPosition(snappedValue);
      translateX.value = withSpring(snappedPos, { damping: 20, stiffness: 200 });
      runOnJS(handleChange)(snappedValue);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - THUMB_SIZE / 2 }],
  }));

  const activeTrackStyle = useAnimatedStyle(() => ({
    width: translateX.value,
  }));

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  const showProBadge = value > freeMax && !isPremium;

  return (
    <View style={styles.container}>
      {/* Value display */}
      <View style={styles.valueRow}>
        <MotiView
          key={value}
          from={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        >
          <Text
            style={[
              styles.valueText,
              { color: colors.textPrimary },
            ]}
          >
            {value}
          </Text>
        </MotiView>
        {showProBadge && (
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        )}
      </View>

      {/* Slider track */}
      <View style={styles.sliderContainer}>
        <View
          style={[styles.track, { backgroundColor: colors.border }]}
          onLayout={handleLayout}
        >
          <Animated.View
            style={[
              styles.activeTrack,
              { backgroundColor: colors.primary },
              activeTrackStyle,
            ]}
          />
        </View>
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.thumb,
              {
                backgroundColor: colors.primary,
                ...SHADOWS.md,
              },
              thumbStyle,
            ]}
          />
        </GestureDetector>
      </View>

      {/* Min / Max labels */}
      <View style={styles.labelsRow}>
        <Text style={[styles.labelText, { color: colors.textMuted }]}>{min}</Text>
        <Text style={[styles.labelText, { color: colors.textMuted }]}>{max}</Text>
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
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
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
  sliderContainer: {
    width: '100%',
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    width: '100%',
    overflow: 'hidden',
  },
  activeTrack: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: SPACING.xs,
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
    includeFontPadding: false,
  },
});
