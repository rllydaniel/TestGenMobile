import { Difficulty, QuestionType } from '@/lib/constants';

export interface TestConfig {
  subjectId: string;
  topicIds: string[];
  questionCount: number;
  questionType: QuestionType;
  difficulty: Difficulty;
  timerEnabled: boolean;
  timerMinutes: number;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'short_response' | 'true_false';
  options?: QuestionOption[];
  correctAnswer: string;
  explanation?: string;
}

export interface TestResult {
  id: string;
  testConfig: TestConfig;
  questions: Question[];
  userAnswers: Record<string, string>;
  score: number;
  totalQuestions: number;
  correctCount: number;
  completedAt: string;
  timeTaken?: number;
}

export interface TestHistoryItem {
  id: string;
  subject: string;
  topics: string[];
  score: number;
  totalQuestions: number;
  questionType: string;
  difficulty: string;
  completedAt: string;
  timeTaken?: number;
}
