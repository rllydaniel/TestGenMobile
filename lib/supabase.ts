import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// ── Startup env validation ────────────────────────────────────────────────────
if (!supabaseUrl) {
  console.error('[Config] ERROR: EXPO_PUBLIC_SUPABASE_URL is undefined!');
} else {
  console.log('[Config] Supabase URL:', supabaseUrl);
}
if (!supabaseAnonKey) {
  console.error('[Config] ERROR: EXPO_PUBLIC_SUPABASE_ANON_KEY is undefined!');
} else {
  console.log('[Config] Anon key prefix:', supabaseAnonKey.slice(0, 10) + '...');
}

const secureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Silently fail
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Silently fail
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('[Supabase] Client initialized');
