import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SESSION_TIMES = [15, 30, 45, 60, 90];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const POPULAR_EXAMS = [
  'SAT', 'ACT', 'AP Calculus AB', 'AP Calculus BC', 'AP Biology',
  'AP Chemistry', 'AP Physics 1', 'AP US History', 'AP World History',
  'AP English Language', 'AP English Literature', 'AP Psychology',
  'AP Statistics', 'AP Computer Science A', 'GRE', 'GMAT', 'MCAT', 'LSAT',
];

export default function PlanSetupScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [subject, setSubject] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [targetDay, setTargetDay] = useState('');
  const [targetYear, setTargetYear] = useState(String(new Date().getFullYear() + 1));
  const [availableDays, setAvailableDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [minutesPerSession, setMinutesPerSession] = useState(30);
  const [goalScore, setGoalScore] = useState('');

  const filtered = subject.length > 0
    ? POPULAR_EXAMS.filter((e) => e.toLowerCase().includes(subject.toLowerCase()))
    : POPULAR_EXAMS;

  const toggleDay = (day: number) => {
    const next = new Set(availableDays);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    setAvailableDays(next);
  };

  const isValid =
    subject.trim().length > 0 &&
    selectedMonth !== null &&
    targetDay.length > 0 &&
    targetYear.length === 4 &&
    availableDays.size > 0;

  const handleContinue = () => {
    if (!isValid) return;
    const day = Math.min(Math.max(parseInt(targetDay, 10), 1), 31);
    const year = parseInt(targetYear, 10);
    const date = new Date(year, selectedMonth!, day);
    const targetDate = date.toISOString().split('T')[0];

    router.push({
      pathname: '/(app)/plan/diagnostic',
      params: {
        subject: subject.trim(),
        targetExam: subject.trim(),
        targetDate,
        availableDays: JSON.stringify(Array.from(availableDays)),
        minutesPerSession: String(minutesPerSession),
        goalScore: goalScore.trim(),
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.appBackground, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.progressDots}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <View style={[styles.dotLine, { backgroundColor: colors.border }]} />
            <View style={[styles.dot, { backgroundColor: colors.border }]} />
            <View style={[styles.dotLine, { backgroundColor: colors.border }]} />
            <View style={[styles.dot, { backgroundColor: colors.border }]} />
          </View>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Set up your study plan</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Tell us about your exam goal so we can tailor your plan.
          </Text>

          {/* Exam / Subject */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Exam or Subject</Text>
            <View style={{ zIndex: 100 }}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    borderColor: showSuggestions ? colors.primary : colors.border,
                  },
                ]}
                placeholder="e.g. SAT, AP Biology, GRE…"
                placeholderTextColor={colors.textFaint}
                value={subject}
                onChangeText={setSubject}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                returnKeyType="done"
              />
              {showSuggestions && filtered.length > 0 && (
                <View
                  style={[
                    styles.suggestions,
                    { backgroundColor: colors.surface, borderColor: colors.border, ...SHADOWS.md },
                  ]}
                >
                  {filtered.slice(0, 5).map((exam) => (
                    <Pressable
                      key={exam}
                      style={({ pressed }) => [
                        styles.suggestionItem,
                        { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
                      ]}
                      onPress={() => {
                        setSubject(exam);
                        setShowSuggestions(false);
                      }}
                    >
                      <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>{exam}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Target date */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Exam Date</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.monthScroll}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              {MONTHS.map((m, i) => {
                const active = selectedMonth === i;
                return (
                  <Pressable
                    key={m}
                    style={[
                      styles.monthPill,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedMonth(i)}
                  >
                    <Text style={[styles.monthText, { color: active ? '#FFF' : colors.textMuted }]}>{m}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.dateRow}>
              <TextInput
                style={[
                  styles.dateInput,
                  { flex: 1, backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
                ]}
                placeholder="Day"
                placeholderTextColor={colors.textFaint}
                value={targetDay}
                onChangeText={(t) => setTargetDay(t.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
              />
              <TextInput
                style={[
                  styles.dateInput,
                  { flex: 2, backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
                ]}
                placeholder="Year"
                placeholderTextColor={colors.textFaint}
                value={targetYear}
                onChangeText={(t) => setTargetYear(t.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
          </View>

          {/* Available days */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Available Days</Text>
            <View style={styles.dayPills}>
              {DAY_LABELS.map((d, i) => {
                const active = availableDays.has(i);
                return (
                  <Pressable
                    key={d}
                    style={[
                      styles.dayPill,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => toggleDay(i)}
                  >
                    <Text style={[styles.dayText, { color: active ? '#FFF' : colors.textMuted }]}>{d}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Session duration */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Time per Session</Text>
            <View style={styles.timePills}>
              {SESSION_TIMES.map((t) => {
                const active = minutesPerSession === t;
                return (
                  <Pressable
                    key={t}
                    style={[
                      styles.timePill,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setMinutesPerSession(t)}
                  >
                    <Text style={[styles.timeText, { color: active ? '#FFF' : colors.textMuted }]}>{t}m</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Goal score */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              Goal Score{' '}
              <Text style={{ color: colors.textFaint, fontFamily: FONTS.sansRegular }}>(optional)</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder="e.g. 1400 for SAT, 5 for AP exam"
              placeholderTextColor={colors.textFaint}
              value={goalScore}
              onChangeText={setGoalScore}
              keyboardType="number-pad"
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* CTA */}
        <View
          style={[
            styles.cta,
            {
              paddingBottom: Math.max(insets.bottom, SPACING.lg),
              backgroundColor: colors.appBackground,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Pressable
            style={[
              styles.ctaBtn,
              {
                backgroundColor: isValid ? colors.primary : colors.border,
                ...(isValid ? SHADOWS.primary : {}),
              },
            ]}
            onPress={handleContinue}
            disabled={!isValid}
          >
            <Text style={[styles.ctaBtnText, { color: '#FFF' }]}>Continue to Diagnostic →</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenH,
    paddingVertical: SPACING.md,
  },
  backBtn: { width: 38, height: 38, justifyContent: 'center' },
  progressDots: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotLine: { width: 28, height: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.screenH, paddingTop: SPACING.md },
  heading: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.displaySemiBold,
    includeFontPadding: false,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.base * 1.5,
    marginBottom: SPACING.xl,
  },
  fieldGroup: { marginBottom: SPACING.xl },
  label: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.sm * 1.5,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 200,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
  },
  monthScroll: { marginBottom: SPACING.sm },
  monthPill: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    marginRight: SPACING.xs,
  },
  monthText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansSemiBold,
  },
  dateRow: { flexDirection: 'row', gap: SPACING.sm },
  dateInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
  },
  dayPills: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  dayPill: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    minWidth: 52,
    alignItems: 'center',
  },
  dayText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansSemiBold,
  },
  timePills: { flexDirection: 'row', gap: SPACING.xs },
  timePill: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingVertical: 10,
    flex: 1,
    alignItems: 'center',
  },
  timeText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansSemiBold,
  },
  cta: {
    paddingHorizontal: SPACING.screenH,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  ctaBtnText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },
});
