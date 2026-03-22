import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSubscription } from '@/hooks/useSubscription';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

const plans = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '$0',
    period: '',
    color: '#6B7280',
    badge: undefined as string | undefined,
    features: [
      'Up to 20 questions per test',
      '2 flashcard decks',
      'Basic study guides',
      '5 AI Tutor messages/day',
    ],
  },
  {
    id: 'basic' as const,
    name: 'Basic',
    price: '$4.99',
    period: 'per month',
    color: '#2360E8',
    badge: undefined as string | undefined,
    features: [
      'Up to 30 questions per test',
      'Unlimited flashcard decks',
      'All study guides',
      '50 AI Tutor messages/day',
      'Test history & analytics',
    ],
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    price: '$9.99',
    period: 'per month',
    color: '#7C3AED',
    badge: 'Best Value',
    features: [
      'Unlimited questions per test',
      'Everything in Basic',
      'Test Planning + Diagnostics',
      'Unlimited AI Tutor',
      'Graph questions',
      'Priority generation',
      'Advanced analytics',
    ],
  },
];

const trustSignals = [
  { icon: 'shield-checkmark' as const, label: 'Secure payment' },
  { icon: 'refresh' as const, label: 'Cancel anytime' },
  { icon: 'lock-closed' as const, label: 'Privacy protected' },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: subscription } = useSubscription();
  const { colors } = useTheme();
  const currentTier = subscription?.tier ?? 'free';

  const handleHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SPACING.screenH,
          paddingTop: insets.top + SPACING.md,
          paddingBottom: 120,
        }}
      >
        {/* Close button */}
        <View style={{ alignItems: 'flex-start', marginBottom: SPACING.lg }}>
          <Pressable
            onPress={() => router.back()}
            onPressIn={handleHaptic}
            style={({ pressed }) => ({
              minHeight: 44,
              justifyContent: 'center',
              opacity: pressed ? 0.82 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Hero header */}
        <View style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: RADIUS.lg,
              backgroundColor: '#7C3AED18',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: SPACING.md,
            }}
          >
            <Ionicons name="star" size={30} color="#7C3AED" />
          </View>
          <Text
            style={{
              fontSize: FONT_SIZES.xxl,
              fontFamily: FONTS.displayBold,
              color: colors.textPrimary,
              textAlign: 'center',
              lineHeight: FONT_SIZES.xxl * 1.3,
              marginBottom: SPACING.sm,
            }}
            numberOfLines={2}
          >
            {'Unlock Your\nFull Potential'}
          </Text>
          <Text
            style={{
              fontSize: FONT_SIZES.base,
              fontFamily: FONTS.sansRegular,
              color: colors.textMuted,
              textAlign: 'center',
              lineHeight: FONT_SIZES.base * 1.6,
              paddingHorizontal: SPACING.md,
            }}
            numberOfLines={2}
          >
            Choose a plan that fits your study goals and unlock powerful features.
          </Text>
        </View>

        {/* Plan cards */}
        <View style={{ gap: SPACING.md }}>
          {plans.map((plan) => {
            const isCurrent = currentTier === plan.id;
            const isPremium = plan.id === 'premium';

            return (
              <View
                key={plan.id}
                style={[
                  {
                    borderRadius: RADIUS.xl,
                    padding: SPACING.lg,
                    overflow: 'hidden',
                  },
                  isPremium
                    ? {
                        backgroundColor: plan.color,
                        ...SHADOWS.lg,
                      }
                    : {
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: isCurrent ? plan.color : colors.border,
                        ...SHADOWS.md,
                      },
                ]}
              >
                {/* Badge */}
                {plan.badge && (
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      paddingHorizontal: SPACING.sm + 4,
                      paddingVertical: SPACING.xs,
                      borderRadius: RADIUS.full,
                      marginBottom: SPACING.sm,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: FONT_SIZES.xs,
                        fontFamily: FONTS.sansBold,
                        color: '#FFFFFF',
                        lineHeight: FONT_SIZES.xs * 1.4,
                      }}
                      numberOfLines={1}
                    >
                      {plan.badge}
                    </Text>
                  </View>
                )}

                {/* Plan name + price row */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: SPACING.md,
                  }}
                >
                  <Text
                    style={{
                      fontSize: FONT_SIZES.lg,
                      fontFamily: FONTS.sansBold,
                      color: isPremium ? '#FFFFFF' : plan.color,
                      lineHeight: FONT_SIZES.lg * 1.3,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {plan.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text
                      style={{
                        fontSize: FONT_SIZES.xxl,
                        fontFamily: FONTS.displayBold,
                        color: isPremium ? '#FFFFFF' : colors.textPrimary,
                        lineHeight: FONT_SIZES.xxl * 1.2,
                      }}
                      numberOfLines={1}
                    >
                      {plan.price}
                    </Text>
                    {plan.period ? (
                      <Text
                        style={{
                          fontSize: FONT_SIZES.sm,
                          fontFamily: FONTS.sansRegular,
                          color: isPremium
                            ? 'rgba(255,255,255,0.7)'
                            : colors.textMuted,
                          lineHeight: FONT_SIZES.sm * 1.5,
                          marginLeft: 4,
                        }}
                        numberOfLines={1}
                      >
                        {plan.period}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Features */}
                <View style={{ gap: SPACING.sm, marginBottom: SPACING.lg }}>
                  {plan.features.map((feature) => (
                    <View
                      key={feature}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: SPACING.sm + 2,
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: isPremium
                            ? 'rgba(255,255,255,0.2)'
                            : `${plan.color}18`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={isPremium ? '#FFFFFF' : plan.color}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: FONT_SIZES.sm + 1,
                          fontFamily: FONTS.sansRegular,
                          color: isPremium ? '#FFFFFF' : colors.textPrimary,
                          lineHeight: (FONT_SIZES.sm + 1) * 1.5,
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* CTA Button */}
                <Pressable
                  onPress={() => {
                    /* TODO: RevenueCat purchase flow */
                  }}
                  onPressIn={handleHaptic}
                  disabled={isCurrent}
                  style={({ pressed }) => ({
                    minHeight: 44,
                    borderRadius: RADIUS.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: SPACING.sm + 4,
                    opacity: isCurrent ? 0.5 : pressed ? 0.82 : 1,
                    transform: [{ scale: pressed && !isCurrent ? 0.98 : 1 }],
                    backgroundColor: isPremium ? '#FFFFFF' : plan.color,
                  })}
                >
                  <Text
                    style={{
                      fontSize: FONT_SIZES.base,
                      fontFamily: FONTS.sansBold,
                      color: isPremium ? plan.color : '#FFFFFF',
                      lineHeight: FONT_SIZES.base * 1.3,
                    }}
                    numberOfLines={1}
                  >
                    {isCurrent
                      ? 'Current Plan'
                      : plan.id === 'free'
                        ? 'Downgrade'
                        : 'Subscribe'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Trust signals */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: SPACING.lg,
            marginTop: SPACING.xl,
            paddingVertical: SPACING.md,
          }}
        >
          {trustSignals.map((signal) => (
            <View
              key={signal.icon}
              style={{ alignItems: 'center', gap: SPACING.xs + 2 }}
            >
              <Ionicons
                name={signal.icon}
                size={20}
                color={colors.textMuted}
              />
              <Text
                style={{
                  fontSize: FONT_SIZES.xs,
                  fontFamily: FONTS.sansMedium,
                  color: colors.textMuted,
                  lineHeight: FONT_SIZES.xs * 1.4,
                }}
                numberOfLines={1}
              >
                {signal.label}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
