import React from 'react';
import { View, Text } from 'react-native';
import { theme } from '@/lib/theme';

interface BadgeProps {
  text: string;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md';
}

export function Badge({
  text,
  color = theme.primary,
  textColor,
  size = 'sm',
}: BadgeProps) {
  const isSmall = size === 'sm';
  return (
    <View
      style={{
        backgroundColor: color + '20',
        paddingHorizontal: isSmall ? 8 : 12,
        paddingVertical: isSmall ? 3 : 5,
        borderRadius: 6,
      }}
    >
      <Text
        style={{
          color: textColor ?? color,
          fontSize: isSmall ? 11 : 13,
          fontWeight: '600',
        }}
      >
        {text}
      </Text>
    </View>
  );
}
