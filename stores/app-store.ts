import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AppState {
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  hapticEnabled: boolean;
  onboardingComplete: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  hydrate: () => Promise<void>;
}

async function save(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Silently fail
  }
}

async function load(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'system',
  soundEnabled: true,
  hapticEnabled: true,
  onboardingComplete: false,

  setTheme: (theme) => {
    save('app_theme', theme);
    set({ theme });
  },

  setSoundEnabled: (enabled) => {
    save('app_sound', String(enabled));
    set({ soundEnabled: enabled });
  },

  setHapticEnabled: (enabled) => {
    save('app_haptic', String(enabled));
    set({ hapticEnabled: enabled });
  },

  setOnboardingComplete: (complete) => {
    save('app_onboarding', String(complete));
    set({ onboardingComplete: complete });
  },

  hydrate: async () => {
    const [theme, sound, haptic, onboarding] = await Promise.all([
      load('app_theme'),
      load('app_sound'),
      load('app_haptic'),
      load('app_onboarding'),
    ]);

    set({
      theme: (theme as 'light' | 'dark' | 'system') ?? 'system',
      soundEnabled: sound !== 'false',
      hapticEnabled: haptic !== 'false',
      onboardingComplete: onboarding === 'true',
    });
  },
}));
