import { useQuery } from '@tanstack/react-query';
import { useSupabase } from './useSupabase';
import { checkSubscription, checkUsage } from '@/services/api';
import { SubscriptionTier, TIER_LIMITS } from '@/lib/constants';

export function useSubscription() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ['subscription'],
    queryFn: () => checkSubscription(supabase),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useUsage() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ['usage'],
    queryFn: () => checkUsage(supabase),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function canGenerateTest(tier: SubscriptionTier, testsToday: number): boolean {
  return testsToday < TIER_LIMITS[tier].testsPerDay;
}
