import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing as REasing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { callEdgeFunction } from '@/lib/api/edgeFunctions';
import { useCreatePlan } from '@/hooks/usePlan';
import { TypingText } from '@/components/ui/TypingText';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS, getScoreColor } from '@/constants/theme';
import type { DiagnosticLevel, PlanSetupConfig, TopicLevel } from '@/types/plan';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 120;
const STROKE_WIDTH = 10;
const RADIUS_VAL = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS_VAL;

interface TopicBar {
  topic: string;
  accuracy: number;
  questionCount: number;
}

function getLevelFromScore(pct: number): DiagnosticLevel {
  if (pct >= 75) return 'advanced';
  if (pct >= 50) return 'intermediate';
  return 'beginner';
}

function getLevelLabel(level: DiagnosticLevel) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ pct, level, colors }: { pct: number; level: DiagnosticLevel; colors: any }) {
  const strokeDashoffset = useSharedValue(CIRCUMFERENCE);

  useEffect(() => {
    strokeDashoffset.value = withTiming(
      CIRCUMFERENCE * (1 - pct / 100),
      { duration: 1200, easing: REasing.out(REasing.cubic) },
    );
  }, [pct]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value,
  }));

  const levelColor = level === 'advanced'
    ? colors.levelAdvanced
    : level === 'intermediate'
    ? colors.levelIntermediate
    : colors.levelBeginner;

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: 'absolute' }}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS_VAL}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS_VAL}
          stroke="#FFFFFF"
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      <Text style={[styles.ringPct, { color: '#FFFFFF' }]}>{Math.round(pct)}%</Text>
      <Text style={[styles.ringLabel, { color: 'rgba(255,255,255,0.75)' }]}>score</Text>
    </View>
  );
}

// ─── Topic Bar ─────────────────────────────────────────────────────────────────

function TopicBarRow({ topic, accuracy, index, colors }: TopicBar & { index: number; colors: any }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(index * 60, withTiming(accuracy, { duration: 600 }));
  }, [accuracy]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const color = accuracy >= 70 ? colors.success : accuracy >= 45 ? colors.warning : colors.error;

  return (
    <View style={styles.topicRow}>
      <View style={styles.topicInfo}>
        <Text style={[styles.topicName, { color: colors.textPrimary }]} numberOfLines={1}>{topic}</Text>
        <Text style={[styles.topicPct, { color: colors.textMuted }]}>{Math.round(accuracy)}%</Text>
      </View>
      <View style={[styles.topicTrack, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.topicFill, barStyle, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PlanResultsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string; diagnosticSetup: string }>();
  const createPlan = useCreatePlan();

  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [topicBars, setTopicBars] = useState<TopicBar[]>([]);
  const [assessment, setAssessment] = useState<string | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const level = getLevelFromScore(score);

  const setup: Partial<PlanSetupConfig> = React.useMemo(() => {
    try {
      return params.diagnosticSetup ? JSON.parse(params.diagnosticSetup) : {};
    } catch {
      return {};
    }
  }, [params.diagnosticSetup]);

  /* ---------- Load session ---------- */

  useEffect(() => {
    if (!params.sessionId) return;

    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('test_sessions')
          .select('*')
          .eq('id', params.sessionId)
          .single();

        if (err || !data) throw err ?? new Error('Session not found');

        const sessionScore = data.score ?? 0;
        setScore(sessionScore);

        // Calculate topic breakdown from questions + answers
        const questions: any[] = data.questions ?? [];
        const answers: Record<string, string> = data.answers ?? {};

        const topicMap: Record<string, { correct: number; total: number }> = {};
        questions.forEach((q: any, i: number) => {
          const t = q.topic ?? q.subject ?? 'General';
          if (!topicMap[t]) topicMap[t] = { correct: 0, total: 0 };
          topicMap[t].total++;
          if (answers[String(i)] === q.correctAnswer) {
            topicMap[t].correct++;
          }
        });

        const bars: TopicBar[] = Object.entries(topicMap)
          .map(([topic, { correct, total }]) => ({
            topic,
            accuracy: total > 0 ? (correct / total) * 100 : 0,
            questionCount: total,
          }))
          .sort((a, b) => a.accuracy - b.accuracy); // weak → strong

        setTopicBars(bars);

        // AI assessment
        try {
          const fnData = await callEdgeFunction<{ summary?: string }>({
            functionName: 'summarize-test',
            body: {
              subject: data.subject ?? setup.subject ?? 'General',
              scorePct: sessionScore,
              correctCount: data.score !== null ? Math.round((sessionScore / 100) * questions.length) : 0,
              totalQuestions: questions.length,
              topics: bars.map((b) => b.topic),
              difficulty: 'mixed',
            },
          });
          setAssessment(fnData?.summary ?? null);
        } catch {
          setAssessment(null);
        }
        setAssessmentLoading(false);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load results.');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.sessionId]);

  /* ---------- Build plan ---------- */

  const handleBuildPlan = useCallback(async () => {
    if (building) return;
    setBuilding(true);

    try {
      // Call generate-study-plan edge function
      const planData = await callEdgeFunction<Record<string, any>>({
        functionName: 'generate-study-plan',
        body: {
          subject: setup.subject ?? 'General',
          targetExam: setup.targetExam ?? setup.subject ?? 'General',
          targetDate: setup.targetDate,
          availableDays: setup.availableDays,
          minutesPerSession: setup.minutesPerSession ?? 30,
          goalScore: setup.goalScore,
          diagnosticScore: score,
          level,
          topicBreakdown: topicBars,
        },
      });

      const plan = await createPlan.mutateAsync({
        subject: setup.subject ?? 'General',
        targetExam: setup.targetExam ?? setup.subject ?? 'General',
        targetDate: setup.targetDate ?? new Date().toISOString().split('T')[0],
        availableDays: (setup.availableDays as unknown as number[]) ?? [1, 2, 3, 4, 5],
        minutesPerSession: Number(setup.minutesPerSession ?? 30),
        goalScore: setup.goalScore ? Number(setup.goalScore) : undefined,
        diagnosticScore: score,
        level,
        planData: planData ?? { weeks: [], totalSessions: 0, completedSessions: 0 },
      });

      router.push({
        pathname: '/(app)/plan/view',
        params: { planId: plan.id },
      });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to build plan. Please try again.');
      setBuilding(false);
    }
  }, [building, setup, score, level, topicBars, createPlan, router]);

  /* ---------- Level hero colors ---------- */

  const levelBg = level === 'advanced'
    ? colors.levelAdvanced
    : level === 'intermediate'
    ? colors.levelIntermediate
    : colors.levelBeginner;

  const levelBgLight = level === 'advanced'
    ? colors.levelAdvancedLight
    : level === 'intermediate'
    ? colors.levelIntermediateLight
    : colors.levelBeginnerLight;

  /* ---------- Loading / Error ---------- */

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.appBackground }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Analyzing your results…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.appBackground }]}>
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Something went wrong</Text>
        <Text style={[styles.errorDesc, { color: colors.textMuted }]}>{error}</Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.primary, ...SHADOWS.primary }]}
        >
          <Text style={[styles.backBtnText, { color: colors.textOnPrimary }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.appBackground }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, SPACING.xl) }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Level hero card */}
      <View style={[styles.heroCard, { backgroundColor: levelBg }]}>
        <Text style={styles.heroLabel}>YOUR LEVEL</Text>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroLevel}>{getLevelLabel(level)}</Text>
            <Text style={styles.heroSubject}>{setup.subject ?? 'General'}</Text>
          </View>
          <ScoreRing pct={score} level={level} colors={colors} />
        </View>
      </View>

      {/* Topic breakdown */}
      {topicBars.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface, ...SHADOWS.sm }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Topic Breakdown</Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Sorted weakest to strongest</Text>
          <View style={{ marginTop: SPACING.md, gap: SPACING.md }}>
            {topicBars.map((bar, i) => (
              <TopicBarRow key={bar.topic} {...bar} index={i} colors={colors} />
            ))}
          </View>
        </View>
      )}

      {/* AI Assessment */}
      <View
        style={[
          styles.assessmentCard,
          { backgroundColor: colors.primaryLight, borderLeftColor: colors.primary },
        ]}
      >
        <View style={styles.assessmentHeader}>
          <Text style={[styles.assessmentLabel, { color: colors.primary }]}>✦ AI ASSESSMENT</Text>
        </View>
        {assessmentLoading ? (
          <View style={styles.shimmerContainer}>
            {[100, 80, 90].map((w, i) => (
              <View
                key={i}
                style={[styles.shimmerLine, { backgroundColor: colors.border, width: `${w}%` }]}
              />
            ))}
          </View>
        ) : assessment ? (
          <TypingText
            text={assessment}
            style={[styles.assessmentText, { color: colors.textPrimary }]}
            cursorColor={colors.primary}
          />
        ) : (
          <Text style={[styles.assessmentText, { color: colors.textMuted }]}>
            Your diagnostic results are ready. Build your personalized study plan below.
          </Text>
        )}
      </View>

      {/* Level info chips */}
      <View style={[styles.levelInfoCard, { backgroundColor: levelBgLight, borderColor: levelBg }]}>
        <Text style={[styles.levelInfoTitle, { color: levelBg }]}>{getLevelLabel(level)} Learner</Text>
        <Text style={[styles.levelInfoDesc, { color: colors.textMuted }]}>
          {level === 'beginner'
            ? 'Your plan will start with foundational concepts and gradually build toward exam-level mastery.'
            : level === 'intermediate'
            ? 'Your plan focuses on reinforcing core concepts and closing knowledge gaps with targeted practice.'
            : 'Your plan targets advanced topics, refines test strategy, and focuses on edge-case concepts.'}
        </Text>
      </View>

      {/* CTA */}
      <View style={{ gap: SPACING.sm, marginTop: SPACING.md }}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1, ...SHADOWS.primary },
          ]}
          onPress={handleBuildPlan}
          disabled={building}
        >
          {building ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={[styles.primaryBtnText, { color: colors.textOnPrimary }]}>Build My Study Plan →</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.ghostBtn, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={[styles.ghostBtnText, { color: colors.textMuted }]}>Skip for now</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.screenH, gap: SPACING.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, paddingHorizontal: SPACING.screenH },
  loadingText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.base * 1.5,
    marginTop: SPACING.sm,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.displaySemiBold,
    includeFontPadding: false,
  },
  errorDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    textAlign: 'center',
    lineHeight: FONT_SIZES.sm * 1.6,
  },
  backBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  backBtnText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
  },

  // Hero
  heroCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  heroLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansSemiBold,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLevel: {
    fontSize: FONT_SIZES.display,
    fontFamily: FONTS.sansBold,
    color: '#FFFFFF',
    includeFontPadding: false,
    lineHeight: FONT_SIZES.display * 1.1,
  },
  heroSubject: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: FONT_SIZES.base * 1.5,
    marginTop: 2,
  },
  ringPct: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.sansBold,
    includeFontPadding: false,
    textAlign: 'center',
  },
  ringLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    textAlign: 'center',
  },

  // Cards
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.displaySemiBold,
    includeFontPadding: false,
  },
  sectionSub: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
    marginTop: 2,
  },

  // Topic bars
  topicRow: { gap: 6 },
  topicInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topicName: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansSemiBold,
    flex: 1,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  topicPct: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  topicTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  topicFill: { height: 6, borderRadius: 3 },

  // Assessment
  assessmentCard: {
    borderRadius: RADIUS.xl,
    borderLeftWidth: 3,
    padding: SPACING.lg,
  },
  assessmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  assessmentLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansSemiBold,
    letterSpacing: 0.8,
  },
  assessmentText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.base * 1.65,
  },
  shimmerContainer: { gap: 8 },
  shimmerLine: { height: 12, borderRadius: 6 },

  // Level info
  levelInfoCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  levelInfoTitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.5,
    marginBottom: SPACING.xs,
  },
  levelInfoDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.6,
  },

  // Buttons
  primaryBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryBtnText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  ghostBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1,
  },
  ghostBtnText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.base * 1.5,
  },
});
