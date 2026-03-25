import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/stores/app-store';

export function useHaptic() {
  const hapticEnabled = useAppStore(s => s.hapticEnabled);

  const impact = useCallback(
    (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
      if (hapticEnabled && Platform.OS !== 'web') {
        Haptics.impactAsync(style);
      }
    },
    [hapticEnabled],
  );

  return { impact };
}
