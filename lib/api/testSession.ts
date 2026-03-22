import { supabase } from '@/lib/supabase';

export const saveTestProgress = async (
  sessionId: string,
  answers: Record<number, string>,
  currentQuestion: number,
  timeRemaining: number | null,
) => {
  if (sessionId.startsWith('local_')) return;

  const { error } = await supabase
    .from('test_sessions')
    .update({
      answers,
      current_question: currentQuestion,
      time_remaining: timeRemaining,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.warn('Failed to save test progress:', error.message);
  }
};

export const completeTestSession = async (
  sessionId: string,
  answers: Record<number, string>,
  score: number,
  accuracy: number,
  timeTaken: number,
) => {
  if (sessionId.startsWith('local_')) return;

  const { error } = await supabase
    .from('test_sessions')
    .update({
      answers,
      score,
      accuracy,
      time_taken: timeTaken,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.warn('Failed to complete test session:', error.message);
  }
};

export const loadTestSession = async (sessionId: string) => {
  if (sessionId.startsWith('local_')) return null;

  const { data, error } = await supabase
    .from('test_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.warn('Failed to load test session:', error.message);
    return null;
  }

  return data;
};
