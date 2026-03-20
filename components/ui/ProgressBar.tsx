import React from 'react';
import { View } from 'react-native';
import { theme } from '@/lib/theme';

interface ProgressBarProps {
  progress: number; // 0-1
  color?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  color = theme.primary,
  height = 6,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View
      style={{
        height,
        backgroundColor: theme.cardBorder,
        borderRadius: height / 2,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: '100%',
          width: `${clampedProgress * 100}%`,
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}
