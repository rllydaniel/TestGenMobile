import { useQuery } from '@tanstack/react-query';
import { useSupabase } from './useSupabase';
import { useAuth } from '@/lib/auth';

export interface DashboardStats {
  testsCompleted: number;
  averageScore: number;
  currentStreak: number;
  studyTimeMinutes: number;
  weakTopics: string[];
}

export function useDashboardStats() {
  const supabase = useSupabase();
  const { user } = useAuth();
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data: tests, error } = await supabase
        .from('test_history')
        .select('score, total_questions, subject, topics, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalTests = tests?.length ?? 0;
      const avgScore =
        totalTests > 0
          ? tests!.reduce((sum, t) => sum + (t.score / t.total_questions) * 100, 0) / totalTests
          : 0;

      return {
        testsCompleted: totalTests,
        averageScore: Math.round(avgScore),
        currentStreak: 0,
        studyTimeMinutes: 0,
        weakTopics: [],
      } as DashboardStats;
    },
    enabled: !!user,
  });
}

export function useStreak() {
  const supabase = useSupabase();
  const { user } = useAuth();
  return useQuery({
    queryKey: ['streak'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data ?? { current_streak: 0, longest_streak: 0 };
    },
    enabled: !!user,
  });
}
