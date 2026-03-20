export const TIER_LIMITS = {
  free: { testsPerDay: 5 },
  basic: { testsPerDay: 10 },
  premium: { testsPerDay: Infinity },
} as const;

export type SubscriptionTier = keyof typeof TIER_LIMITS;

export const QUESTION_COUNTS = [5, 10, 15, 20, 25] as const;

export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'] as const;
export type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

export const QUESTION_TYPES = [
  'Multiple Choice',
  'Short Response',
  'True/False',
  'Mixed',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];
