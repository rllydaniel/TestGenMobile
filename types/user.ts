import { SubscriptionTier } from '@/lib/constants';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  subscriptionTier: SubscriptionTier;
  testsToday: number;
  totalTests: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  isUnlocked: boolean;
}
