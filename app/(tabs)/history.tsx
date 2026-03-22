import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInView } from '@/components/ui/FadeInView';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { TestHistorySkeleton } from '@/components/ui/Skeleton';
import { SectionLabel } from '@/components/ui/Label';
import { useTestHistory } from '@/hooks/useTests';
import { subjects } from '@/lib/subjects';
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

export default function HistoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: tests, isLoading } = useTestHistory();
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.appBackground, paddingTop: insets.top + SPACING.lg, paddingHorizontal: SPACING.screenH }}>
        <Text style={{ fontSize: FONT_SIZES.xxl, fontFamily: FONTS.displaySemiBold, color: colors.textPrimary, marginBottom: SPACING.lg, includeFontPadding: false }}>
          Test History
        </Text>
        <TestHistorySkeleton />
      </View>
    );
  }

  const filteredTests = (tests ?? []).filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const subjectName =
      subjects.find((s) => s.id === t.subject)?.name ?? t.subject;
    return (
      subjectName.toLowerCase().includes(q) ||
      t.topics?.some((topic: string) => topic.toLowerCase().includes(q))
    );
  });

  const totalTests = tests?.length ?? 0;
  const avgScore =
    totalTests > 0
      ? Math.round(
          tests!.reduce(
            (sum, t) => sum + (t.score / t.totalQuestions) * 100,
            0,
          ) / totalTests,
        )
      : 0;
  const bestScore =
    totalTests > 0
      ? Math.round(
          Math.max(...tests!.map((t) => (t.score / t.totalQuestions) * 100)),
        )
      : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <View style={{ flex: 1 }}>
        {/* Fixed header area */}
        <View
          style={{
            paddingTop: insets.top + SPACING.lg,
            paddingHorizontal: SPACING.screenH,
            paddingBottom: 0,
          }}
        >
          <FadeInView delay={0} duration={300}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Test History</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Your past tests and performance over time
            </Text>
          </FadeInView>

          {/* Stat cards */}
          <FadeInView delay={100} duration={300}>
            <View style={styles.statRow}>
              {[
                {
                  icon: 'book' as const,
                  color: colors.primary,
                  value: totalTests,
                  label: 'Tests Taken',
                },
                {
                  icon: 'trending-up' as const,
                  color: colors.warning,
                  value: `${avgScore}%`,
                  label: 'Avg Score',
                },
                {
                  icon: 'trophy' as const,
                  color: colors.warning,
                  value: `${bestScore}%`,
                  label: 'Best Score',
                },
              ].map((stat) => (
                <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons
                    name={stat.icon}
                    size={20}
                    color={stat.color}
                    style={{ marginBottom: 6 }}
                  />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          <FadeInView delay={200} duration={300}>
            <Input
              placeholder="Search by topic or subject..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              icon={
                <Ionicons name="search" size={18} color={colors.textMuted} />
              }
            />

            <Text style={[styles.showingText, { color: colors.textMuted }]}>
              Showing {filteredTests.length} of {totalTests} Tests
            </Text>
          </FadeInView>
        </View>

        {/* Test list */}
        {filteredTests.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No tests yet"
            description="Generate your first test to see your history here."
            actionTitle="Generate Test"
            onAction={() => router.push('/(tabs)/generate')}
          />
        ) : (
          <FlatList
            data={filteredTests}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SPACING.screenH,
              paddingBottom: 80 + insets.bottom + SPACING.xl,
              gap: 10,
            }}
            renderItem={({ item }) => {
              const pct = Math.round(
                (item.score / item.totalQuestions) * 100,
              );
              const scoreColor = getScoreColor(pct);
              const subjectName =
                subjects.find((s) => s.id === item.subject)?.name ??
                item.subject;

              return (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/test/results/[id]',
                      params: { id: item.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.testCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderLeftColor: scoreColor,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View style={styles.testCardInner}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={[styles.testTopic, { color: colors.textPrimary }]}>
                        {item.topics?.[0] ?? subjectName}
                      </Text>
                      <Text style={[styles.testSubject, { color: colors.textMuted }]}>{subjectName}</Text>
                      <View style={styles.badgeRow}>
                        <Badge text="MCQ" color={colors.textMuted} />
                        <Badge
                          text={item.difficulty ?? 'random'}
                          color={colors.textMuted}
                        />
                        <Badge
                          text={`${item.timeTaken ?? '\u2014'}s`}
                          color={colors.textMuted}
                        />
                      </View>
                      <View style={styles.dateRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color={colors.textFaint}
                        />
                        <Text style={[styles.dateText, { color: colors.textFaint }]}>
                          {formatRelativeDate(item.completedAt)}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.scoreText, { color: scoreColor }]}>
                        {pct}%
                      </Text>
                      <Text style={[styles.scoreDetail, { color: colors.textMuted }]}>
                        {item.score}/{item.totalQuestions}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.displaySemiBold,
    lineHeight: FONT_SIZES.xxl * 1.2,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.md,
    lineHeight: FONT_SIZES.sm * 1.6,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.displaySemiBold,
    lineHeight: FONT_SIZES.xl * 1.2,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  showingText: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    marginTop: 12,
    marginBottom: SPACING.sm,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  testCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    minHeight: 44,
    ...SHADOWS.sm,
  },
  testCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  testTopic: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  testSubject: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    marginTop: 2,
    lineHeight: FONT_SIZES.sm * 1.6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: SPACING.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  dateText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  scoreText: {
    fontSize: FONT_SIZES.xl + 2,
    fontFamily: FONTS.displaySemiBold,
    lineHeight: (FONT_SIZES.xl + 2) * 1.2,
  },
  scoreDetail: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
});
