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
        .from('test_history')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TestHistoryItem[];
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
