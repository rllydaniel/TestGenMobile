import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useStudyPlan, usePlanSessions, useCompleteSession } from '@/hooks/usePlan';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';
import type { PlanSession, SessionType } from '@/types/plan';

const SESSION_TYPE_CONFIG: Record<
  SessionType,
  { label: string; icon: string; colorKey: string }
> = {
  study_guide: { label: 'Study Guide', icon: 'book', colorKey: 'sessionStudyGuide' },
  topic_review: { label: 'Topic Review', icon: 'refresh', colorKey: 'sessionTopicReview' },
  flashcards: { label: 'Flashcards', icon: 'layers', colorKey: 'sessionFlashcards' },
  practice_test: { label: 'Practice Test', icon: 'checkmark-circle', colorKey: 'sessionPracticeTest' },
  rest: { label: 'Rest Day', icon: 'moon', colorKey: 'sessionRest' },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatSessionDate(weekNum: number, dayNum: number) {
  return `Week ${weekNum} · Day ${dayNum}`;
}

// ─── Session Row ──────────────────────────────────────────────────────────────

interface SessionRowProps {
  session: PlanSession;
  colors: any;
  onComplete: (id: string) => void;
}

function SessionRow({ session, colors, onComplete }: SessionRowProps) {
  const config = SESSION_TYPE_CONFIG[session.sessionType] ?? SESSION_TYPE_CONFIG.topic_review;
  const typeColor = (colors as any)[config.colorKey] ?? colors.primary;
  const isCompleted = session.status === 'completed';
  const isRest = session.sessionType === 'rest' || session.isRestDay;

  if (isRest) {
    return (
      <View
        style={[
          styles.restRow,
          { borderColor: colors.border },
        ]}
      >
        <Ionicons name="moon" size={16} color={colors.textFaint} />
        <Text style={[styles.restText, { color: colors.textFaint }]}>
          {formatSessionDate(session.weekNumber, session.dayNumber)} — Rest Day
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.sessionRow,
        {
          backgroundColor: colors.surface,
          opacity: isCompleted ? 0.6 : 1,
          ...SHADOWS.sm,
        },
      ]}
    >
      {/* Checkbox */}
      <Pressable
        onPress={() => !isCompleted && onComplete(session.id)}
        style={[
          styles.checkbox,
          {
            borderColor: isCompleted ? typeColor : colors.border,
            backgroundColor: isCompleted ? typeColor : 'transparent',
          },
        ]}
        hitSlop={8}
      >
        {isCompleted && <Ionicons name="checkmark" size={12} color="#FFF" />}
      </Pressable>

      {/* Content */}
      <View style={styles.sessionContent}>
        <View style={styles.sessionTopRow}>
          <Text style={[styles.sessionDate, { color: colors.textFaint }]}>
            {formatSessionDate(session.weekNumber, session.dayNumber)}
          </Text>
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '1A' }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>{config.label}</Text>
          </View>
        </View>

        <Text
          style={[styles.sessionTopics, { color: colors.textPrimary, textDecorationLine: isCompleted ? 'line-through' : 'none' }]}
          numberOfLines={2}
        >
          {session.topics?.join(', ') ?? 'General review'}
        </Text>

        <Text style={[styles.sessionDuration, { color: colors.textMuted }]}>
          {session.durationMinutes} min
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PlanViewScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ planId?: string }>();

  const { data: plan, isLoading: planLoading } = useStudyPlan();
  const { data: sessions = [], isLoading: sessionsLoading } = usePlanSessions(
    params.planId ?? plan?.id ?? null,
  );
  const completeSession = useCompleteSession();

  const activePlan = plan;

  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  const totalCount = sessions.filter((s) => !s.isRestDay && s.sessionType !== 'rest').length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Group sessions by week
  const sections = useMemo(() => {
    const weekMap: Record<number, PlanSession[]> = {};
    sessions.forEach((s) => {
      if (!weekMap[s.weekNumber]) weekMap[s.weekNumber] = [];
      weekMap[s.weekNumber].push(s);
    });
    return Object.entries(weekMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([week, data]) => ({
        title: `Week ${week}`,
        weekNumber: Number(week),
        data,
      }));
  }, [sessions]);

  const handleComplete = useCallback(
    (id: string) => {
      completeSession.mutate(id);
    },
    [completeSession],
  );

  if (planLoading || sessionsLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.appBackground }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!activePlan) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.appBackground }]}>
        <Ionicons name="calendar-outline" size={48} color={colors.textFaint} />
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No active plan</Text>
        <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
          Complete the setup to generate your personalized study plan.
        </Text>
        <Pressable
          style={[styles.ctaBtn, { backgroundColor: colors.primary, ...SHADOWS.primary }]}
          onPress={() => router.push('/(app)/plan/setup')}
        >
          <Text style={[styles.ctaBtnText, { color: '#FFF' }]}>Create Study Plan</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingHorizontal: SPACING.screenH,
          paddingBottom: Math.max(insets.bottom, SPACING.xl),
        }}
        ListHeaderComponent={() => (
          <>
            {/* Header */}
            <View style={styles.pageHeader}>
              <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
              </Pressable>
              <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Study Plan</Text>
              <View style={{ width: 38 }} />
            </View>

            {/* Plan header card */}
            <View
              style={[
                styles.planCard,
                { backgroundColor: colors.primaryLight, borderLeftColor: colors.primary },
              ]}
            >
              <Text style={[styles.planSubject, { color: colors.primary }]}>
                {activePlan.subject}
              </Text>
              <Text style={[styles.planExam, { color: colors.textPrimary }]}>
                {activePlan.targetExam}
              </Text>
              {activePlan.targetDate && (
                <Text style={[styles.planDate, { color: colors.textMuted }]}>
                  Target: {new Date(activePlan.targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
              )}
            </View>

            {/* Progress card */}
            <View style={[styles.progressCard, { backgroundColor: colors.surface, ...SHADOWS.sm }]}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>Overall Progress</Text>
                <Text style={[styles.progressCount, { color: colors.primary }]}>
                  {completedCount}/{totalCount} sessions
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPct}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
              <Text style={[styles.progressPct, { color: colors.textMuted }]}>
                {Math.round(progressPct)}% complete
              </Text>
            </View>
          </>
        )}
        renderSectionHeader={({ section }) => (
          <View style={[styles.weekHeader, { backgroundColor: colors.appBackground }]}>
            <Text style={[styles.weekTitle, { color: colors.textPrimary }]}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <SessionRow session={item} colors={colors} onComplete={handleComplete} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        SectionSeparatorComponent={() => <View style={{ height: SPACING.xs }} />}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.screenH,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.displaySemiBold,
    includeFontPadding: false,
  },
  emptyDesc: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    textAlign: 'center',
    lineHeight: FONT_SIZES.base * 1.5,
  },
  ctaBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  ctaBtnText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
  },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  backBtn: { width: 38, height: 38, justifyContent: 'center' },
  pageTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.displaySemiBold,
    includeFontPadding: false,
  },

  // Plan card
  planCard: {
    borderRadius: RADIUS.xl,
    borderLeftWidth: 3,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  planSubject: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansSemiBold,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  planExam: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.displaySemiBold,
    includeFontPadding: false,
    lineHeight: FONT_SIZES.lg * 1.2,
  },
  planDate: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
    marginTop: 4,
  },

  // Progress card
  progressCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressTitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
  },
  progressCount: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansSemiBold,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressPct: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.xs * 1.5,
  },

  // Week header
  weekHeader: {
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  weekTitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },

  // Session row
  sessionRow: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  sessionContent: { flex: 1, gap: 4 },
  sessionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  sessionDate: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  typeBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  sessionTopics: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.4,
  },
  sessionDuration: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
  },

  // Rest row
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  restText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
});
