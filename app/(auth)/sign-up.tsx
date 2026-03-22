import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SectionLabel } from '@/components/ui/Label';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSignUp = useCallback(async () => {
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
  }, [email, password, username]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingTop: insets.top + SPACING.xxl,
            paddingBottom: insets.bottom + SPACING.xxl,
            paddingHorizontal: SPACING.screenH,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: SPACING.xxl }}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="school" size={24} color={colors.textOnPrimary} />
            </View>
          </View>

          {/* Heading */}
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Start generating tests with AI</Text>

          {/* Username */}
          <SectionLabel>USERNAME</SectionLabel>
          <Input
            placeholder="Choose a username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            icon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
          />

          {/* Email */}
          <View style={{ marginTop: SPACING.md }}>
            <SectionLabel>EMAIL</SectionLabel>
            <Input
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              icon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
            />
          </View>

          {/* Password */}
          <View style={{ marginTop: SPACING.md }}>
            <SectionLabel>PASSWORD</SectionLabel>
            <View>
              <Input
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                icon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: 12, minHeight: 44, justifyContent: 'center' }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          {/* Error */}
          {error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          ) : null}

          {/* Create Account Button */}
          <View style={{ marginTop: SPACING.lg }}>
            <Button label="Create Account" onPress={onSignUp} loading={loading} size="lg" fullWidth />
          </View>

          {/* Sign In link */}
          <View style={styles.bottomLink}>
            <Text style={[styles.bottomLinkText, { color: colors.textMuted }]}>Already have an account?</Text>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={[styles.bottomLinkAction, { color: colors.primary }]}>Sign In</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.display,
    lineHeight: FONT_SIZES.display * 1.15,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.6,
    marginBottom: SPACING.xl,
  },
  errorText: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.5,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  bottomLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    gap: 4,
  },
  bottomLinkText: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  bottomLinkAction: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
  },
});
