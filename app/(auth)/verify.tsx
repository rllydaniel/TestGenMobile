import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, SPACING } from '@/constants/theme';

export default function VerifyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: SPACING.screenH,
          paddingTop: insets.top + SPACING.xxl,
          paddingBottom: insets.bottom + SPACING.xxl,
        }}
      >
        {/* Mail icon */}
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="mail-open-outline" size={36} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Check your email</Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textMuted }]}>
          We sent a confirmation link to your email. Click the link to verify your account, then return here.
        </Text>

        {/* Verify button */}
        <View style={{ width: '100%', marginTop: SPACING.xl }}>
          <Button
            label="I've Verified My Email"
            onPress={async () => {
              const { data } = await supabase.auth.getSession();
              if (data.session) {
                router.replace('/(tabs)');
              } else {
                setError('Email not yet verified. Check your inbox and click the link.');
              }
            }}
            size="lg"
            fullWidth
          />
        </View>

        {/* Resend button */}
        <View style={{ width: '100%', marginTop: SPACING.md }}>
          <Button
            label="Resend Email"
            onPress={() => {
              setError('');
              router.replace('/(auth)/sign-up');
            }}
            variant="outline"
            size="lg"
            fullWidth
          />
        </View>

        {/* Error */}
        {error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  heading: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    lineHeight: FONT_SIZES.xl * 1.3,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  description: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.6,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.5,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
