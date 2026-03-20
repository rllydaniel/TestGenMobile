import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { theme } from '@/lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  borderColor?: string;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function Card({ children, style, borderColor }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: theme.card,
          borderRadius: 14,
          padding: 16,
          borderWidth: 1,
          borderColor: borderColor ?? theme.cardBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function CardHeader({ title, subtitle, right }: CardHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 14,
              color: theme.textSecondary,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}
