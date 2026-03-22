import { callEdgeFunction } from './edgeFunctions';
import { supabase } from '@/lib/supabase';

interface TopicBreakdown {
  topic: string;
  accuracy: number;
  strength: 'weak' | 'moderate' | 'strong';
}

interface StudyWeek {
  week_number: number;
  topic: string;
  week_label: string;
  sessions: StudySession[];
}

interface StudySession {
  day_date: string;
  topic: string;
  session_type: string;
  duration_minutes: number;
  focus_description: string;
  is_rest: boolean;
  week_label: string;
}

export interface StudyPlanResult {
  weeks: StudyWeek[];
  mode: 'cram' | 'intensive' | 'comprehensive';
}

const parseTimeToMinutes = (time: string): number => {
  const match = time.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 30;
};

const differenceInDays = (date1: Date, date2: Date): number => {
  const diffMs = date1.getTime() - date2.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const generateStudyPlan = async (params: {
  planId: string;
  subject: string;
  examDate: Date;
  availableDays: string[];
  timePerSession: string;
  goalScore: string;
  diagnosticLevel: string;
  topicBreakdown: TopicBreakdown[];
  totalScore: number;
}): Promise<StudyPlanResult> => {
  const daysUntilExam = differenceInDays(params.examDate, new Date());
  const mode =
    daysUntilExam <= 7
      ? 'cram'
      : daysUntilExam <= 21
        ? 'intensive'
        : 'comprehensive';

  const weakTopics = params.topicBreakdown
    .filter((t) => t.strength === 'weak')
    .map((t) => t.topic);
  const moderateTopics = params.topicBreakdown
    .filter((t) => t.strength === 'moderate')
    .map((t) => t.topic);
  const strongTopics = params.topicBreakdown
    .filter((t) => t.strength === 'strong')
    .map((t) => t.topic);

  const minutesPerSession = parseTimeToMinutes(params.timePerSession);

  const planPrompt = `Create a week-by-week study plan for ${params.subject}.

STUDENT CONTEXT:
- Exam in ${daysUntilExam} days
- Mode: ${mode}
- Available days: ${params.availableDays.join(', ')}
- Session length: ${minutesPerSession} minutes
- Level: ${params.diagnosticLevel}
- Weak topics (FIRST 60% of plan): ${weakTopics.join(', ') || 'none'}
- Moderate topics (MIDDLE 20%): ${moderateTopics.join(', ') || 'none'}
- Strong topics (FINAL 20% review): ${strongTopics.join(', ') || 'none'}
- Goal: ${params.goalScore || 'maximize performance'}

RULES:
1. Each week has ONE primary topic
2. Session types per week: Study Guide → Topic Review → Flashcards → Practice Test
3. Rest days: ${mode === 'cram' ? '1 day mid-plan' : mode === 'intensive' ? '1 per week' : '2 per week'}
4. Never rest on available study days
5. Final session ALWAYS = full mixed Practice Test
6. Cram mode: skip Study Guides, Flashcards + Practice Questions only

RETURN as JSON:
{
  "weeks": [{
    "week_number": 1,
    "topic": "Topic Name",
    "week_label": "Week 1 · Topic Name",
    "sessions": [{
      "day_date": "YYYY-MM-DD",
      "topic": "Topic Name",
      "session_type": "Study Guide|Topic Review|Flashcards|Practice Test|Rest",
      "duration_minutes": ${minutesPerSession},
      "focus_description": "One sentence describing this session",
      "is_rest": false,
      "week_label": "Week 1 · Topic Name"
    }]
  }]
}
Return ONLY valid JSON. No markdown. No prose.`;

  const data = await callEdgeFunction<{ weeks: StudyWeek[] }>({
    functionName: 'generate-study-plan',
    body: {
      subject: params.subject,
      examDate: params.examDate.toISOString(),
      daysUntilExam,
      availableDays: params.availableDays,
      timePerSession: params.timePerSession,
      minutesPerSession,
      goalScore: params.goalScore,
      diagnosticLevel: params.diagnosticLevel,
      totalScore: params.totalScore,
      weakTopics,
      moderateTopics,
      strongTopics,
      mode,
      planPrompt,
    },
    timeoutMs: 60000,
  });

  // Save sessions to Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allSessions = data.weeks.flatMap((week) =>
    week.sessions.map((session, i) => ({
      plan_id: params.planId,
      user_id: user?.id,
      week_number: week.week_number,
      day_date: session.day_date,
      topic: session.topic,
      session_type: session.session_type,
      duration_minutes: session.duration_minutes,
      focus_description: session.focus_description,
      is_rest: session.is_rest ?? false,
      is_completed: false,
      display_order: i,
      week_label: session.week_label,
    })),
  );

  await supabase.from('study_sessions').insert(allSessions);

  // Update plan status
  await supabase
    .from('test_plans')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', params.planId);

  return { weeks: data.weeks, mode };
};
