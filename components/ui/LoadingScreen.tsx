import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { theme } from '@/lib/theme';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.bg,
        gap: 16,
      }}
    >
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={{ fontSize: 16, color: theme.textSecondary }}>
        {message}
      </Text>
    </View>
  );
}
