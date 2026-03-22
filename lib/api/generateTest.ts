import { supabase } from '@/lib/supabase';

export type QuestionTypeOption = 'multiple-choice' | 'short-response' | 'mixed';

export interface GenerateTestParams {
  subject: string;
  questionCount: number;
  difficulty: 'easy' | 'mixed' | 'hard';
  questionTypes: string[];
  timeLimit: number | null;
  studyMode: boolean;
  topics?: string[];
}

/**
 * Resolves the UI question type option into the array of types sent to the edge function.
 * - 'multiple-choice' → ['multiple-choice']
 * - 'short-response' → ['short-response']
 * - 'mixed' → ['multiple-choice', 'short-response']
 */
export function resolveQuestionTypes(option: QuestionTypeOption): string[] {
  switch (option) {
    case 'multiple-choice':
      return ['multiple-choice'];
    case 'short-response':
      return ['short-response'];
    case 'mixed':
      return ['multiple-choice', 'short-response'];
    default:
      return ['multiple-choice'];
  }
}

export const generateTest = async (params: GenerateTestParams) => {
  const { data, error } = await supabase.functions.invoke('generate-question', {
    body: {
      subject: params.subject,
      topics: params.topics ?? [params.subject],
      count: params.questionCount,
      difficulty: params.difficulty,
      questionTypes: params.questionTypes,
      timeLimit: params.timeLimit,
      studyMode: params.studyMode,
      maxTokens: Math.min(Math.max(params.questionCount * 350 + 500, 2000), 8000),
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.questions) throw new Error('No questions returned');

  const validated = validateQuestions(data.questions, params.questionCount);

  // Save test session to database
  const { data: session } = await supabase
    .from('test_sessions')
    .insert({
      subject: params.subject,
      question_count: validated.length,
      difficulty: params.difficulty,
      config: params,
      questions: validated,
      status: 'in_progress',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  return {
    questions: validated,
    sessionId: session?.id,
  };
};

const validateQuestions = (questions: any[], expectedCount: number) => {
  const validated = questions.map((q: any) => {
    if (!q.options) return q;
    const normalized = q.options.map((o: string) =>
      o.toLowerCase().replace(/\s+/g, '').trim()
    );
    const unique = new Set(normalized);
    if (unique.size !== q.options.length) {
      return { ...q, needsRegeneration: true };
    }
    return q;
  }).filter((q: any) => !q.needsRegeneration);

  return validated.slice(0, expectedCount);
};
