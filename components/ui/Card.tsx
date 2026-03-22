import React from 'react';
import { View, ViewStyle } from 'react-native';
import { RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  shadow?: 'sm' | 'md' | 'lg' | 'none';
}

export const Card = ({ children, style, padding = 'md', shadow = 'md' }: CardProps) => {
  const { colors } = useTheme();
  const paddingMap = { sm: 12, md: 16, lg: 24, none: 0 };

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: RADIUS.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: paddingMap[padding],
        },
        shadow !== 'none' && SHADOWS[shadow],
        style,
      ]}
    >
      {children}
    </View>
  );
};
