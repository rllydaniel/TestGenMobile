import React from 'react';
import { View, Text } from 'react-native';
import { FONTS, FONT_SIZES, RADIUS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface BadgeProps {
  text: string;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md';
}

export const Badge = React.memo(function Badge({
  text,
  color,
  textColor,
  size = 'sm',
}: BadgeProps) {
  const { colors } = useTheme();
  const resolvedColor = color ?? colors.primary;
  const isSmall = size === 'sm';

  return (
    <View
      style={{
        backgroundColor: resolvedColor + '20',
        paddingHorizontal: isSmall ? 8 : 12,
        paddingVertical: isSmall ? 3 : 5,
        borderRadius: RADIUS.xs,
      }}
    >
      <Text
        style={{
          color: textColor ?? resolvedColor,
          fontSize: isSmall ? FONT_SIZES.xs : FONT_SIZES.sm,
          fontFamily: FONTS.sansMedium,
          lineHeight: (isSmall ? FONT_SIZES.xs : FONT_SIZES.sm) * 1.5,
        }}
      >
        {text}
      </Text>
    </View>
  );
});
