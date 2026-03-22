import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Test flow */}
      <Stack.Screen name="test/wizard" />
      <Stack.Screen name="test/generating" />
      <Stack.Screen name="test/[id]" options={{ gestureEnabled: false }} />
      <Stack.Screen name="test/results/[id]" />

      {/* Flashcards */}
      <Stack.Screen name="flashcards/index" />
      <Stack.Screen name="flashcards/[id]" />
      <Stack.Screen name="flashcards/edit" />

      {/* Plan flow */}
      <Stack.Screen name="plan/setup" />
      <Stack.Screen name="plan/diagnostic" />
      <Stack.Screen name="plan/results" />
      <Stack.Screen name="plan/view" />

      {/* AI Tutor */}
      <Stack.Screen name="tutor/index" />
      <Stack.Screen name="tutor/chat" />

      {/* History (moved from tabs) */}
      <Stack.Screen name="history" />

      {/* Other screens */}
      <Stack.Screen name="upload" options={{ presentation: 'modal' }} />
      <Stack.Screen name="study-guides" />
      <Stack.Screen name="subscription" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="guide-detail" />
      <Stack.Screen name="create" />
    </Stack>
  );
}
