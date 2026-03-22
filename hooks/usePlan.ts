import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './useSupabase';
import { StudyPlan, PlanSession, PlanSetupConfig } from '@/types/plan';

export function useStudyPlan() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ['study_plan'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as StudyPlan | null;
    },
  });
}

export function usePlanSessions(planId: string | null) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ['plan_sessions', planId],
    queryFn: async () => {
      if (!planId) return [];
      const { data, error } = await supabase
        .from('plan_sessions')
        .select('*')
        .eq('plan_id', planId)
        .order('week_number', { ascending: true })
        .order('day_number', { ascending: true });
      if (error) throw error;
      return data as PlanSession[];
    },
    enabled: !!planId,
  });
}

export function useCreatePlan() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: PlanSetupConfig & { planData: object; level?: string; diagnosticScore?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('study_plans')
        .insert({
          user_id: user.id,
          subject: config.subject,
          target_exam: config.targetExam,
          target_date: config.targetDate,
          diagnostic_score: config.diagnosticScore ?? null,
          level: config.level ?? null,
          status: 'active',
          plan_data: config.planData,
        })
        .select()
        .single();
      if (error) throw error;
      return data as StudyPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study_plan'] });
    },
  });
}

export function useCompleteSession() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('plan_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['study_plan'] });
    },
  });
}
