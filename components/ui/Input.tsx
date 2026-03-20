import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import { theme } from '@/lib/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: theme.textSecondary,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: error
            ? theme.danger
            : focused
              ? theme.primary
              : theme.cardBorder,
          paddingHorizontal: 14,
          gap: 10,
        }}
      >
        {icon}
        <TextInput
          placeholderTextColor={theme.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            {
              flex: 1,
              paddingVertical: 14,
              fontSize: 16,
              color: theme.text,
            },
            style,
          ]}
          {...props}
        />
      </View>
      {error && (
        <Text style={{ fontSize: 12, color: theme.danger, marginTop: 2 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
