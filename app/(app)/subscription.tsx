import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Purchases, {
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useRevenueCat } from '@/lib/revenueCat';
import { ENTITLEMENT_ID } from '@/lib/revenueCat';
import { useTheme } from '@/contexts/ThemeContext';
import {
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
  SHADOWS,
} from '@/constants/theme';

/* ------------------------------------------------------------------ */
/*  Feature list                                                       */
/* ------------------------------------------------------------------ */

const PRO_FEATURES = [
  { icon: 'infinite-outline' as const, text: 'Unlimited test generation' },
  { icon: 'layers-outline' as const, text: 'Up to 50 questions per test' },
  { icon: 'flash-outline' as const, text: 'AI-powered flashcard generation' },
  { icon: 'analytics-outline' as const, text: 'Detailed performance analytics' },
  { icon: 'sparkles-outline' as const, text: 'Priority AI grading' },
  { icon: 'shield-checkmark-outline' as const, text: 'Early access to new features' },
];

/* ------------------------------------------------------------------ */
/*  Plan Card                                                          */
/* ------------------------------------------------------------------ */

function PlanCard({
  pkg,
  isSelected,
  onSelect,
  colors,
  isBestValue,
}: {
  pkg: PurchasesPackage;
  isSelected: boolean;
  onSelect: () => void;
  colors: any;
  isBestValue: boolean;
}) {
  const product = pkg.product;
  const isYearly = pkg.packageType === 'ANNUAL';
  const title = isYearly ? 'Yearly' : 'Monthly';

  // Calculate monthly equivalent for yearly
  let subtitle = product.priceString + '/mo';
  if (isYearly && product.price > 0) {
    const monthlyEquiv = (product.price / 12).toFixed(2);
    const currencyCode = product.currencyCode ?? '';
    subtitle = `${currencyCode} ${monthlyEquiv}/mo`;
  }

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.planCard,
        {
          backgroundColor: isSelected ? colors.primaryLight : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {isBestValue && (
        <View style={[styles.bestBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.bestBadgeText}>BEST VALUE</Text>
        </View>
      )}

      {/* Radio */}
      <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border }]}>
        {isSelected && <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />}
      </View>

      {/* Plan details */}
      <View style={{ flex: 1 }}>
        <Text style={[styles.planTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.planPrice, { color: colors.textMuted }]}>
          {product.priceString}{isYearly ? '/year' : '/month'}
        </Text>
      </View>

      {/* Monthly equivalent for yearly */}
      {isYearly && product.price > 0 && (
        <View style={[styles.saveBadge, { backgroundColor: colors.success + '20' }]}>
          <Text style={[styles.saveText, { color: colors.success }]}>Save ~40%</Text>
        </View>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Screen                                                        */
/* ------------------------------------------------------------------ */

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isPremium, isLoading: entitlementLoading } = useEntitlement();
  const { offerings, restorePurchases } = useRevenueCat();
  const presentedRef = useRef(false);

  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // If already premium, show Customer Center
  useEffect(() => {
    if (!entitlementLoading && isPremium && !presentedRef.current) {
      presentedRef.current = true;
      try {
        const result = RevenueCatUI.presentCustomerCenter();
        if (result && typeof result.finally === 'function') {
          result.finally(() => router.back());
        } else {
          router.back();
        }
      } catch {
        router.back();
      }
    }
  }, [isPremium, entitlementLoading]);

  // Get available packages
  const currentOffering = offerings?.current;
  const packages = currentOffering?.availablePackages ?? [];

  // Auto-select yearly (best value) or first package
  useEffect(() => {
    if (packages.length > 0 && !selectedPkg) {
      const yearly = packages.find((p) => p.packageType === 'ANNUAL');
      setSelectedPkg(yearly ?? packages[0]);
    }
  }, [packages]);

  // Purchase handler
  const handlePurchase = useCallback(async () => {
    if (!selectedPkg) return;
    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPkg);
      if (customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined) {
        Alert.alert('Welcome to Pro!', 'You now have full access to all features.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Purchase Failed', e?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  }, [selectedPkg]);

  // Restore handler
  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const info = await restorePurchases();
      if (info?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined) {
        Alert.alert('Restored!', 'Your subscription has been restored.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('No Subscription Found', 'We couldn\'t find an active subscription for this account.');
      }
    } catch {
      Alert.alert('Restore Failed', 'Something went wrong. Please try again.');
    } finally {
      setRestoring(false);
    }
  }, [restorePurchases]);

  // Loading state
  if (entitlementLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.appBackground }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If premium, the useEffect above handles showing Customer Center
  if (isPremium) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.appBackground }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.md,
          paddingHorizontal: SPACING.screenH,
          paddingBottom: 200 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Close button */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
        >
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </Pressable>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="diamond" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            Upgrade to Pro
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
            Unlock unlimited tests, AI flashcards, and advanced analytics
          </Text>
        </View>

        {/* Feature list */}
        <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {PRO_FEATURES.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureIconBg, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={feature.icon} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                {feature.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Plan selection */}
        <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>CHOOSE YOUR PLAN</Text>

        {packages.length > 0 ? (
          <View style={{ gap: SPACING.sm }}>
            {packages.map((pkg) => {
              const isYearly = pkg.packageType === 'ANNUAL';
              return (
                <PlanCard
                  key={pkg.identifier}
                  pkg={pkg}
                  isSelected={selectedPkg?.identifier === pkg.identifier}
                  onSelect={() => setSelectedPkg(pkg)}
                  colors={colors}
                  isBestValue={isYearly}
                />
              );
            })}
          </View>
        ) : (
          <View style={[styles.noPackages, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={24} color={colors.textMuted} />
            <Text style={[styles.noPackagesText, { color: colors.textMuted }]}>
              Products are loading or unavailable. Please try again later.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.appBackground,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + SPACING.sm,
          },
        ]}
      >
        <Pressable
          onPress={handlePurchase}
          disabled={purchasing || !selectedPkg}
          style={({ pressed }) => [
            styles.purchaseButton,
            {
              backgroundColor: !selectedPkg ? colors.surfaceSecondary : colors.primary,
              opacity: purchasing ? 0.7 : pressed ? 0.88 : 1,
              transform: [{ scale: pressed && !purchasing ? 0.98 : 1 }],
            },
            selectedPkg ? SHADOWS.primary : undefined,
          ]}
        >
          {purchasing ? (
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color={selectedPkg ? colors.textOnPrimary : colors.textFaint} />
              <Text style={[styles.purchaseText, { color: selectedPkg ? colors.textOnPrimary : colors.textFaint }]}>
                {selectedPkg
                  ? `Subscribe — ${selectedPkg.product.priceString}/${selectedPkg.packageType === 'ANNUAL' ? 'year' : 'month'}`
                  : 'Select a plan'}
              </Text>
            </>
          )}
        </Pressable>

        {/* Restore + Terms */}
        <View style={styles.bottomLinks}>
          <Pressable onPress={handleRestore} disabled={restoring} style={styles.linkButton}>
            <Text style={[styles.linkText, { color: colors.textMuted }]}>
              {restoring ? 'Restoring...' : 'Restore Purchases'}
            </Text>
          </Pressable>
          <Text style={[styles.linkDot, { color: colors.textFaint }]}>{'\u00B7'}</Text>
          <Pressable style={styles.linkButton}>
            <Text style={[styles.linkText, { color: colors.textMuted }]}>Terms</Text>
          </Pressable>
          <Text style={[styles.linkDot, { color: colors.textFaint }]}>{'\u00B7'}</Text>
          <Pressable style={styles.linkButton}>
            <Text style={[styles.linkText, { color: colors.textMuted }]}>Privacy</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },

  /* Hero */
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xxl + 2,
    textAlign: 'center',
    lineHeight: (FONT_SIZES.xxl + 2) * 1.2,
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    lineHeight: FONT_SIZES.base * 1.6,
    paddingHorizontal: SPACING.lg,
  },

  /* Feature list */
  featureCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIconBg: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.base,
    flex: 1,
    lineHeight: FONT_SIZES.base * 1.5,
  },

  /* Section label */
  sectionLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },

  /* Plan cards */
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    minHeight: 72,
    ...SHADOWS.sm,
  },
  bestBadge: {
    position: 'absolute',
    top: -10,
    right: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  bestBadgeText: {
    fontFamily: FONTS.sansBold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  planTitle: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md * 1.3,
  },
  planPrice: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.5,
    marginTop: 2,
  },
  saveBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  saveText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.xs,
  },

  /* No packages */
  noPackages: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  noPackagesText: {
    flex: 1,
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.5,
  },

  /* Bottom bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: SPACING.screenH,
    paddingTop: SPACING.md,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  purchaseText: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.md,
    includeFontPadding: false,
  },
  bottomLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  linkButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  linkText: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.xs,
    textDecorationLine: 'underline',
  },
  linkDot: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.xs,
  },
});
