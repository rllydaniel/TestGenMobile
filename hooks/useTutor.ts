import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './useSupabase';
import { TutorSession, TutorMessage } from '@/types/tutor';

export function useTutorSessions() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ['tutor_sessions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('tutor_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as TutorSession[];
    },
  });
}

export function useTutorMessages(sessionId: string | null) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ['tutor_messages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('tutor_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as TutorMessage[];
    },
    enabled: !!sessionId,
  });
}

export function useCreateTutorSession() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ subject, topic }: { subject?: string; topic?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tutor_sessions')
        .insert({ user_id: user.id, subject, topic })
        .select()
        .single();
      if (error) throw error;
      return data as TutorSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor_sessions'] });
    },
  });
}

export function useSendTutorMessage() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      role,
      content,
    }: {
      sessionId: string;
      role: 'user' | 'assistant';
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('tutor_messages')
        .insert({ session_id: sessionId, role, content })
        .select()
        .single();
      if (error) throw error;
      return data as TutorMessage;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tutor_messages', variables.sessionId] });
    },
  });
}
