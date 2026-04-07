import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated as RNAnimated,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TypingText } from '@/components/ui/TypingText';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { callEdgeFunction } from '@/lib/api/edgeFunctions';
import { useProfile } from '@/hooks/useProfile';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useGenerateFlashcards } from '@/hooks/useFlashcards';
import { useAuth } from '@/lib/auth';
import type { TestQuestion } from '@/lib/api/generateTest';
import {
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
  SHADOWS,
  getScoreColor,
  formatDuration,
} from '@/constants/theme';
import { MathRenderer } from '@/components/ui/MathRenderer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Confetti Dot ────────────────────────────────────────────────────────────

const ConfettiDot = React.memo(function ConfettiDot({
  color, delay, startX, startY,
}: { color: string; delay: number; startX: number; startY: number }) {
  const anim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.delay(delay),
        RNAnimated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        RNAnimated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <RNAnimated.View
      style={{
        position: 'absolute',
        left: startX,
        top: startY,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.8, 0] }),
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -80] }) },
          { scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 0.6] }) },
        ],
      }}
    />
  );
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface CompletedSession {
  id: string;
  subject: string;
  difficulty: string;
  study_mode: boolean;
  questions: TestQuestion[];
  answers: Record<string, string>;
  score: number | null;
  time_spent: number | null;
  created_at: string;
  completed_at: string | null;
}

interface TopicBreakdown {
  name: string;
  correct: number;
  total: number;
}

interface QuestionResult {
  question: TestQuestion;
  index: number;
  userAnswer: string;
  isCorrect: boolean;
  wasSkipped: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getScoreHeadline(pct: number): string {
  if (pct >= 80) return 'Excellent work.';
  if (pct >= 60) return 'Solid effort.';
  return 'Keep pushing.';
}

function computeResults(session: CompletedSession) {
  const { questions, answers } = session;
  const results: QuestionResult[] = questions.map((q, i) => {
    const userAnswer = answers[String(i)] ?? '';
    const wasSkipped = userAnswer === '';
    let isCorrect = false;
    if (!wasSkipped && q.type === 'multiple-choice') {
      // userAnswer is a letter ("A"), correctAnswer is option text ("True")
      // Compare both: direct match AND resolved option text match
      const letterIdx = LETTERS.indexOf(userAnswer);
      const selectedText = letterIdx >= 0 ? q.options?.[letterIdx] : undefined;
      isCorrect = userAnswer === q.correctAnswer || selectedText === q.correctAnswer;
    }
    return { question: q, index: i, userAnswer, isCorrect, wasSkipped };
  });

  const mcqResults = results.filter((r) => r.question.type === 'multiple-choice');
  const correctCount = mcqResults.filter((r) => r.isCorrect).length;
  const skippedCount = results.filter((r) => r.wasSkipped).length;
  // Use pre-calculated score (includes AI-graded SR) when available
  const scorePct = session.score != null
    ? Math.round(session.score)
    : mcqResults.length > 0
      ? Math.round((correctCount / mcqResults.length) * 100)
      : 0;

  const topicMap: Record<string, { correct: number; total: number }> = {};
  mcqResults.forEach((r) => {
    const topic = r.question.topic || session.subject;
    if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
    topicMap[topic].total++;
    if (r.isCorrect) topicMap[topic].correct++;
  });
  const topics: TopicBreakdown[] = Object.entries(topicMap).map(([name, v]) => ({ name, ...v }));

  return { results, correctCount, skippedCount, scorePct, topics, totalQuestions: questions.length, mcqCount: mcqResults.length };
}

// ─── Animated Score Ring ──────────────────────────────────────────────────────

function ScoreRing({ percentage, size = 120, strokeWidth = 10 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(percentage, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [percentage]);

  // We use SVG directly since animated SVG props require a different approach
  const strokeDashoffset = circumference - (circumference * percentage) / 100;
  const scoreColor = getScoreColor(percentage);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={scoreColor}
          strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject as any}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 34, fontFamily: FONTS.sansBold, color: colors.textPrimary, lineHeight: 34 * 1.1, includeFontPadding: false }}>
              {percentage}
            </Text>
            <Text style={{ fontSize: FONT_SIZES.base, fontFamily: FONTS.sansMedium, color: colors.textMuted, marginBottom: 4, lineHeight: FONT_SIZES.base * 1.4 }}>
              %
            </Text>
          </View>
          <Text style={{ fontSize: FONT_SIZES.xs, fontFamily: FONTS.sansRegular, color: colors.textMuted, lineHeight: FONT_SIZES.xs * 1.4 }}>
            score
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Animated Topic Bar ───────────────────────────────────────────────────────

function TopicBar({ topic, index }: { topic: TopicBreakdown; index: number }) {
  const { colors } = useTheme();
  const pct = topic.total > 0 ? Math.round((topic.correct / topic.total) * 100) : 0;
  const barColor = getScoreColor(pct);
  const widthAnim = useSharedValue(0);

  useEffect(() => {
    widthAnim.value = withDelay(
      index * 60,
      withTiming(pct, { duration: 600, easing: Easing.out(Easing.quad) }),
    );
  }, [pct, index]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value}%` as any,
    backgroundColor: barColor,
  }));

  return (
    <View style={styles.topicRow}>
      <Text style={[styles.topicName, { color: colors.textPrimary }]} numberOfLines={1}>
        {topic.name}
      </Text>
      <View style={[styles.topicTrack, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.topicFill, barStyle]} />
      </View>
      <Text style={[styles.topicPct, { color: barColor }]}>{pct}%</Text>
    </View>
  );
}

// ─── AI Summary Card ──────────────────────────────────────────────────────────

function AISummaryCard({ session, computed }: { session: CompletedSession; computed: ReturnType<typeof computeResults> }) {
  const { colors } = useTheme();
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [typingDone, setTypingDone] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callEdgeFunction<{ summary?: string }>({
        functionName: 'summarize-test',
        body: {
          subject: session.subject,
          scorePct: computed.scorePct,
          correctCount: computed.correctCount,
          totalQuestions: computed.totalQuestions,
          topics: computed.topics,
          difficulty: session.difficulty,
        },
      });
      setSummaryText(data?.summary ?? null);
    } catch {
      setSummaryText(null);
    } finally {
      setLoading(false);
    }
  }, [session, computed]);

  useEffect(() => { fetchSummary(); }, []);

  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.primaryLight, borderLeftColor: colors.primary }]}>
      {/* Header */}
      <View style={styles.summaryHeader}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
        <Text style={[styles.summaryLabel, { color: colors.primary }]}>YOUR AI SUMMARY</Text>
        {!loading && summaryText && (
          <Pressable onPress={() => { setSummaryText(null); setLoading(true); setTypingDone(false); fetchSummary(); }} style={{ marginLeft: 'auto' }}>
            <Text style={[styles.regenerateText, { color: colors.textMuted, opacity: typingDone ? 1 : 0.4 }]}>Regenerate</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={{ gap: 8, marginTop: SPACING.sm }}>
          {[80, 95, 70].map((w, i) => (
            <View key={i} style={[styles.shimmerLine, { width: `${w}%` as any, backgroundColor: colors.border }]} />
          ))}
        </View>
      ) : summaryText ? (
        <TypingText
          text={summaryText}
          style={[styles.summaryText, { color: colors.textPrimary }]}
          cursorColor={colors.primary}
          charInterval={18}
          onComplete={() => setTypingDone(true)}
        />
      ) : (
        <Text style={[styles.summaryText, { color: colors.textMuted }]}>
          Unable to generate summary. Tap regenerate to try again.
        </Text>
      )}
    </View>
  );
}

// ─── Question Review Card ─────────────────────────────────────────────────────

function QuestionReviewCard({ result, index }: { result: QuestionResult; index: number }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const { question, userAnswer, isCorrect, wasSkipped } = result;
  const isMCQ = question.type === 'multiple-choice';

  const isSR = question.type === 'short-response';
  const statusColor = wasSkipped ? colors.textFaint : isSR ? colors.textMuted : isCorrect ? colors.success : colors.error;
  const statusIcon = wasSkipped ? 'remove-circle' : isSR ? 'chatbox-ellipses' : isCorrect ? 'checkmark-circle' : 'close-circle';

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  const userAnswerLabel = isMCQ && userAnswer
    ? `${userAnswer}: ${question.options?.[LETTERS.indexOf(userAnswer)] ?? userAnswer}`
    : userAnswer || '(skipped)';

  const correctAnswerLabel = isMCQ
    ? `${question.correctAnswer}: ${question.options?.[LETTERS.indexOf(question.correctAnswer)] ?? question.correctAnswer}`
    : question.correctAnswer;

  return (
    <Pressable onPress={toggleExpanded}>
      <Card style={{ marginBottom: SPACING.sm, backgroundColor: colors.surface }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Ionicons name={statusIcon as any} size={22} color={statusColor} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FONT_SIZES.xs, fontFamily: FONTS.sansSemiBold, color: colors.textMuted, marginBottom: 2, lineHeight: FONT_SIZES.xs * 1.5 }}>
              Q{index + 1}{!isMCQ ? ' · Short Response' : ''}
            </Text>
            {!expanded && (
              <Text style={{ fontSize: FONT_SIZES.sm, fontFamily: FONTS.sansRegular, color: colors.textPrimary, lineHeight: FONT_SIZES.sm * 1.5 }} numberOfLines={1}>
                {question.text}
              </Text>
            )}
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textFaint} />
        </View>

        {expanded && (
          <View style={{ marginTop: SPACING.md, gap: SPACING.sm }}>
            <MathRenderer
              content={question.text}
              style={{ fontSize: FONT_SIZES.base, fontFamily: FONTS.sansRegular, color: colors.textPrimary, lineHeight: FONT_SIZES.base * 1.6 }}
              fontSize={FONT_SIZES.base}
            />

            {isMCQ && !wasSkipped && !isCorrect && (
              <View style={{ backgroundColor: colors.errorLight, borderRadius: RADIUS.sm, padding: SPACING.sm + 2, borderLeftWidth: 3, borderLeftColor: colors.error }}>
                <Text style={{ fontSize: FONT_SIZES.xs, fontFamily: FONTS.sansSemiBold, color: colors.error, marginBottom: 2 }}>Your Answer</Text>
                <Text style={{ fontSize: FONT_SIZES.sm, fontFamily: FONTS.sansRegular, color: colors.error }}>{userAnswerLabel}</Text>
              </View>
            )}

            {!isMCQ && !wasSkipped && (
              <View style={{ backgroundColor: colors.surfaceSecondary, borderRadius: RADIUS.sm, padding: SPACING.sm + 2, borderLeftWidth: 3, borderLeftColor: colors.border }}>
                <Text style={{ fontSize: FONT_SIZES.xs, fontFamily: FONTS.sansSemiBold, color: colors.textMuted, marginBottom: 2 }}>Your Answer</Text>
                <Text style={{ fontSize: FONT_SIZES.sm, fontFamily: FONTS.sansRegular, color: colors.textPrimary }}>{userAnswer}</Text>
              </View>
            )}

            <View style={{ backgroundColor: colors.successLight, borderRadius: RADIUS.sm, padding: SPACING.sm + 2, borderLeftWidth: 3, borderLeftColor: colors.success }}>
              <Text style={{ fontSize: FONT_SIZES.xs, fontFamily: FONTS.sansSemiBold, color: colors.success, marginBottom: 2 }}>
                {isMCQ ? 'Correct Answer' : 'Model Answer'}
              </Text>
              <Text style={{ fontSize: FONT_SIZES.sm, fontFamily: FONTS.sansRegular, color: colors.success }}>{correctAnswerLabel}</Text>
            </View>

            {question.explanation && (
              <View style={{ backgroundColor: colors.primaryLight, borderRadius: RADIUS.sm, padding: SPACING.sm + 2, borderLeftWidth: 3, borderLeftColor: colors.primary }}>
                <Text style={{ fontSize: FONT_SIZES.xs, fontFamily: FONTS.sansSemiBold, color: colors.primary, marginBottom: 4 }}>Explanation</Text>
                <Text style={{ fontSize: FONT_SIZES.sm, fontFamily: FONTS.sansRegular, color: colors.textPrimary, lineHeight: FONT_SIZES.sm * 1.6 }}>
                  {question.explanation}
                </Text>
              </View>
            )}
          </View>
        )}
      </Card>
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TestResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [session, setSession] = useState<CompletedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoadError('No session ID'); setLoading(false); return; }
    supabase
      .from('test_sessions')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setLoadError(error?.message ?? 'Session not found');
        else setSession(data as CompletedSession);
        setLoading(false);
      });
  }, [id]);

  const computed = session ? computeResults(session) : null;

  const confettiDots = useMemo(() => {
    if (!computed || computed.scorePct <= 75) return [];
    const confettiColors = ['#2360E8', '#22C55E', '#F59E0B', '#9B59B6', '#1ABC9C', '#EF4444'];
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      color: confettiColors[i % confettiColors.length],
      delay: i * 100,
      x: Math.random() * (SCREEN_WIDTH - 40) + 20,
      y: Math.random() * 140,
    }));
  }, [computed?.scorePct]);

  const handleBackToDashboard = useCallback(() => router.replace('/(tabs)'), [router]);
  const handleNewTest = useCallback(() => router.replace('/(tabs)/generate'), [router]);
  const handleRetake = useCallback(() => router.back(), [router]);

  const { data: profile } = useProfile();
  const { user } = useAuth();
  const { isPremium } = useEntitlement();
  const generateFlashcards = useGenerateFlashcards();
  const [flashcardLoading, setFlashcardLoading] = useState(false);
  const [reviewExpanded, setReviewExpanded] = useState(false);

  const handleGenerateFlashcards = useCallback(async () => {
    if (!session || !user) return;
    const used = profile?.flashcard_generations_used ?? 0;

    if (!isPremium && used >= 1) {
      Alert.alert(
        'Premium Feature',
        'You\'ve used your free flashcard generation. Upgrade to premium for unlimited flashcard creation.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'View Plans', onPress: () => router.push('/(app)/subscription') },
        ],
      );
      return;
    }

    setFlashcardLoading(true);
    try {
      const weakTopics = computed?.topics
        ?.filter((t) => t.total > 0 && (t.correct / t.total) < 0.7)
        ?.map((t) => t.name) ?? [session.subject];
      const topics = weakTopics.length > 0 ? weakTopics : [session.subject];

      await generateFlashcards.mutateAsync({
        subject: session.subject,
        topics,
        count: Math.min(topics.length * 5, 20),
      });

      // Increment usage counter
      if (!isPremium) {
        await supabase
          .from('profiles')
          .update({ flashcard_generations_used: used + 1 })
          .eq('id', user.id);
      }

      Alert.alert('Flashcards Created!', 'Your flashcards are ready in the Library.', [
        { text: 'View Library', onPress: () => router.push('/(tabs)/library') },
        { text: 'OK' },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to generate flashcards');
    } finally {
      setFlashcardLoading(false);
    }
  }, [session, user, profile, isPremium, computed, generateFlashcards, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.appBackground, gap: SPACING.md }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZES.base, color: colors.textMuted }}>Loading results...</Text>
      </View>
    );
  }

  if (loadError || !session || !computed) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.appBackground, gap: SPACING.md, paddingHorizontal: SPACING.screenH }}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={{ fontFamily: FONTS.displaySemiBold, fontSize: FONT_SIZES.xl, color: colors.textPrimary, includeFontPadding: false }}>Failed to load results</Text>
        <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZES.sm, color: colors.textMuted, textAlign: 'center' }}>{loadError}</Text>
        <Pressable onPress={handleBackToDashboard} style={{ backgroundColor: colors.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md }}>
          <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: colors.textOnPrimary }}>Go to Dashboard</Text>
        </Pressable>
      </View>
    );
  }

  const { results, correctCount, skippedCount, scorePct, topics, totalQuestions, mcqCount } = computed;
  const scoreColor = getScoreColor(scorePct);
  const duration = session.time_spent ?? 0;
  const flaggedCount = 0; // not stored on session in results context

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SPACING.screenH, paddingTop: insets.top + SPACING.md, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Action row ── */}
        <View style={styles.actionRow}>
          <Pressable onPress={handleBackToDashboard} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 }}>
            <Ionicons name="arrow-back" size={18} color={colors.textMuted} />
            <Text style={[styles.dashboardLink, { color: colors.textMuted }]}>Dashboard</Text>
          </Pressable>
        </View>

        {/* ── Hero ── */}
        <View style={styles.heroSection}>
          {confettiDots.map((dot) => (
            <ConfettiDot key={dot.id} color={dot.color} delay={dot.delay} startX={dot.x} startY={dot.y} />
          ))}
          <ScoreRing percentage={scorePct} size={120} strokeWidth={9} />

          {/* Stat chips */}
          <View style={styles.statChips}>
            <View style={[styles.statChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.statChipText, { color: colors.textPrimary }]}>{scorePct}% accuracy</Text>
            </View>
            {duration > 0 && (
              <View style={[styles.statChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.statChipText, { color: colors.textPrimary }]}>{formatDuration(duration)}</Text>
              </View>
            )}
            <View style={[styles.statChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="list-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.statChipText, { color: colors.textPrimary }]}>{correctCount}/{mcqCount} MCQ</Text>
            </View>
          </View>

          {/* Score headline */}
          <Text style={[styles.scoreHeadline, { color: colors.textPrimary }]}>
            {getScoreHeadline(scorePct)}
          </Text>
          <Text style={[styles.scoreSubline, { color: colors.textMuted }]}>
            {session.subject} · {session.difficulty}
          </Text>
        </View>

        {/* ── AI Summary ── */}
        <AISummaryCard session={session} computed={computed} />

        {/* ── Topic Breakdown ── */}
        {topics.length > 0 && (
          <View style={{ marginBottom: SPACING.lg }}>
            <Text style={[styles.sectionHeading, { color: colors.textFaint }]}>TOPIC BREAKDOWN</Text>
            <View style={[styles.topicCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {topics.map((topic, i) => (
                <TopicBar key={topic.name} topic={topic} index={i} />
              ))}
            </View>
          </View>
        )}

        {/* ── Question Review ── */}
        <Pressable
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setReviewExpanded((prev) => !prev);
          }}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm, marginBottom: SPACING.sm }}
        >
          <Text style={[styles.sectionHeading, { color: colors.textFaint, marginBottom: 0 }]}>
            REVIEW QUESTIONS ({totalQuestions})
          </Text>
          <Ionicons name={reviewExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textFaint} />
        </Pressable>
        {reviewExpanded && results.map((result, index) => (
          <QuestionReviewCard key={result.question.id || index} result={result} index={index} />
        ))}

        {/* ── CTA ── */}
        <Text style={[styles.savedText, { color: colors.textFaint }]}>Results saved to your history.</Text>
        <View style={{ gap: SPACING.sm, marginTop: SPACING.sm }}>
          <Button
            label={flashcardLoading ? 'Creating Flashcards...' : 'Create Flashcards from Weak Areas'}
            onPress={handleGenerateFlashcards}
            variant="outline"
            size="lg"
            icon={flashcardLoading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Ionicons name="flash" size={20} color={colors.primary} />
            }
            fullWidth
            disabled={flashcardLoading}
          />
          <Button
            label="New Test"
            onPress={handleNewTest}
            size="lg"
            icon={<Ionicons name="add-circle" size={20} color={colors.textOnPrimary} />}
            fullWidth
          />
          <Button
            label="Back to Dashboard"
            onPress={handleBackToDashboard}
            variant="ghost"
            size="lg"
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dashboardLink: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  statChips: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statChipText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansMedium,
    lineHeight: FONT_SIZES.xs * 1.4,
  },
  scoreHeadline: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.displaySemiBold,
    textAlign: 'center',
    lineHeight: FONT_SIZES.xl * 1.2,
    includeFontPadding: false,
  },
  scoreSubline: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  summaryCard: {
    borderLeftWidth: 3,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansSemiBold,
    letterSpacing: 0.5,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  summaryText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.7,
  },
  regenerateText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  shimmerLine: {
    height: 12,
    borderRadius: 6,
  },
  sectionHeading: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansSemiBold,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  topicCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    ...SHADOWS.sm,
    gap: SPACING.sm,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    height: 44,
  },
  topicName: {
    width: 100,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  topicTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  topicFill: {
    height: 6,
    borderRadius: 3,
  },
  topicPct: {
    width: 36,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansSemiBold,
    textAlign: 'right',
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  savedText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    textAlign: 'center',
    lineHeight: FONT_SIZES.xs * 1.5,
    marginTop: SPACING.lg,
  },
});
