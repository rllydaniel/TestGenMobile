import React from 'react';
import { Text, Pressable, ViewStyle } from 'react-native';
import { FONTS, FONT_SIZES, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptic } from '@/hooks/useHaptic';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  // Legacy compat
  title?: string;
}

const SIZE_MAP = {
  sm: { height: 36, fontSize: FONT_SIZES.sm, paddingH: 14 },
  md: { height: 44, fontSize: FONT_SIZES.base, paddingH: 18 },
  lg: { height: 54, fontSize: FONT_SIZES.md, paddingH: 24 },
};

export const Button = ({
  label,
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  icon,
  fullWidth,
  loading,
  style,
}: ButtonProps) => {
  const { colors } = useTheme();
  const { impact } = useHaptic();
  const displayLabel = label ?? title ?? '';
  const { height, fontSize, paddingH } = SIZE_MAP[size];

  const bgColor = {
    primary: disabled ? 'rgba(35,96,232,0.4)' : colors.primary,
    ghost: 'transparent',
    outline: 'transparent',
    destructive: 'transparent',
  }[variant];

  const textColor = {
    primary: colors.textOnPrimary,
    ghost: colors.textMuted,
    outline: colors.primary,
    destructive: colors.error,
  }[variant];

  const borderColor = {
    primary: 'transparent',
    ghost: 'transparent',
    outline: colors.primary,
    destructive: colors.error,
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => impact()}
      style={({ pressed }) => [
        {
          height,
          paddingHorizontal: paddingH,
          backgroundColor: bgColor,
          borderRadius: RADIUS.md,
          borderWidth: variant !== 'primary' ? 1 : 0,
          borderColor,
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          gap: 8,
          opacity: pressed ? 0.82 : disabled ? 0.5 : 1,
          width: fullWidth ? '100%' as any : undefined,
          minHeight: 44,
          ...(variant === 'primary' && !disabled ? SHADOWS.primary : {}),
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={{
          fontFamily: FONTS.sansSemiBold,
          fontSize,
          color: textColor,
          letterSpacing: 0.2,
          lineHeight: fontSize * 1.5,
        }}
      >
        {loading ? 'Loading...' : displayLabel}
      </Text>
    </Pressable>
  );
};
