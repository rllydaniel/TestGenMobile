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
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SectionLabel } from '@/components/ui/Label';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

export default function SignInScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSignIn = useCallback(async () => {
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
  }, [email, password]);

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
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Welcome back.</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Sign in to continue studying.</Text>

          {/* Email */}
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

          {/* Password */}
          <View style={{ marginTop: SPACING.md }}>
            <SectionLabel>PASSWORD</SectionLabel>
            <View>
              <Input
                placeholder="Enter your password"
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

          {/* Sign In Button */}
          <View style={{ marginTop: SPACING.lg }}>
            <Button label="Sign In" onPress={onSignIn} loading={loading} size="lg" fullWidth />
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textFaint }]}>or continue with</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google */}
          <Pressable style={({ pressed }) => [styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.borderStrong, opacity: pressed ? 0.82 : 1 }]}>
            <Ionicons name="logo-google" size={20} color={colors.textPrimary} />
            <Text style={[styles.socialButtonText, { color: colors.textPrimary }]}>Continue with Google</Text>
          </Pressable>

          {/* Apple (iOS only) */}
          {Platform.OS === 'ios' && (
            <Pressable style={({ pressed }) => [styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.borderStrong, marginTop: SPACING.sm, opacity: pressed ? 0.82 : 1 }]}>
              <Ionicons name="logo-apple" size={22} color={colors.textPrimary} />
              <Text style={[styles.socialButtonText, { color: colors.textPrimary }]}>Continue with Apple</Text>
            </Pressable>
          )}

          {/* Sign Up link */}
          <View style={styles.bottomLink}>
            <Text style={[styles.bottomLinkText, { color: colors.textMuted }]}>Don't have an account?</Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={[styles.bottomLinkAction, { color: colors.primary }]}>Sign up</Text>
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.xs,
    lineHeight: FONT_SIZES.xs * 1.5,
    marginHorizontal: SPACING.md,
  },
  socialButton: {
    height: 52,
    minHeight: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...SHADOWS.sm,
  },
  socialButtonText: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
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
