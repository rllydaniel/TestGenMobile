import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './useSupabase';
import { useAuth } from '@/lib/auth';
import { useProfile, useUpdateProfile } from './useProfile';
import { useEntitlement } from './useEntitlement';
import { callEdgeFunction } from '@/lib/api/edgeFunctions';

export interface StudyGuideSection {
  id: string;
  title: string;
  content: string;
  callout?: string | null;
  keyTerms?: string[];
}

export interface StudyGuide {
  id: string;
  user_id: string;
  subject: string;
  unit?: string;
  content: StudyGuideSection[];
  created_at: string;
}

export function useStudyGuide(subject: string, unit?: string) {
  const supabase = useSupabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['study-guide', subject, unit ?? ''],
    queryFn: async () => {
      let query = supabase
        .from('study_guides')
        .select('*')
        .eq('user_id', user!.id)
        .eq('subject', subject);

      if (unit) {
        query = query.eq('unit', unit);
      } else {
        query = query.is('unit', null);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as StudyGuide | null;
    },
    enabled: !!user && !!subject,
  });
}

export function useGenerateStudyGuide() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subject, unit, topics }: { subject: string; unit?: string; topics?: string[] }) => {
      const data = await callEdgeFunction<{ sections: StudyGuideSection[] }>({
        functionName: 'generate-study-guide',
        body: { subject, unit, topics },
        timeoutMs: 60000,
      });

      // Save to DB
      const { error } = await supabase
        .from('study_guides')
        .upsert({
          user_id: user!.id,
          subject,
          unit: unit ?? null,
          content: data.sections,
        }, {
          onConflict: 'user_id,subject,unit',
        });

      if (error) {
        console.warn('[StudyGuide] Failed to cache:', error.message);
      }

      return data.sections;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['study-guide', variables.subject, variables.unit ?? ''] });
    },
  });
}

export function useStudyGuideAccess(subject: string) {
  const { data: profile } = useProfile();
  const { isPremium } = useEntitlement();

  const freeSubjects: string[] = (profile as any)?.free_guide_subjects ?? [];
  const isAccessible = isPremium || freeSubjects.includes(subject) || freeSubjects.length < 2;
  const isLocked = !isAccessible;

  return { isLocked, isPremium, freeSubjects };
}

export function useTrackGuideAccess() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subject: string) => {
      // Add subject to free_guide_subjects if not already there
      const { data: profile } = await supabase
        .from('profiles')
        .select('free_guide_subjects')
        .eq('id', user!.id)
        .single();

      const current: string[] = (profile as any)?.free_guide_subjects ?? [];
      if (!current.includes(subject)) {
        const updated = [...current, subject];
        await supabase
          .from('profiles')
          .update({ free_guide_subjects: updated })
          .eq('id', user!.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
