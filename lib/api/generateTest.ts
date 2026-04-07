import { supabase } from '@/lib/supabase';
import { callEdgeFunction } from './edgeFunctions';

export type QuestionTypeOption = 'multiple-choice' | 'short-response' | 'mixed';

export interface GenerateTestParams {
  subject: string;
  questionCount: number;
  difficulty: 'easy' | 'mixed' | 'hard';
  questionTypes: string[];
  timeLimit: number | null;
  studyMode: boolean;
  focusMode?: boolean;
  topics?: string[];
  planSessionId?: string;
}

export interface TestQuestion {
  id: string;
  type: 'multiple-choice' | 'short-response';
  text: string;
  topic: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty?: string;
}

export interface GenerateTestResult {
  questions: TestQuestion[];
  sessionId: string;
}

/**
 * Resolves the UI question type option into the array of types sent to the edge function.
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

/**
 * Builds a human-readable instruction string for the edge function
 * based on the resolved question types array.
 */
function buildQuestionTypeInstruction(types: string[]): string {
  if (types.length === 1 && types[0] === 'short-response') {
    return `Generate short answer questions only. Each question requires a written response of 1-3 sentences.
Do not include multiple choice options — the "options" array should be empty [].
The "correctAnswer" field contains a model answer.`;
  }
  if (types.length > 1 || (types.length === 1 && types[0] === 'mixed')) {
    return `Generate a mixed set of questions: 80% multiple choice (including some True/False)
and 20% short answer. Vary the distribution naturally throughout the test.`;
  }
  return `Generate multiple choice questions only. Include a mix of standard MCQ and True/False questions.
Approximately 70% standard MCQ (4 options A/B/C/D) and 30% True/False.
For True/False questions, options are exactly ["True", "False"].`;
}

export const generateTest = async (
  params: GenerateTestParams,
): Promise<GenerateTestResult> => {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to generate a test.');

  // Dynamic max_tokens based on question count
  const maxTokens = Math.min(
    Math.max(params.questionCount * 380 + 600, 2000),
    8000,
  );

  const questionTypeInstruction = buildQuestionTypeInstruction(
    params.questionTypes,
  );

  const data = await callEdgeFunction<{ questions: any[] }>({
    functionName: 'generate-question',
    body: {
      subject: params.subject,
      topics: params.topics ?? [params.subject],
      count: params.questionCount,
      difficulty: params.difficulty,
      questionTypes: params.questionTypes,
      questionTypeInstruction,
      studyMode: params.studyMode,
      maxTokens,
    },
    timeoutMs: 45000,
  });

  if (!data?.questions || data.questions.length === 0) {
    throw new Error('No questions were returned. Please try again.');
  }

  const validated = validateQuestions(
    data.questions as TestQuestion[],
    params.questionCount,
  );
  if (validated.length === 0) {
    throw new Error('All generated questions were invalid. Please try again.');
  }

  // Save test session to database
  const insertRow: Record<string, unknown> = {
    user_id: user.id,
    subject: params.subject,
    topics: params.topics ?? [params.subject],
    question_count: validated.length,
    difficulty: params.difficulty,
    config: {
      questionTypes: params.questionTypes,
      timeLimit: params.timeLimit,
      studyMode: params.studyMode,
      focusMode: params.focusMode ?? false,
    },
    questions: validated,
    status: 'in_progress',
    created_at: new Date().toISOString(),
  };
  if (params.planSessionId) {
    insertRow.plan_session_id = params.planSessionId;
  }

  const { data: session, error: insertError } = await supabase
    .from('test_sessions')
    .insert(insertRow)
    .select('id')
    .single();

  if (insertError) {
    console.error('Failed to save test session:', insertError);
  }

  return {
    questions: validated,
    sessionId: session?.id ?? `local_${Date.now()}`,
  };
};

const validateQuestions = (
  questions: TestQuestion[],
  expectedCount: number,
): TestQuestion[] => {
  if (!Array.isArray(questions)) {
    throw new Error('Questions response is not an array');
  }

  const validated = questions
    .filter((q, i) => {
      // Required fields
      if (!q.text || !q.correctAnswer) {
        console.warn(`Question ${i + 1} missing required fields`);
        return false;
      }

      // For MCQ: must have at least 2 options with unique values
      if (q.type !== 'short-response') {
        if (!q.options || q.options.length < 2) {
          console.warn(`Question ${i + 1} has invalid options`);
          return false;
        }
        // Check for duplicate options
        const normalized = q.options.map((o) =>
          String(o).toLowerCase().replace(/\s+/g, '').trim(),
        );
        if (new Set(normalized).size !== normalized.length) {
          console.warn(`Question ${i + 1} has duplicate options`);
          return false;
        }
      }

      return true;
    })
    .map((q, i) => ({
      ...q,
      id: q.id || `q${i + 1}`,
    }));

  return validated.slice(0, expectedCount);
};
