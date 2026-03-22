export type DiagnosticLevel = 'beginner' | 'intermediate' | 'advanced';

export type SessionType =
  | 'study_guide'
  | 'topic_review'
  | 'flashcards'
  | 'practice_test'
  | 'rest';

export interface TopicLevel {
  topic: string;
  accuracy: number; // 0-100
  questionCount: number;
}

export interface DiagnosticResult {
  sessionId: string;
  subject: string;
  score: number;
  totalQuestions: number;
  level: DiagnosticLevel;
  topicBreakdown: TopicLevel[];
  aiAssessment?: string;
  completedAt: string;
}

export interface PlanSession {
  id: string;
  planId: string;
  weekNumber: number;
  dayNumber: number;
  sessionType: SessionType;
  topics: string[];
  durationMinutes: number;
  status: 'pending' | 'completed' | 'skipped';
  completedAt?: string;
  isRestDay?: boolean;
}

export interface StudyPlan {
  id: string;
  userId: string;
  subject: string;
  targetExam: string;
  targetDate: string;
  diagnosticScore?: number;
  level?: DiagnosticLevel;
  status: 'active' | 'completed' | 'paused';
  planData: {
    weeks: PlanWeek[];
    totalSessions: number;
    completedSessions: number;
  };
  createdAt: string;
}

export interface PlanWeek {
  weekNumber: number;
  topic: string;
  focusDescription: string;
  sessions: PlanSession[];
}

export interface PlanSetupConfig {
  subject: string;
  targetExam: string;
  targetDate: string;
  availableDays: number[]; // 0=Sun, 1=Mon, ... 6=Sat
  minutesPerSession: number;
  goalScore?: number;
}
