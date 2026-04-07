import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
  SHADOWS,
} from '@/constants/theme';

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data: profile } = useProfile();

  // Guard: redirect if not admin
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.back();
    }
  }, [profile, router]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, premiumRes, keysRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_tier', 'premium'),
        supabase.from('premium_keys').select('id', { count: 'exact', head: true }).is('redeemed_by', null),
      ]);
      return {
        totalUsers: usersRes.count ?? 0,
        premiumUsers: premiumRes.count ?? 0,
        availableKeys: keysRes.count ?? 0,
      };
    },
    enabled: profile?.role === 'admin',
  });

  if (profile?.role !== 'admin') {
    return (
      <View style={[styles.center, { backgroundColor: colors.appBackground }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const cards = [
    {
      icon: 'people' as const,
      label: 'Total Users',
      value: String(stats?.totalUsers ?? '—'),
      color: colors.primary,
    },
    {
      icon: 'diamond' as const,
      label: 'Premium Users',
      value: String(stats?.premiumUsers ?? '—'),
      color: colors.success,
    },
    {
      icon: 'key' as const,
      label: 'Available Keys',
      value: String(stats?.availableKeys ?? '—'),
      color: colors.warning,
    },
  ];

  const menuItems = [
    {
      icon: 'people' as const,
      title: 'Manage Users',
      desc: 'View all users, toggle premium',
      onPress: () => router.push('/(app)/admin/users'),
    },
    {
      icon: 'key' as const,
      title: 'Premium Keys',
      desc: 'Generate and manage premium keys',
      onPress: () => router.push('/(app)/admin/keys'),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.md,
          paddingHorizontal: SPACING.screenH,
          paddingBottom: insets.bottom + SPACING.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Admin Panel</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Stats */}
        {isLoading ? (
          <ActivityIndicator style={{ marginVertical: SPACING.xl }} color={colors.primary} />
        ) : (
          <View style={styles.statsRow}>
            {cards.map((c) => (
              <View
                key={c.label}
                style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Ionicons name={c.icon} size={20} color={c.color} />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{c.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{c.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Menu */}
        <View style={{ gap: SPACING.sm, marginTop: SPACING.lg }}>
          {menuItems.map((item) => (
            <Pressable
              key={item.title}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.menuCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name={item.icon} size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.menuDesc, { color: colors.textMuted }]}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    minHeight: 44,
  },
  headerTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  statValue: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.xl,
  },
  statLabel: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.xs,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.base,
  },
  menuDesc: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
});
