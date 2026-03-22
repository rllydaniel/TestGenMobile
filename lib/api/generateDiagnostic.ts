import { callEdgeFunction } from './edgeFunctions';
import { supabase } from '@/lib/supabase';
import type { TestQuestion } from './generateTest';

const validateAndCleanQuestions = (
  questions: any[],
  expectedCount: number,
): TestQuestion[] => {
  if (!Array.isArray(questions)) {
    throw new Error('Questions response is not an array');
  }

  const valid = questions
    .filter((q, i) => {
      if (!q.text && !q.question) {
        console.warn(`Diagnostic Q${i + 1} missing text`);
        return false;
      }
      if (!q.correctAnswer && !q.correct) {
        console.warn(`Diagnostic Q${i + 1} missing correct answer`);
        return false;
      }
      return true;
    })
    .map((q, i) => ({
      id: q.id || `dq${i + 1}`,
      type: q.type === 'short' ? 'short-response' as const : 'multiple-choice' as const,
      text: q.text || q.question,
      topic: q.topic || 'General',
      options: q.options,
      correctAnswer: q.correctAnswer || q.correct,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
    }));

  return valid.slice(0, expectedCount);
};

export const generateDiagnostic = async (
  subject: string,
  planId: string,
): Promise<{ questions: TestQuestion[]; diagnosticId: string }> => {
  const data = await callEdgeFunction<{ questions: any[] }>({
    functionName: 'generate-question',
    body: {
      subject,
      topics: [],
      count: 15,
      difficulty: 'mixed',
      questionTypes: ['multiple-choice'],
      studyMode: false,
      maxTokens: 6000,
      diagnosticInstruction: `Generate exactly 15 diagnostic questions for ${subject}.
REQUIREMENTS:
- Cover ALL major topic areas — one question per topic minimum
- Difficulty distribution: questions 1-5 easy, 6-10 medium, 11-15 hard
- Every question must have a different "topic" value
- No two questions test the same concept
- Each question includes: id, text, options, correctAnswer, explanation, topic, difficulty
- The "correctAnswer" field MUST match one of the options exactly
- Verify each answer before including it
Return EXACTLY 15 questions as a JSON array.`,
    },
    timeoutMs: 60000,
  });

  const validated = validateAndCleanQuestions(data.questions, 15);

  // Save diagnostic record
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: diagnostic } = await supabase
    .from('diagnostic_results')
    .insert({
      plan_id: planId,
      user_id: user?.id,
      questions: validated,
      answers: {},
      score: 0,
      topic_breakdown: {},
      status: 'in_progress',
    })
    .select('id')
    .single();

  return {
    questions: validated,
    diagnosticId: diagnostic?.id ?? `diag_${Date.now()}`,
  };
};
