import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
    } catch (err: any) {
      setError(err?.message ?? 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 20, backgroundColor: theme.primary,
              alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <Ionicons name="school" size={36} color="#FFFFFF" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text }}>TestGen</Text>
            <Text style={{ fontSize: 16, color: theme.textSecondary, marginTop: 4 }}>Sign in to continue</Text>
          </View>

          <View style={{ gap: 16 }}>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              icon={<Ionicons name="mail-outline" size={20} color={theme.textMuted} />}
            />
            <View>
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                icon={<Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} />}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: 38 }}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {error ? (
              <Text style={{ color: theme.danger, fontSize: 14, textAlign: 'center' }}>{error}</Text>
            ) : null}

            <Button title="Sign In" onPress={onSignIn} loading={loading} size="lg" style={{ marginTop: 8 }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>Don't have an account?</Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text style={{ color: theme.primary, fontSize: 15, fontWeight: '600' }}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
