import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInView } from '@/components/ui/FadeInView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SectionLabel } from '@/components/ui/Label';
import { useProfile } from '@/hooks/useProfile';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useDashboardStats } from '@/hooks/useStats';
import { useTheme } from '@/contexts/ThemeContext';
import RevenueCatUI from 'react-native-purchases-ui';
import {
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
  SHADOWS,
} from '@/constants/theme';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const { data: stats } = useDashboardStats();

  const isAdmin = (profile as any)?.role === 'admin';
  const { isPremium } = useEntitlement();

  const menuSections = [
    {
      label: 'ACTIVITY',
      items: [
        {
          icon: 'trophy' as const,
          title: 'Achievements',
          color: colors.warning,
          onPress: () => router.push('/(app)/achievements'),
        },
        {
          icon: 'time' as const,
          title: 'Test History',
          color: colors.primary,
          onPress: () => router.push('/(app)/history'),
        },
        {
          icon: 'podium' as const,
          title: 'Leaderboard',
          color: colors.levelAdvanced,
          onPress: () => router.push('/(app)/leaderboard'),
        },
      ],
    },
    {
      label: 'SUBSCRIPTION',
      items: [
        {
          icon: 'card' as const,
          title: isPremium ? 'Subscription' : 'Upgrade to Pro',
          color: colors.success,
          onPress: () => router.push('/(app)/subscription'),
        },
        ...(isPremium ? [{
          icon: 'receipt' as const,
          title: 'Manage Subscription',
          color: colors.textMuted,
          onPress: () => {
            try {
              RevenueCatUI.presentCustomerCenter();
            } catch {
              // Preview/web mode — no-op
            }
          },
        }] : []),
        {
          icon: 'key' as const,
          title: 'Redeem Key',
          color: colors.warning,
          onPress: () => router.push('/(app)/redeem'),
        },
      ],
    },
    {
      label: 'APP',
      items: [
        {
          icon: 'settings' as const,
          title: 'Settings',
          color: colors.textMuted,
          onPress: () => router.push('/(app)/settings'),
        },
      ],
    },
    ...(isAdmin ? [{
      label: 'ADMIN',
      items: [{
        icon: 'shield' as const,
        title: 'Admin Panel',
        color: colors.error,
        onPress: () => router.push('/(app)/admin'),
      }],
    }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.lg,
          paddingHorizontal: SPACING.screenH,
          paddingBottom: 80 + insets.bottom + SPACING.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <FadeInView delay={0} duration={300}>
          <View style={styles.profileHeader}>
            <Pressable onPress={() => router.push('/(app)/edit-profile')} style={{ position: 'relative' }}>
              {(profile?.avatarUrl || user?.user_metadata?.avatar_url) ? (
                <Image
                  source={{ uri: profile?.avatarUrl ?? user?.user_metadata?.avatar_url }}
                  style={[styles.avatar, { borderColor: colors.primary }]}
                />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarLetter, { color: colors.textOnPrimary }]}>
                    {(
                      profile?.username ??
                      user?.user_metadata?.username ??
                      'U'
                    )[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="pencil" size={12} color="#FFFFFF" />
              </View>
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>
                {profile?.username ??
                  user?.user_metadata?.username ??
                  'Student'}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email ?? ''}</Text>
            </View>
          </View>
        </FadeInView>

        {/* Stats Row */}
        <FadeInView delay={100} duration={300}>
          <View style={{ marginBottom: SPACING.lg }}>
            <Card shadow="md">
              <View style={styles.statsRow}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.statsValue, { color: colors.textPrimary }]}>
                    {stats?.testsCompleted ?? 0}
                  </Text>
                  <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Tests</Text>
                </View>
                <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.statsValue, { color: colors.textPrimary }]}>
                    {stats?.averageScore ?? 0}%
                  </Text>
                  <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Avg Score</Text>
                </View>
                <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.statsValue, { color: colors.primary }]}>
                    {profile?.subscriptionTier === 'premium'
                      ? 'PRO'
                      : profile?.subscriptionTier === 'basic'
                        ? 'Basic'
                        : 'Free'}
                  </Text>
                  <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Plan</Text>
                </View>
              </View>
            </Card>
          </View>
        </FadeInView>

        {/* Menu Items */}
        <FadeInView delay={200} duration={300}>
          {menuSections.map((section) => (
            <View key={section.label} style={{ marginBottom: SPACING.lg }}>
              <SectionLabel>{section.label}</SectionLabel>
              <View style={{ gap: SPACING.sm }}>
                {section.items.map((item) => (
                  <Pressable
                    key={item.title}
                    onPress={item.onPress}
                    style={({ pressed }) => [
                      styles.menuItem,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.menuIconCircle,
                        { backgroundColor: item.color + '20' },
                      ]}
                    >
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>
                    <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textMuted}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {/* Sign Out */}
          <Button
            label="Sign Out"
            onPress={() => signOut()}
            variant="outline"
            size="lg"
            fullWidth
            icon={
              <Ionicons
                name="log-out-outline"
                size={20}
                color={colors.primary}
              />
            }
          />
        </FadeInView>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  /* profile header */
  profileHeader: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: FONT_SIZES.display,
    fontFamily: FONTS.sansBold,
    lineHeight: FONT_SIZES.display * 1.2,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: FONT_SIZES.lg + 2,
    fontFamily: FONTS.displaySemiBold,
    lineHeight: (FONT_SIZES.lg + 2) * 1.2,
  },
  userEmail: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
  },

  /* stats row */
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsValue: {
    fontSize: FONT_SIZES.lg + 2,
    fontFamily: FONTS.sansBold,
    lineHeight: (FONT_SIZES.lg + 2) * 1.2,
  },
  statsLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  statsDivider: {
    width: 1,
  },

  /* menu items */
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    minHeight: 44,
    ...SHADOWS.sm,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansMedium,
    lineHeight: FONT_SIZES.base * 1.5,
  },
});
