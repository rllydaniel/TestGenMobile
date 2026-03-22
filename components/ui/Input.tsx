import React, { useState, useCallback } from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import { FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.memo(function Input({ label, error, icon, style, ...props }: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setFocused(false), []);

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text
          style={{
            fontSize: FONT_SIZES.xs,
            fontFamily: FONTS.sansBold,
            color: colors.textPrimary,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            lineHeight: FONT_SIZES.xs * 1.5,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: RADIUS.md,
          height: 52,
          borderWidth: 1,
          borderColor: error
            ? colors.error
            : focused
              ? colors.borderFocus
              : colors.border,
          paddingHorizontal: SPACING.md,
          gap: 10,
        }}
      >
        {icon}
        <TextInput
          placeholderTextColor={colors.textFaint}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            {
              flex: 1,
              fontSize: FONT_SIZES.base,
              fontFamily: FONTS.sansRegular,
              color: colors.textPrimary,
              paddingVertical: 0,
              lineHeight: FONT_SIZES.base * 1.5,
            },
            style,
          ]}
          {...props}
        />
      </View>
      {error && (
        <Text style={{ fontSize: FONT_SIZES.xs, fontFamily: FONTS.sansRegular, color: colors.error, marginTop: 2 }}>
          {error}
        </Text>
      )}
    </View>
  );
});
