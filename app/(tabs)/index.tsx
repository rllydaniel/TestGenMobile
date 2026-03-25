import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInView } from '@/components/ui/FadeInView';
import { useHaptic } from '@/hooks/useHaptic';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SectionLabel } from '@/components/ui/Label';
import { AccuracyRing } from '@/components/ui/AccuracyRing';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useDashboardStats, useStreak } from '@/hooks/useStats';
import { useProfile } from '@/hooks/useProfile';
import { useTestHistory } from '@/hooks/useTests';
import { useStudyPlan, usePlanSessions } from '@/hooks/usePlan';
import { useTheme } from '@/contexts/ThemeContext';
import {
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
  SHADOWS,
  getScoreColor,
  formatRelativeDate,
} from '@/constants/theme';
import { subjects } from '@/lib/subjects';
import { useAuth } from '@/lib/auth';

/* ------------------------------------------------------------------ */
/*  AccuracyCard — full-width horizontal ring + mini-stats            */
/* ------------------------------------------------------------------ */

const AccuracyCard = React.memo(function AccuracyCard({
  accuracyPct,
  totalQuestions,
  totalTests,
  bestSubject,
  colors,
}: {
  accuracyPct: number;
  totalQuestions: number;
  totalTests: number;
  bestSubject: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const avgScore = accuracyPct > 0 ? `${Math.round(accuracyPct)}%` : '—';
  const stats = [
    { label: 'ANSWERED', value: totalQuestions > 0 ? String(totalQuestions) : '—' },
    { label: 'BEST SUBJECT', value: bestSubject },
    { label: 'AVG SCORE', value: avgScore },
  ];

  return (
    <View
      style={[
        styles.accuracyCard,
        { backgroundColor: colors.surface, borderColor: `${colors.border}` },
      ]}
    >
      {/* Ring */}
      <AccuracyRing accuracy={accuracyPct} size={80} strokeWidth={6} />

      {/* Divider */}
      <View style={[styles.accuracyDivider, { backgroundColor: colors.border }]} />

      {/* Mini stats */}
      <View style={styles.accuracyStats}>
        {stats.map((s) => (
          <View key={s.label} style={styles.accuracyStatItem}>
            <Text
              style={[styles.accuracyStatLabel, { color: colors.textFaint }]}
              numberOfLines={1}
            >
              {s.label}
            </Text>
            <Text
              style={[styles.accuracyStatValue, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {s.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
});

/* ------------------------------------------------------------------ */
/*  Memoised sub-components                                           */
/* ------------------------------------------------------------------ */

const StatCard = React.memo(function StatCard({
  label,
  value,
  unit,
  icon,
  iconColor,
  isAccuracy,
  accuracyPct,
  focusTopic,
  focusSubjectColor,
  colors,
  style,
}: {
  label: string;
  value?: string;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  isAccuracy?: boolean;
  accuracyPct?: number;
  focusTopic?: string;
  focusSubjectColor?: string;
  colors: ReturnType<typeof useTheme>['colors'];
  style?: any;
}) {
  return (
    <Card style={[styles.statCard, style]} shadow="md" padding="sm">
      <View style={styles.statCardHeader}>
        <Text
          style={[
            styles.statLabel,
            { color: colors.textMuted, includeFontPadding: false },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>

      {focusTopic !== undefined ? (
        <View>
          <Text
            style={[
              styles.statFocusText,
              { color: colors.textPrimary, includeFontPadding: false },
            ]}
            numberOfLines={1}
          >
            {focusTopic || 'Study'}
          </Text>
          <Badge
            text={focusTopic ? focusTopic : 'Start'}
            color={focusSubjectColor ?? colors.primary}
            size="sm"
          />
        </View>
      ) : isAccuracy ? (
        <View style={styles.accuracyRow}>
          <AccuracyRing
            accuracy={accuracyPct ?? 0}
            size={88}
            strokeWidth={6}
          />
        </View>
      ) : (
        <View>
          <Text
            style={[
              styles.statValue,
              { color: colors.textPrimary, includeFontPadding: false },
            ]}
            numberOfLines={1}
          >
            {value}
          </Text>
          {unit ? (
            <Text
              style={[
                styles.statUnit,
                { color: colors.textMuted, includeFontPadding: false },
              ]}
              numberOfLines={1}
            >
              {unit}
            </Text>
          ) : null}
        </View>
      )}
    </Card>
  );
});

const TestRow = React.memo(function TestRow({
  topicLabel,
  subjectName,
  date,
  scoreLabel,
  pct,
  onPress,
  colors,
}: {
  topicLabel: string;
  subjectName: string;
  date: string;
  scoreLabel: string;
  pct: number;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const scoreColor = getScoreColor(pct);
  const { impact } = useHaptic();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => impact()}
      style={({ pressed }) => [
        styles.testRow,
        {
          borderTopColor: colors.border,
          opacity: pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={{ flex: 2 }}>
        <Text
          style={[
            styles.testRowTopic,
            { color: colors.textPrimary, includeFontPadding: false },
          ]}
          numberOfLines={1}
        >
          {topicLabel}
        </Text>
        <Text
          style={[
            styles.testRowSubject,
            { color: colors.textMuted, includeFontPadding: false },
          ]}
          numberOfLines={1}
        >
          {subjectName}
        </Text>
      </View>
      <Text
        style={[
          styles.testRowDate,
          { color: colors.textFaint, includeFontPadding: false },
        ]}
        numberOfLines={1}
      >
        {date}
      </Text>
      <Text
        style={[
          styles.testRowScore,
          { color: colors.textPrimary, includeFontPadding: false },
        ]}
        numberOfLines={1}
      >
        {scoreLabel}
      </Text>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Badge text={`${pct}%`} color={scoreColor} />
      </View>
    </Pressable>
  );
});

/* ------------------------------------------------------------------ */
/*  Main screen                                                       */
/* ------------------------------------------------------------------ */

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: streak, isLoading: streakLoading } = useStreak();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: tests, isLoading: testsLoading } = useTestHistory();
  const { data: activePlan } = useStudyPlan();
  const { data: planSessions = [] } = usePlanSessions(activePlan?.id ?? null);

  const isLoading = statsLoading || streakLoading || profileLoading || testsLoading;

  /* ---------- derived data ---------- */

  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const examCountdown = useMemo(() => {
    // Placeholder — replace with real exam date logic
    return { label: 'SAT in 45 days', visible: true };
  }, []);

  const recentTests = useMemo(() => tests?.slice(0, 5) ?? [], [tests]);

  const focusTopic = useMemo(() => {
    if (stats?.weakTopics?.length) return stats.weakTopics[0];
    return '';
  }, [stats]);

  const focusSubject = useMemo(() => {
    if (!focusTopic) return undefined;
    return subjects.find((s) =>
      s.topics.some((t) => t.name === focusTopic || t.id === focusTopic),
    );
  }, [focusTopic]);

  const totalQuestions = useMemo(
    () => tests?.reduce((sum, t) => sum + (t.totalQuestions ?? 0), 0) ?? 0,
    [tests],
  );

  const bestSubject = useMemo(() => {
    if (!tests || tests.length === 0) return '—';
    const scores: Record<string, { total: number; count: number }> = {};
    for (const t of tests) {
      const pct = t.totalQuestions > 0 ? (t.score / t.totalQuestions) * 100 : 0;
      if (!scores[t.subject]) scores[t.subject] = { total: 0, count: 0 };
      scores[t.subject].total += pct;
      scores[t.subject].count += 1;
    }
    let best = '';
    let bestAvg = -1;
    for (const [subj, data] of Object.entries(scores)) {
      const avg = data.total / data.count;
      if (avg > bestAvg) { bestAvg = avg; best = subj; }
    }
    return subjects.find((s) => s.id === best)?.name ?? (best || '—');
  }, [tests]);

  /* ---------- callbacks ---------- */

  const { impact: haptic } = useHaptic();

  const handleCreateTest = useCallback(() => {
    router.push('/(tabs)/generate');
  }, [router]);

  const handleFlashcards = useCallback(() => {
    router.push('/(tabs)/library');
  }, [router]);

  const handleViewAllResults = useCallback(() => {
    router.push('/(app)/history');
  }, [router]);

  const handleTestPress = useCallback(
    (id: string) => {
      router.push({ pathname: '/(app)/test/results/[id]', params: { id } });
    },
    [router],
  );

  /* ---------- render ---------- */

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.appBackground, paddingTop: insets.top + SPACING.lg }}>
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.lg,
          paddingHorizontal: SPACING.screenH,
          paddingBottom: 100 + insets.bottom + SPACING.xl,
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={true}
        alwaysBounceVertical={false}
      >
        {/* ===== Greeting ===== */}
        <FadeInView delay={0} duration={300}>
        <Text
          style={[
            styles.greetingText,
            { color: colors.textPrimary, includeFontPadding: false },
          ]}
          numberOfLines={1}
        >
          {greeting}, {profile?.username ?? 'Student'}.
        </Text>
        </FadeInView>

        {/* ===== Exam countdown pill ===== */}
        {examCountdown.visible && (
          <View
            style={[
              styles.examPill,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Ionicons name="calendar" size={14} color={colors.primary} />
            <Text
              style={[
                styles.examPillText,
                { color: colors.primary, includeFontPadding: false },
              ]}
              numberOfLines={1}
            >
              {examCountdown.label}
            </Text>
          </View>
        )}

        {/* ===== TODAY'S FOCUS ===== */}
        <FadeInView delay={100} duration={300}>
        <View style={{ marginBottom: SPACING.lg }}>
          <SectionLabel>TODAY'S FOCUS</SectionLabel>
          <Pressable
            onPress={handleCreateTest}
            onPressIn={() => haptic()}
            style={({ pressed }) => [
              styles.banner,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.82 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <View style={styles.bannerIcon}>
              <Ionicons name="play" size={20} color={colors.textOnPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.bannerLabel, { includeFontPadding: false }]}
                numberOfLines={1}
              >
                CREATE NEW TEST
              </Text>
              <Text
                style={[
                  styles.bannerTitle,
                  { color: colors.textOnPrimary, includeFontPadding: false },
                ]}
                numberOfLines={1}
              >
                Generate a personalized practice test
              </Text>
            </View>
            <View style={styles.bannerButton}>
              <Text
                style={[
                  styles.bannerButtonText,
                  { color: colors.textOnPrimary, includeFontPadding: false },
                ]}
                numberOfLines={1}
              >
                Start
              </Text>
            </View>
          </Pressable>
        </View>
        </FadeInView>

        {/* ===== Accuracy card (full width) ===== */}
        <FadeInView delay={200} duration={300}>
        <View style={{ marginBottom: SPACING.sm }}>
          <AccuracyCard
            accuracyPct={stats?.averageScore ?? 0}
            totalQuestions={totalQuestions}
            totalTests={tests?.length ?? 0}
            bestSubject={bestSubject}
            colors={colors}
          />
        </View>
        </FadeInView>

        {/* ===== Streak + Today's Focus row ===== */}
        <FadeInView delay={250} duration={300}>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg }}>
          <StatCard
            label="STREAK"
            value={String(streak?.current_streak ?? 0)}
            unit="days"
            icon="flame"
            iconColor={colors.warning}
            colors={colors}
            style={{ flex: 1 }}
          />
          <StatCard
            label="TODAY'S FOCUS"
            icon="time"
            iconColor={colors.textMuted}
            focusTopic={focusTopic}
            focusSubjectColor={focusSubject?.color}
            colors={colors}
            style={{ flex: 1 }}
          />
        </View>
        </FadeInView>

        {/* ===== QUICK ACCESS ===== */}
        <FadeInView delay={300} duration={300}>
        <View style={{ marginBottom: SPACING.lg }}>
          <SectionLabel>QUICK ACCESS</SectionLabel>

          {/* Flashcards card — surface bg, single column full-width */}
          <Pressable
            onPress={handleFlashcards}
            onPressIn={() => haptic()}
            style={({ pressed }) => [
              styles.quickCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.82 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <View
              style={[
                styles.quickCardIcon,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons name="layers" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.quickCardTitle,
                  { color: colors.textPrimary, includeFontPadding: false },
                ]}
                numberOfLines={1}
              >
                Flashcards
              </Text>
              <Text
                style={[
                  styles.quickCardDesc,
                  { color: colors.textMuted, includeFontPadding: false },
                ]}
                numberOfLines={1}
              >
                Review and study your saved cards
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>

          {/* Create Test card — primary bg, single column full-width */}
          <Pressable
            onPress={handleCreateTest}
            onPressIn={() => haptic()}
            style={({ pressed }) => [
              styles.quickCard,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                marginTop: SPACING.sm,
                opacity: pressed ? 0.82 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <View style={styles.quickCardIconWhite}>
              <Ionicons name="add-circle" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.quickCardTitle,
                  { color: '#FFFFFF', includeFontPadding: false },
                ]}
                numberOfLines={1}
              >
                Create Test
              </Text>
              <Text
                style={[
                  styles.quickCardDesc,
                  { color: 'rgba(255,255,255,0.7)', includeFontPadding: false },
                ]}
                numberOfLines={1}
              >
                Generate a personalized practice test
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="rgba(255,255,255,0.7)"
            />
          </Pressable>
        </View>
        </FadeInView>

        {/* ===== PLAN PROGRESS WIDGET ===== */}
        {activePlan && (
          <FadeInView delay={350} duration={300}>
          <View style={{ marginBottom: SPACING.lg }}>
            <SectionLabel>STUDY PLAN</SectionLabel>
            <Pressable
              onPress={() => router.push('/(app)/plan/view')}
              onPressIn={() => haptic()}
              style={({ pressed }) => [
                styles.planWidget,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  ...SHADOWS.sm,
                },
              ]}
            >
              <View style={[styles.planWidgetAccent, { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.planWidgetSubject, { color: colors.primary }]} numberOfLines={1}>
                  {activePlan.subject}
                </Text>
                <Text style={[styles.planWidgetExam, { color: colors.textPrimary }]} numberOfLines={1}>
                  {activePlan.targetExam}
                </Text>
                <View style={{ marginTop: 8 }}>
                  <View style={[styles.planProgressTrack, { backgroundColor: colors.border }]}>
                    {(() => {
                      const total = planSessions.filter((s) => !s.isRestDay && s.sessionType !== 'rest').length;
                      const done = planSessions.filter((s) => s.status === 'completed').length;
                      const pct = total > 0 ? (done / total) * 100 : 0;
                      return (
                        <View style={[styles.planProgressFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
                      );
                    })()}
                  </View>
                  <Text style={[styles.planProgressLabel, { color: colors.textMuted }]}>
                    {planSessions.filter((s) => s.status === 'completed').length}/
                    {planSessions.filter((s) => !s.isRestDay && s.sessionType !== 'rest').length} sessions complete
                  </Text>
                </View>
              </View>
              <View style={styles.planWidgetCta}>
                <Text style={[styles.planWidgetCtaText, { color: colors.primary }]}>View Plan</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </View>
            </Pressable>
          </View>
          </FadeInView>
        )}

        {/* ===== RECENT PERFORMANCE ===== */}
        <FadeInView delay={400} duration={300}>
        <View style={{ marginBottom: SPACING.lg }}>
          <SectionLabel>RECENT PERFORMANCE</SectionLabel>
          <Card padding="none" shadow="md">
            {/* header */}
            <View style={styles.perfHeader}>
              <Text
                style={[
                  styles.perfTitle,
                  { color: colors.textPrimary, includeFontPadding: false },
                ]}
                numberOfLines={1}
              >
                Recent Performance
              </Text>
              <Pressable
                onPress={handleViewAllResults}
                onPressIn={() => haptic()}
                style={({ pressed }) => [
                  {
                    minHeight: 44,
                    justifyContent: 'center' as const,
                    opacity: pressed ? 0.82 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.perfLink,
                    { color: colors.primary, includeFontPadding: false },
                  ]}
                  numberOfLines={1}
                >
                  View All Results
                </Text>
              </Pressable>
            </View>

            {/* accuracy trend */}
            {recentTests.length > 0 && (
              <View style={styles.perfTrend}>
                <Text
                  style={[
                    styles.perfTrendText,
                    { color: colors.success, includeFontPadding: false },
                  ]}
                  numberOfLines={1}
                >
                  Accuracy up {stats?.averageScore ?? 0}% over your last{' '}
                  {recentTests.length} tests
                </Text>
              </View>
            )}

            {/* table header */}
            <View
              style={[styles.tableHeader, { borderTopColor: colors.border }]}
            >
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    flex: 2,
                    color: colors.textMuted,
                    includeFontPadding: false,
                  },
                ]}
                numberOfLines={1}
              >
                Test
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    flex: 1,
                    textAlign: 'center',
                    color: colors.textMuted,
                    includeFontPadding: false,
                  },
                ]}
                numberOfLines={1}
              >
                Date
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    flex: 1,
                    textAlign: 'center',
                    color: colors.textMuted,
                    includeFontPadding: false,
                  },
                ]}
                numberOfLines={1}
              >
                Score
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    flex: 1,
                    textAlign: 'right',
                    color: colors.textMuted,
                    includeFontPadding: false,
                  },
                ]}
                numberOfLines={1}
              >
                Status
              </Text>
            </View>

            {/* rows */}
            {recentTests.map((test, idx) => {
              const pct = Math.round(
                (test.score / test.totalQuestions) * 100,
              );
              const subjectName =
                subjects.find((s) => s.id === test.subject)?.name ??
                test.subject;

              return (
                <TestRow
                  key={test.id ?? idx}
                  topicLabel={test.topics?.[0] ?? subjectName}
                  subjectName={subjectName}
                  date={formatRelativeDate(test.completedAt)}
                  scoreLabel={`${test.score}/${test.totalQuestions}`}
                  pct={pct}
                  onPress={() => handleTestPress(test.id)}
                  colors={colors}
                />
              );
            })}

            {/* empty state */}
            {recentTests.length === 0 && (
              <View style={styles.emptyState}>
                <Text
                  style={[
                    styles.emptyText,
                    { color: colors.textMuted, includeFontPadding: false },
                  ]}
                >
                  No tests yet. Generate your first test!
                </Text>
              </View>
            )}
          </Card>
        </View>
        </FadeInView>
      </ScrollView>

      {/* Floating Action Button — New Test */}
      <Pressable
        onPress={handleCreateTest}
        onPressIn={() => haptic()}
        style={({ pressed }) => ({
          position: 'absolute',
          bottom: 24 + (insets.bottom || 0),
          right: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: colors.primary,
          borderRadius: RADIUS.full,
          paddingHorizontal: 20,
          paddingVertical: 14,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          ...SHADOWS.primary,
        })}
      >
        <Ionicons name="add" size={18} color="#FFFFFF" />
        <Text
          style={{
            fontFamily: FONTS.sansSemiBold,
            fontSize: FONT_SIZES.sm,
            color: '#FFFFFF',
            lineHeight: FONT_SIZES.sm * 1.5,
          }}
        >
          New Test
        </Text>
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  /* greeting */
  greetingText: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.displaySemiBold,
    lineHeight: FONT_SIZES.xxl * 1.2,
    letterSpacing: -0.3,
    marginBottom: SPACING.xl,
  },

  /* exam pill */
  examPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  examPillText: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.5,
    flexShrink: 1,
  },

  /* banner */
  banner: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    ...SHADOWS.primary,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 4,
  },
  bannerLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  bannerTitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansMedium,
    marginTop: 2,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  bannerButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  bannerButtonText: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.5,
  },

  /* accuracy card */
  accuracyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  accuracyDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  accuracyStats: {
    flex: 1,
    gap: 10,
  },
  accuracyStatItem: {
    gap: 2,
  },
  accuracyStatLabel: {
    fontSize: FONT_SIZES.xs - 1,
    fontFamily: FONTS.sansBold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  accuracyStatValue: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    includeFontPadding: false,
  },

  /* stats grid */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    flexGrow: 1,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: FONT_SIZES.xs * 1.5,
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.displaySemiBold,
    lineHeight: FONT_SIZES.xl * 1.2,
  },
  statUnit: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  statFocusText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansBold,
    marginBottom: SPACING.xs,
    lineHeight: FONT_SIZES.sm * 1.5,
  },

  /* accuracy ring */
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  /* quick actions — single column */
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    gap: SPACING.sm + 4,
    minHeight: 44,
    ...SHADOWS.sm,
  },
  quickCardIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardIconWhite: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardTitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  quickCardDesc: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    marginTop: 2,
    lineHeight: FONT_SIZES.xs * 1.6,
  },

  /* performance card */
  perfHeader: {
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  perfTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.sansBold,
    lineHeight: FONT_SIZES.md * 1.2,
    flex: 1,
  },
  perfLink: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansMedium,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  perfTrend: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  perfTrendText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    marginBottom: SPACING.sm + 4,
    lineHeight: FONT_SIZES.sm * 1.6,
  },

  /* table */
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
  },
  tableHeaderCell: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansMedium,
    lineHeight: FONT_SIZES.xs * 1.5,
  },

  /* test row */
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderTopWidth: 1,
    minHeight: 44,
  },
  testRowTopic: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansMedium,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  testRowSubject: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    marginTop: 2,
    lineHeight: FONT_SIZES.xs * 1.6,
  },
  testRowDate: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    textAlign: 'center',
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  testRowScore: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansBold,
    textAlign: 'center',
    lineHeight: FONT_SIZES.sm * 1.5,
  },

  /* plan widget */
  planWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.md,
    overflow: 'hidden',
  },
  planWidgetAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 0,
  },
  planWidgetSubject: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansSemiBold,
    letterSpacing: 0.5,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  planWidgetExam: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.4,
    marginTop: 2,
  },
  planProgressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  planProgressFill: {
    height: 4,
    borderRadius: 2,
  },
  planProgressLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  planWidgetCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  planWidgetCtaText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.sm * 1.5,
  },

  /* empty */
  emptyState: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.6,
  },
});
