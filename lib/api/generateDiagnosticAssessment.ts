import { callEdgeFunction } from './edgeFunctions';

interface TopicBreakdown {
  topic: string;
  accuracy: number;
  strength: 'weak' | 'moderate' | 'strong';
}

export const generateDiagnosticAssessment = async (params: {
  subject: string;
  score: number;
  correct: number;
  total: number;
  level: string;
  topicBreakdown: TopicBreakdown[];
  daysUntilExam: number;
  goalScore: string;
}): Promise<string> => {
  const data = await callEdgeFunction<{ assessment: string }>({
    functionName: 'generate-assessment',
    body: {
      ...params,
      prompt: `Student completed a diagnostic for ${params.subject}.
Score: ${params.score}% (${params.correct}/${params.total})
Level: ${params.level}
Topics: ${JSON.stringify(params.topicBreakdown)}
Exam in: ${params.daysUntilExam} days
Goal: ${params.goalScore || 'not specified'}

Write exactly 3 sentences in second person:
1. Overall assessment — be specific, name their level
2. Name their strongest AND weakest topics specifically
3. One concrete recommendation for the study plan

Use LaTeX for math: $expression$
Be direct, encouraging, specific. No generic phrases.`,
      maxTokens: 400,
    },
    timeoutMs: 20000,
  });

  return data.assessment;
};
