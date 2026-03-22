import React from 'react';
import { Text } from 'react-native';
import { FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export const SectionLabel = ({ children }: { children: string }) => {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        fontFamily: FONTS.sansBold,
        fontSize: FONT_SIZES.xs,
        color: colors.textPrimary,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: SPACING.sm,
      }}
    >
      {children}
    </Text>
  );
};
