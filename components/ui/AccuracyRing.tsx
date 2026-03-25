import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  withTiming,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AccuracyRingProps {
  accuracy: number;       // 0–100
  size?: number;          // default 80
  strokeWidth?: number;   // default 7
}

export const AccuracyRing = ({ accuracy, size = 80, strokeWidth = 7 }: AccuracyRingProps) => {
  const { colors } = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(300, withTiming(accuracy / 100, { duration: 1200 }));
  }, [accuracy]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const ringColor = accuracy >= 80
    ? colors.success
    : accuracy >= 50
    ? colors.warning
    : colors.error;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={{
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{
          fontFamily: FONTS.displayBold,
          fontSize: Math.round(size * 0.22),
          color: ringColor,
          lineHeight: Math.round(size * 0.27),
          includeFontPadding: false,
        }}>
          {Math.round(accuracy)}%
        </Text>
      </View>
    </View>
  );
};
