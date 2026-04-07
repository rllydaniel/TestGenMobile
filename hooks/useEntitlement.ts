import { useRevenueCat } from '@/lib/revenueCat';
import { useProfile } from '@/hooks/useProfile';
import { SubscriptionTier } from '@/lib/constants';

export function useEntitlement() {
  const { isProEntitled, isLoading: rcLoading } = useRevenueCat();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const isPremium = isProEntitled || profile?.is_premium_override === true;
  const tier: SubscriptionTier = isPremium ? 'premium' : 'free';

  return { isPremium, tier, isLoading: rcLoading || profileLoading };
}
