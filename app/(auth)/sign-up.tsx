import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (authError) throw authError;
      router.push('/(auth)/verify');
    } catch (err: any) {
      setError(err?.message ?? 'Sign up failed. Please try again.');
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
            <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text }}>Create Account</Text>
            <Text style={{ fontSize: 16, color: theme.textSecondary, marginTop: 4 }}>Start generating tests with AI</Text>
          </View>

          <View style={{ gap: 16 }}>
            <Input
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              icon={<Ionicons name="person-outline" size={20} color={theme.textMuted} />}
            />
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
            <Input
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              icon={<Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} />}
            />

            {error ? (
              <Text style={{ color: theme.danger, fontSize: 14, textAlign: 'center' }}>{error}</Text>
            ) : null}

            <Button title="Create Account" onPress={onSignUp} loading={loading} size="lg" style={{ marginTop: 8 }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>Already have an account?</Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={{ color: theme.primary, fontSize: 15, fontWeight: '600' }}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
