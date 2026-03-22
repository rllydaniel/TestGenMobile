import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const AUTH_ATTEMPTS_KEY = 'auth_attempts';
const AUTH_LOCKOUT_KEY = 'auth_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const checkAuthRateLimit = async (): Promise<{ allowed: boolean; remainingMs?: number }> => {
  const lockoutUntil = await SecureStore.getItemAsync(AUTH_LOCKOUT_KEY);
  if (lockoutUntil) {
    const lockoutTime = parseInt(lockoutUntil);
    if (Date.now() < lockoutTime) {
      return { allowed: false, remainingMs: lockoutTime - Date.now() };
    }
    await SecureStore.deleteItemAsync(AUTH_LOCKOUT_KEY);
    await SecureStore.deleteItemAsync(AUTH_ATTEMPTS_KEY);
  }
  return { allowed: true };
};

export const recordFailedAttempt = async (): Promise<void> => {
  const attemptsStr = await SecureStore.getItemAsync(AUTH_ATTEMPTS_KEY);
  const attempts = attemptsStr ? parseInt(attemptsStr) : 0;
  const newAttempts = attempts + 1;

  await SecureStore.setItemAsync(AUTH_ATTEMPTS_KEY, String(newAttempts));

  if (newAttempts >= MAX_ATTEMPTS) {
    const lockoutUntil = Date.now() + LOCKOUT_DURATION;
    await SecureStore.setItemAsync(AUTH_LOCKOUT_KEY, String(lockoutUntil));
  }
};

export const clearAuthAttempts = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(AUTH_ATTEMPTS_KEY);
  await SecureStore.deleteItemAsync(AUTH_LOCKOUT_KEY);
};

export const authenticateWithBiometrics = async (): Promise<boolean> => {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return true;

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) return true;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Verify your identity',
    fallbackLabel: 'Use passcode',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });

  return result.success;
};

export const storeSession = async (session: any): Promise<void> => {
  await SecureStore.setItemAsync(
    'supabase_session',
    JSON.stringify(session),
    { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
  );
};

export const clearSession = async (): Promise<void> => {
  await SecureStore.deleteItemAsync('supabase_session');
};
