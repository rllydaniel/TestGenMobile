import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSubscription } from '@/hooks/useSubscription';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    features: [
      '5 tests per day',
      'All subjects',
      'AI explanations',
      'Test sharing',
    ],
    color: '#6C757D',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$3.99',
    period: '/month',
    features: [
      '10 tests per day',
      'All Free features',
      'Test history',
      'Basic analytics',
    ],
    color: '#00CEC9',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$9.99',
    period: '/month',
    popular: true,
    features: [
      'Unlimited tests',
      'All Basic features',
      'AI summaries',
      'Flashcard generation',
      'Priority support',
      'Advanced analytics',
    ],
    color: '#6C5CE7',
  },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { data: subscription } = useSubscription();

  const currentTier = subscription?.tier ?? 'free';

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? '#1A1A2E' : '#F8F9FA' }}
    >
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="close"
              size={28}
              color={isDark ? '#FFFFFF' : '#1A1A2E'}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: isDark ? '#FFFFFF' : '#1A1A2E',
            }}
          >
            Upgrade Your Plan
          </Text>
        </View>

        <Text
          style={{
            fontSize: 15,
            color: isDark ? '#ADB5BD' : '#6C757D',
            lineHeight: 22,
          }}
        >
          Get more tests, AI-powered features, and unlock your full study
          potential.
        </Text>

        {/* Plan Cards */}
        {plans.map((plan) => {
          const isCurrent = currentTier === plan.id;
          return (
            <Card
              key={plan.id}
              style={{
                borderWidth: plan.popular ? 2 : 0,
                borderColor: plan.popular ? '#6C5CE7' : 'transparent',
              }}
            >
              {plan.popular && (
                <View
                  style={{
                    position: 'absolute',
                    top: -12,
                    alignSelf: 'center',
                    backgroundColor: '#6C5CE7',
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    MOST POPULAR
                  </Text>
                </View>
              )}

              <View style={{ gap: 12 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '800',
                      color: plan.color,
                    }}
                  >
                    {plan.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text
                      style={{
                        fontSize: 28,
                        fontWeight: '800',
                        color: isDark ? '#FFFFFF' : '#1A1A2E',
                      }}
                    >
                      {plan.price}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: isDark ? '#ADB5BD' : '#6C757D',
                      }}
                    >
                      {plan.period}
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 8 }}>
                  {plan.features.map((feature) => (
                    <View
                      key={feature}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={plan.color}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color: isDark ? '#E0E0E0' : '#374151',
                        }}
                      >
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                <Button
                  title={
                    isCurrent
                      ? 'Current Plan'
                      : plan.id === 'free'
                        ? 'Downgrade'
                        : 'Subscribe'
                  }
                  onPress={() => {
                    // TODO: RevenueCat purchase flow
                  }}
                  variant={isCurrent ? 'ghost' : plan.popular ? 'primary' : 'outline'}
                  disabled={isCurrent}
                  size="lg"
                />
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
