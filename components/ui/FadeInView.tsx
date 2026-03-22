import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';

interface FadeInViewProps {
  delay?: number;
  duration?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Drop-in replacement for MotiView entry animations.
 * Fades in + slides up using Reanimated's `entering` layout animation.
 */
export function FadeInView({
  delay = 0,
  duration = 300,
  children,
  style,
}: FadeInViewProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(duration)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
