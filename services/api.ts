import { SupabaseClient } from '@supabase/supabase-js';
import { TestConfig, Question, TestResult } from '@/types/test';
import { Flashcard } from '@/types/flashcard';
import { callEdgeFunction } from '@/lib/api/edgeFunctions';

export async function generateQuestions(
  supabase: SupabaseClient,
  config: TestConfig,
  signal?: AbortSignal
): Promise<Question[]> {
  const { data, error } = await supabase.functions.invoke('generate-question', {
    body: {
      subject: config.subjectId,
      topics: config.topicIds,
      count: config.questionCount,
      type: config.questionType,
      difficulty: config.difficulty,
    },
  });
  if (error) throw error;
  return data.questions;
}

export async function gradeShortResponse(
  supabase: SupabaseClient,
  question: string,
  correctAnswer: string,
  userAnswer: string
): Promise<{ isCorrect: boolean; feedback: string }> {
  const { data, error } = await supabase.functions.invoke('grade-short-response', {
    body: { question, correctAnswer, userAnswer },
  });
  if (error) throw error;
  return data;
}

export async function explainAnswer(
  supabase: SupabaseClient,
  question: string,
  correctAnswer: string,
  userAnswer: string
): Promise<{ explanation: string }> {
  const { data, error } = await supabase.functions.invoke('explain-answer', {
    body: { question, correctAnswer, userAnswer },
  });
  if (error) throw error;
  return data;
}

export async function summarizeTest(
  supabase: SupabaseClient,
  testResult: TestResult
): Promise<{ summary: string; weaknesses: string[]; improvements: string[] }> {
  const { data, error } = await supabase.functions.invoke('summarize-test', {
    body: { testResult },
  });
  if (error) throw error;
  return data;
}

export async function generateFlashcards(
  subject: string,
  topics: string[],
  count: number
): Promise<Flashcard[]> {
  const data = await callEdgeFunction<{ flashcards: Flashcard[] }>({
    functionName: 'generate-flashcards',
    body: { subject, topics, count },
  });
  return data.flashcards;
}

export async function generateQuizFromNotes(
  supabase: SupabaseClient,
  fileUrl: string,
  questionCount: number
): Promise<Question[]> {
  const { data, error } = await supabase.functions.invoke('generate-quiz-from-notes', {
    body: { fileUrl, count: questionCount },
  });
  if (error) throw error;
  return data.questions;
}

export async function saveTestHistory(
  supabase: SupabaseClient,
  testResult: TestResult
): Promise<void> {
  const { error } = await supabase.functions.invoke('save-test-history', {
    body: { testResult },
  });
  if (error) throw error;
}

export async function generateLesson(
  supabase: SupabaseClient,
  subject: string,
  topic: string
): Promise<{ content: string }> {
  const { data, error } = await supabase.functions.invoke('generate-lesson', {
    body: { subject, topic },
  });
  if (error) throw error;
  return data;
}

export async function studyGuideChat(
  supabase: SupabaseClient,
  subject: string,
  question: string,
  history: { role: string; content: string }[]
): Promise<{ answer: string }> {
  const { data, error } = await supabase.functions.invoke('study-guide-chat', {
    body: { subject, question, history },
  });
  if (error) throw error;
  return data;
}
