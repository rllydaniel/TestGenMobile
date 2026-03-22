import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { FadeInView } from '@/components/ui/FadeInView';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SectionLabel } from '@/components/ui/Label';
import { AccuracyRing } from '@/components/ui/AccuracyRing';
import { useDashboardStats, useStreak } from '@/hooks/useStats';
import { useProfile } from '@/hooks/useProfile';
import { useTestHistory } from '@/hooks/useTests';
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
}) {
  return (
    <Card style={styles.statCard} shadow="md" padding="sm">
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
            size={72}
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

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
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
  const { data: stats } = useDashboardStats();
  const { data: streak } = useStreak();
  const { data: profile } = useProfile();
  const { data: tests } = useTestHistory();

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

  /* ---------- callbacks ---------- */

  const haptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleCreateTest = useCallback(() => {
    router.push('/(tabs)/generate');
  }, [router]);

  const handleFlashcards = useCallback(() => {
    router.push('/(tabs)/study');
  }, [router]);

  const handleViewAllResults = useCallback(() => {
    router.push('/(tabs)/history');
  }, [router]);

  const handleTestPress = useCallback(
    (id: string) => {
      router.push({ pathname: '/(app)/test/results/[id]', params: { id } });
    },
    [router],
  );

  /* ---------- render ---------- */

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.lg,
          paddingHorizontal: SPACING.screenH,
          paddingBottom: 80 + insets.bottom + SPACING.xl,
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
            onPressIn={haptic}
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

        {/* ===== Stats 2x2 grid ===== */}
        <FadeInView delay={200} duration={300}>
        <View style={{ marginBottom: SPACING.lg }}>
          <View style={styles.statsGrid}>
            <StatCard
              label="STREAK"
              value={String(streak?.current_streak ?? 0)}
              unit="days"
              icon="flame"
              iconColor={colors.warning}
              colors={colors}
            />
            <StatCard
              label="TESTS TAKEN"
              value={String(stats?.testsCompleted ?? 0)}
              unit="total"
              icon="bar-chart"
              iconColor={colors.primary}
              colors={colors}
            />
            <StatCard
              label="ACCURACY"
              value={`${stats?.averageScore ?? 0}%`}
              icon="pie-chart"
              iconColor={colors.primary}
              isAccuracy
              accuracyPct={stats?.averageScore ?? 0}
              colors={colors}
            />
            <StatCard
              label="TODAY'S FOCUS"
              icon="time"
              iconColor={colors.textMuted}
              focusTopic={focusTopic}
              focusSubjectColor={focusSubject?.color}
              colors={colors}
            />
          </View>
        </View>
        </FadeInView>

        {/* ===== QUICK ACCESS ===== */}
        <FadeInView delay={300} duration={300}>
        <View style={{ marginBottom: SPACING.lg }}>
          <SectionLabel>QUICK ACCESS</SectionLabel>

          {/* Flashcards card — surface bg, single column full-width */}
          <Pressable
            onPress={handleFlashcards}
            onPressIn={haptic}
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
            onPressIn={haptic}
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
                onPressIn={haptic}
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

  /* stats grid */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    width: '48.5%' as any,
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
