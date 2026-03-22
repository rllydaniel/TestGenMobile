import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionTitle,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        gap: SPACING.md,
      }}
    >
      <Ionicons name={icon} size={64} color={colors.textFaint} />
      <Text
        style={{
          fontSize: FONT_SIZES.lg,
          fontFamily: FONTS.displaySemiBold,
          color: colors.textPrimary,
          textAlign: 'center',
          lineHeight: FONT_SIZES.lg * 1.2,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: FONT_SIZES.base,
          fontFamily: FONTS.sansRegular,
          color: colors.textMuted,
          textAlign: 'center',
          lineHeight: FONT_SIZES.base * 1.6,
        }}
      >
        {description}
      </Text>
      {actionTitle && onAction && (
        <Button label={actionTitle} onPress={onAction} style={{ marginTop: 8 }} />
      )}
    </View>
  );
}
