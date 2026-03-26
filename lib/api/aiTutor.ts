import { callEdgeFunction } from '@/lib/api/edgeFunctions';

export interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiTutorParams {
  messages: TutorMessage[];
  subject?: string;
  topic?: string;
  systemContext?: string;
}

export interface AiTutorResult {
  response: string;
  suggestedFollowUps?: string[];
}

/**
 * Calls the ai-tutor edge function for a conversational AI tutoring session.
 * Sends the full message history for context continuity.
 */
export async function sendTutorMessage(
  params: AiTutorParams,
): Promise<AiTutorResult> {
  const systemPrompt = buildSystemPrompt(params);

  const data = await callEdgeFunction<{ response: string; suggested_follow_ups?: string[] }>({
    functionName: 'ai-tutor',
    body: {
      messages: params.messages,
      system_prompt: systemPrompt,
      max_tokens: Math.min(800 + params.messages.length * 50, 2000),
    },
  });

  if (!data?.response) throw new Error('No response from tutor');

  return {
    response: data.response,
    suggestedFollowUps: data.suggested_follow_ups,
  };
}

function buildSystemPrompt(params: AiTutorParams): string {
  const parts: string[] = [
    'You are an expert AI tutor helping a student study.',
    'Be encouraging, clear, and concise.',
    'Use analogies and examples when helpful.',
    'If the student is struggling, break concepts into smaller pieces.',
    'Use LaTeX notation ($..$ for inline, $$...$$ for block) for math.',
  ];

  if (params.subject) {
    parts.push(`The current subject is: ${params.subject}.`);
  }
  if (params.topic) {
    parts.push(`The current topic is: ${params.topic}.`);
  }
  if (params.systemContext) {
    parts.push(params.systemContext);
  }

  return parts.join(' ');
}
