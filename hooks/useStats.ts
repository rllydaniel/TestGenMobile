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
      const { data: sessions, error } = await supabase
        .from('test_sessions')
        .select('score, question_count, subject, config, time_spent, completed_at')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const totalTests = sessions?.length ?? 0;
      const avgScore =
        totalTests > 0
          ? Math.round(
              sessions!.reduce((sum, t) => sum + (t.score ?? 0), 0) / totalTests,
            )
          : 0;

      const totalStudySeconds = sessions?.reduce((sum, t) => sum + (t.time_spent ?? 0), 0) ?? 0;

      return {
        testsCompleted: totalTests,
        averageScore: avgScore,
        currentStreak: 0,
        studyTimeMinutes: Math.round(totalStudySeconds / 60),
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
      // Derive streak from completed test_sessions
      const { data, error } = await supabase
        .from('test_sessions')
        .select('completed_at')
        .eq('user_id', user!.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) return { current_streak: 0, longest_streak: 0 };

      // Calculate streak: consecutive days with at least one completed test
      const daySet = new Set(
        data.map((r) => {
          const d = new Date(r.completed_at);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        }),
      );

      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (daySet.has(key)) streak++;
        else break;
      }

      return { current_streak: streak, longest_streak: streak };
    },
    enabled: !!user,
  });
}
