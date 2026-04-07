import { useEntitlement } from './useEntitlement';
import { SubscriptionTier, TIER_LIMITS } from '@/lib/constants';

export function useSubscription() {
  const { isPremium, tier, isLoading } = useEntitlement();
  return {
    data: {
      tier,
      testsToday: 0,
      testsRemaining: isPremium ? Infinity : TIER_LIMITS.free.testsPerDay,
    },
    isLoading,
  };
}

export function canGenerateTest(tier: SubscriptionTier, testsToday: number): boolean {
  return testsToday < TIER_LIMITS[tier].testsPerDay;
}
