export type TutorMessageRole = 'user' | 'assistant';

export interface TutorMessage {
  id: string;
  sessionId: string;
  role: TutorMessageRole;
  content: string;
  createdAt: string;
}

export interface TutorSession {
  id: string;
  userId: string;
  subject?: string;
  topic?: string;
  messageCount: number;
  createdAt: string;
  lastMessageAt?: string;
}
