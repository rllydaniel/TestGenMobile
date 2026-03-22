import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ProgressBarProps {
  progress: number; // 0-1
  color?: string;
  height?: number;
  animated?: boolean;
}

export const ProgressBar = React.memo(function ProgressBar({
  progress,
  color,
  height = 6,
  animated = true,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const resolvedColor = color ?? colors.primary;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: clampedProgress,
        duration: 600,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(clampedProgress);
    }
  }, [clampedProgress, animated]);

  return (
    <View
      style={{
        height,
        backgroundColor: colors.border,
        borderRadius: height / 2,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          height: '100%',
          width: animatedWidth.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
          backgroundColor: resolvedColor,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
});
