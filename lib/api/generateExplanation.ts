import { supabase } from '@/lib/supabase';

export interface GenerateExplanationParams {
  questionText: string;
  correctAnswer: string;
  userAnswer: string;
  subject: string;
  topic?: string;
}

export interface ExplanationResult {
  explanation: string;
  keyConceptLinks?: string[];
}

/**
 * Calls the generate-explanation edge function to get an AI-powered
 * explanation of why the correct answer is right and the user's answer
 * (if different) is wrong.
 */
export async function generateExplanation(
  params: GenerateExplanationParams,
): Promise<ExplanationResult> {
  const { data, error } = await supabase.functions.invoke('generate-explanation', {
    body: {
      question: params.questionText,
      correct_answer: params.correctAnswer,
      user_answer: params.userAnswer,
      subject: params.subject,
      topic: params.topic,
      max_tokens: 500,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.explanation) throw new Error('No explanation returned');

  return {
    explanation: data.explanation,
    keyConceptLinks: data.key_concept_links,
  };
}
