import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import {
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
  SHADOWS,
} from '@/constants/theme';

export default function RedeemKeyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    const trimmed = key.trim().toUpperCase();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a premium key');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be signed in');
      return;
    }

    setLoading(true);
    try {
      // Find the key
      const { data: keyData, error: findError } = await supabase
        .from('premium_keys')
        .select('*')
        .eq('key', trimmed)
        .is('redeemed_by', null)
        .single();

      if (findError || !keyData) {
        Alert.alert('Invalid Key', 'This key is invalid or has already been redeemed.');
        setLoading(false);
        return;
      }

      // Redeem the key
      const { error: redeemError } = await supabase
        .from('premium_keys')
        .update({
          redeemed_by: user.id,
          redeemed_at: new Date().toISOString(),
        })
        .eq('id', keyData.id);

      if (redeemError) throw redeemError;

      // Upgrade user to premium
      const { error: upgradeError } = await supabase
        .from('profiles')
        .update({ subscription_tier: 'premium', is_premium_override: true })
        .eq('id', user.id);

      if (upgradeError) throw upgradeError;

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });

      Alert.alert(
        'Premium Activated!',
        `Your premium subscription has been activated for ${keyData.duration_days} days. Enjoy unlimited access!`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to redeem key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.appBackground }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top + SPACING.md, paddingHorizontal: SPACING.screenH }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Redeem Key</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="key" size={40} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Enter Premium Key
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Enter your premium key below to unlock full access to all features.
          </Text>

          <TextInput
            value={key}
            onChangeText={setKey}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            placeholderTextColor={colors.textFaint}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={19}
          />

          <Pressable
            onPress={handleRedeem}
            disabled={loading || !key.trim()}
            style={[
              styles.redeemBtn,
              {
                backgroundColor: colors.primary,
                opacity: loading || !key.trim() ? 0.6 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.redeemBtnText}>Redeem</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    minHeight: 44,
  },
  headerTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
  },
  content: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: FONT_SIZES.sm * 1.6,
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.lg,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  redeemBtn: {
    width: '100%',
    height: 52,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    ...SHADOWS.primary,
  },
  redeemBtnText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.base,
    color: '#FFFFFF',
  },
});
