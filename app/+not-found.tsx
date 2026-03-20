import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          backgroundColor: theme.bg,
          gap: 16,
        }}
      >
        <Ionicons name="alert-circle-outline" size={64} color={theme.textMuted} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>
          Page Not Found
        </Text>
        <Link href="/(tabs)" style={{ marginTop: 15, paddingVertical: 15 }}>
          <Text style={{ fontSize: 16, color: theme.primary, fontWeight: '600' }}>
            Go to Home
          </Text>
        </Link>
      </View>
    </>
  );
}
