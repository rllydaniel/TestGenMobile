import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="test/wizard" />
      <Stack.Screen name="test/[id]" options={{ gestureEnabled: false }} />
      <Stack.Screen name="test/results/[id]" />
      <Stack.Screen name="flashcards/index" />
      <Stack.Screen name="flashcards/[id]" />
      <Stack.Screen name="upload" options={{ presentation: 'modal' }} />
      <Stack.Screen name="study-guides" />
      <Stack.Screen name="subscription" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="leaderboard" />
    </Stack>
  );
}
