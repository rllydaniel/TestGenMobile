import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from './useSupabase';
import { generateQuestions, gradeShortResponse, saveTestHistory, summarizeTest } from '@/services/api';
import { TestConfig, TestResult, TestHistoryItem } from '@/types/test';

export function useTestHistory() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ['tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_sessions')
        .select('id, subject, difficulty, score, question_count, study_mode, created_at, completed_at, config, questions')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
      if (error) throw error;
      // Map test_sessions shape to TestHistoryItem
      return (data ?? []).map((row: any) => ({
        id: row.id,
        subject: row.subject,
        topics: (row.config?.topics as string[]) ?? [],
        score: row.score ?? 0,
        totalQuestions: row.question_count,
        questionType: (row.config?.questionTypes as string[])?.[0] ?? 'multiple-choice',
        difficulty: row.difficulty,
        completedAt: row.completed_at ?? row.created_at,
      })) as TestHistoryItem[];
    },
  });
}

export function useGenerateTest() {
  const supabase = useSupabase();
  return useMutation({
    mutationFn: (config: TestConfig) => generateQuestions(supabase, config),
  });
}

export function useSaveTest() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (result: TestResult) => saveTestHistory(supabase, result),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useTestSummary() {
  const supabase = useSupabase();
  return useMutation({
    mutationFn: (result: TestResult) => summarizeTest(supabase, result),
  });
}

export function useGradeShortResponse() {
  const supabase = useSupabase();
  return useMutation({
    mutationFn: ({
      question,
      correctAnswer,
      userAnswer,
    }: {
      question: string;
      correctAnswer: string;
      userAnswer: string;
    }) => gradeShortResponse(supabase, question, correctAnswer, userAnswer),
  });
}
