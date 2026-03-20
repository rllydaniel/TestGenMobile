import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '@/lib/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: theme.primary, text: '#FFFFFF' },
  secondary: { bg: '#1A2235', text: theme.primary, border: theme.primary },
  outline: { bg: 'transparent', text: theme.textSecondary, border: theme.cardBorder },
  ghost: { bg: 'transparent', text: theme.textSecondary },
  destructive: { bg: theme.danger, text: '#FFFFFF' },
};

const sizeStyles: Record<ButtonSize, { paddingH: number; paddingV: number; fontSize: number; borderRadius: number }> = {
  sm: { paddingH: 12, paddingV: 8, fontSize: 14, borderRadius: 10 },
  md: { paddingH: 20, paddingV: 12, fontSize: 16, borderRadius: 12 },
  lg: { paddingH: 28, paddingV: 16, fontSize: 17, borderRadius: 14 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        {
          backgroundColor: v.bg,
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
          borderRadius: s.borderRadius,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.5 : 1,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              {
                color: v.text,
                fontSize: s.fontSize,
                fontWeight: '600',
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
