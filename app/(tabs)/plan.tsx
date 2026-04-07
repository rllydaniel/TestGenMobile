import React from 'react';
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
import { useStudyPlan } from '@/hooks/usePlan';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

const PREMIUM_FEATURES = [
  'AI-powered diagnostic test to find your weak spots',
  'Personalized day-by-day study schedule',
  'Automatic flashcard deck generation',
  'Progress tracking toward your target score',
  'Adaptive plan that adjusts as you improve',
];

export default function PlanScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: plan, isLoading } = useStudyPlan();

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.lg,
          paddingHorizontal: SPACING.screenH,
          paddingBottom: 80 + insets.bottom + SPACING.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? null : plan ? (
          /* Active plan view */
          <ActivePlanCard plan={plan} />
        ) : (
          /* No plan — premium gate */
          <FadeInView delay={100} duration={350}>
            <Text style={[styles.lockHeading, { color: colors.textPrimary }]}>
              Build Your Study Plan
            </Text>
            <Text style={[styles.lockDesc, { color: colors.textMuted }]}>
              Take a diagnostic test and get a personalized schedule tailored to your goals and exam date.
            </Text>

            {/* Feature list */}
            <View style={styles.featureList}>
              {PREMIUM_FEATURES.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  <Text style={[styles.featureText, { color: colors.textMuted }]}>{feature}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => router.push('/(app)/plan/setup')}
              style={({ pressed }) => [
                styles.ctaButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1, ...SHADOWS.primary },
              ]}
            >
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              <Text style={[styles.ctaText, { color: '#FFFFFF' }]}>Get Started</Text>
            </Pressable>
          </FadeInView>
        )}
      </ScrollView>
    </View>
  );
}

function ActivePlanCard({ plan }: { plan: any }) {
  const { colors } = useTheme();
  const router = useRouter();
  const planData = plan.plan_data ?? {};
  const total = planData.totalSessions ?? 0;
  const completed = planData.completedSessions ?? 0;
  const progress = total > 0 ? completed / total : 0;
  const daysUntil = plan.target_date
    ? Math.max(0, Math.ceil((new Date(plan.target_date).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <FadeInView delay={100} duration={350}>
      {/* Plan overview card */}
      <View
        style={[
          styles.planCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.primary + '40',
            borderLeftColor: colors.primary,
          },
        ]}
      >
        <View style={styles.planCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.planSubject, { color: colors.textPrimary }]}>{plan.subject}</Text>
            {plan.target_exam ? (
              <Text style={[styles.planExam, { color: colors.textMuted }]}>{plan.target_exam}</Text>
            ) : null}
          </View>
          {daysUntil !== null && (
            <View style={[styles.daysPill, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="calendar-outline" size={13} color={colors.primary} />
              <Text style={[styles.daysText, { color: colors.primary }]}>{daysUntil}d left</Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        <View style={{ marginTop: SPACING.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={[styles.progressLabel, { color: colors.textMuted }]}>Progress</Text>
            <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
              {completed}/{total} sessions
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${Math.round(progress * 100)}%` as any },
              ]}
            />
          </View>
        </View>

        <Pressable
          onPress={() => router.push({ pathname: '/(app)/plan/view', params: { id: plan.id } })}
          style={({ pressed }) => [
            styles.viewPlanBtn,
            { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.viewPlanText, { color: colors.primary }]}>View Full Plan</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </Pressable>
      </View>

      {/* Start next session CTA */}
      <Pressable
        onPress={() => router.push('/(tabs)/generate')}
        style={({ pressed }) => [
          styles.nextSessionBtn,
          {
            backgroundColor: colors.primary,
            opacity: pressed ? 0.88 : 1,
            ...SHADOWS.primary,
          },
        ]}
      >
        <View>
          <Text style={[styles.nextSessionLabel, { color: 'rgba(255,255,255,0.7)' }]}>Up next</Text>
          <Text style={[styles.nextSessionTitle, { color: '#FFFFFF' }]}>Start Today's Session</Text>
        </View>
        <Ionicons name="play-circle" size={32} color="#FFFFFF" />
      </Pressable>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.displaySemiBold,
    lineHeight: FONT_SIZES.xxl * 1.2,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
    lineHeight: FONT_SIZES.sm * 1.6,
  },
  lockHeading: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.displaySemiBold,
    marginBottom: SPACING.md,
    marginTop: SPACING.xl,
    includeFontPadding: false,
    lineHeight: FONT_SIZES.xxl * 1.2,
  },
  lockDesc: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.base * 1.6,
    marginBottom: SPACING.xl,
  },
  featureList: {
    width: '100%',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  featureText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.6,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    paddingHorizontal: SPACING.xl,
    width: '100%',
    minHeight: 54,
  },
  ctaText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  /* active plan */
  planCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  planSubject: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.displaySemiBold,
    includeFontPadding: false,
  },
  planExam: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    marginTop: 2,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  daysPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  daysText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  progressLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  viewPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingVertical: 10,
    minHeight: 44,
  },
  viewPlanText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  nextSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    minHeight: 72,
  },
  nextSessionLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.xs * 1.5,
    marginBottom: 2,
  },
  nextSessionTitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },
});
