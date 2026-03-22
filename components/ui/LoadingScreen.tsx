import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { FONTS, FONT_SIZES } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.appBackground,
        gap: 16,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ fontSize: FONT_SIZES.base, fontFamily: FONTS.sansRegular, color: colors.textMuted, lineHeight: FONT_SIZES.base * 1.5 }}>
        {message}
      </Text>
    </View>
  );
}
