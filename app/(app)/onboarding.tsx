import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  FlatList,
  Pressable,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { subjects } from '@/lib/subjects';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 3;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const GOAL_PRESETS = [70, 80, 90, 95];

function getMotivationalText(score: number | null): string {
  if (!score) return 'Pick a target to stay motivated!';
  if (score >= 95) return 'Aiming for the top — you got this!';
  if (score >= 90) return 'An excellent goal. Consistency is key!';
  if (score >= 80) return 'A strong target — totally achievable!';
  return 'A solid starting point. Let\'s build from here!';
}

function getDaysUntil(month: number, day: number, year: number): number {
  const target = new Date(year, month, day);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// --- Progress Dots ---

function ProgressDots({ current, colors }: { current: number; colors: any }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === current ? colors.primary : colors.border,
              width: i === current ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

// --- Step 1: Subject Selection ---

function StepSubjects({
  selected,
  onToggle,
  colors,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  colors: any;
}) {
  const cardWidth = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md) / 2;

  const renderSubject = useCallback(
    ({ item }: { item: (typeof subjects)[number] }) => {
      const isSelected = selected.includes(item.id);
      return (
        <Pressable
          onPress={() => onToggle(item.id)}
          style={{ width: cardWidth, marginBottom: SPACING.md }}
        >
          <Card
            style={{
              alignItems: 'center' as const,
              paddingVertical: SPACING.lg,
              backgroundColor: isSelected ? colors.primaryLight : colors.surface,
              borderColor: isSelected ? colors.primary : colors.border,
            }}
          >
            <Text style={{ fontSize: FONT_SIZES.xxl, marginBottom: SPACING.sm }}>
              <Ionicons
                name={item.icon as any}
                size={28}
                color={isSelected ? colors.primary : item.color}
              />
            </Text>
            <Text
              style={{
                fontFamily: FONTS.sansMedium,
                fontSize: FONT_SIZES.sm + 1,
                color: isSelected ? colors.primary : colors.textPrimary,
                textAlign: 'center',
                lineHeight: (FONT_SIZES.sm + 1) * 1.5,
              }}
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </Card>
        </Pressable>
      );
    },
    [selected, onToggle, cardWidth, colors],
  );

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>What are you studying for?</Text>
      <Text style={[styles.subheading, { color: colors.textMuted }]}>
        Select your primary subject or exam
      </Text>
      {selected.length > 0 && (
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
          <Badge
            text={`${selected.length}/3 selected`}
            color={selected.length === 3 ? colors.warning : colors.primary}
          />
        </View>
      )}
      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id}
        renderItem={renderSubject}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}

// --- Step 2: Exam Date ---

function StepExamDate({
  month,
  day,
  year,
  noDate,
  onChangeMonth,
  onChangeDay,
  onChangeYear,
  onToggleNoDate,
  colors,
}: {
  month: number;
  day: number;
  year: number;
  noDate: boolean;
  onChangeMonth: (m: number) => void;
  onChangeDay: (d: number) => void;
  onChangeYear: (y: number) => void;
  onToggleNoDate: () => void;
  colors: any;
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];
  const maxDay = getDaysInMonth(month, year);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);
  const daysAway = noDate ? null : getDaysUntil(month, day, year);

  const renderPickerColumn = (
    label: string,
    items: { label: string; value: number }[],
    selectedValue: number,
    onSelect: (val: number) => void,
  ) => (
    <View style={styles.pickerColumn}>
      <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>{label}</Text>
      <ScrollView
        style={[styles.pickerScroll, { backgroundColor: colors.surface, borderColor: colors.border }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: SPACING.sm }}
      >
        {items.map((item) => {
          const isActive = item.value === selectedValue;
          return (
            <Pressable
              key={item.value}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
                onSelect(item.value);
              }}
              style={[
                styles.pickerItem,
                isActive && { backgroundColor: colors.primaryLight },
              ]}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  { color: colors.textMuted },
                  isActive && { fontFamily: FONTS.sansMedium, color: colors.primary },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>When's your exam?</Text>
      <Text style={[styles.subheading, { color: colors.textMuted }]}>
        We'll build a study plan around your timeline
      </Text>

      {/* No date toggle */}
      <Pressable
        onPress={onToggleNoDate}
        style={[
          styles.noDateRow,
          { borderColor: colors.border, backgroundColor: colors.surface },
          noDate && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
        ]}
      >
        <Ionicons
          name={noDate ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={noDate ? colors.primary : colors.textFaint}
        />
        <Text
          style={{
            fontFamily: FONTS.sansMedium,
            fontSize: FONT_SIZES.base,
            color: noDate ? colors.primary : colors.textMuted,
            marginLeft: SPACING.sm,
            lineHeight: FONT_SIZES.base * 1.5,
          }}
        >
          No date set
        </Text>
      </Pressable>

      {!noDate && (
        <>
          <View style={styles.pickerRow}>
            {renderPickerColumn(
              'Month',
              MONTHS.map((m, i) => ({ label: m.slice(0, 3), value: i })),
              month,
              onChangeMonth,
            )}
            {renderPickerColumn(
              'Day',
              days.map((d) => ({ label: String(d), value: d })),
              day > maxDay ? maxDay : day,
              onChangeDay,
            )}
            {renderPickerColumn(
              'Year',
              years.map((y) => ({ label: String(y), value: y })),
              year,
              onChangeYear,
            )}
          </View>

          {daysAway !== null && (
            <View style={[styles.countdownBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={[styles.countdownText, { color: colors.primary }]}>
                {daysAway === 0
                  ? "That's today!"
                  : `${daysAway} day${daysAway === 1 ? '' : 's'} away`}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// --- Step 3: Goal Score ---

function StepGoal({
  goalScore,
  onSetGoal,
  colors,
}: {
  goalScore: number | null;
  onSetGoal: (score: number | null) => void;
  colors: any;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>What's your target score?</Text>
      <Text style={[styles.subheading, { color: colors.textMuted }]}>
        We'll track your progress toward this goal
      </Text>

      <View style={styles.goalGrid}>
        {GOAL_PRESETS.map((preset) => {
          const isSelected = goalScore === preset;
          return (
            <Pressable
              key={preset}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onSetGoal(isSelected ? null : preset);
              }}
              style={[
                styles.goalCard,
                {
                  backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.goalCardPercent,
                  { color: isSelected ? colors.primary : colors.textPrimary },
                ]}
              >
                {preset}%
              </Text>
              <Text
                style={[
                  styles.goalCardLabel,
                  { color: isSelected ? colors.primary : colors.textMuted },
                ]}
              >
                {preset >= 95
                  ? 'Top Tier'
                  : preset >= 90
                    ? 'Excellent'
                    : preset >= 80
                      ? 'Strong'
                      : 'Solid'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Custom input */}
      <View style={{ marginTop: SPACING.lg }}>
        <Input
          label="Or enter a custom target"
          placeholder="e.g. 85"
          keyboardType="numeric"
          value={
            goalScore && !GOAL_PRESETS.includes(goalScore)
              ? String(goalScore)
              : ''
          }
          onChangeText={(text) => {
            const num = parseInt(text, 10);
            if (!text) {
              onSetGoal(null);
            } else if (!isNaN(num) && num >= 1 && num <= 100) {
              onSetGoal(num);
            }
          }}
          icon={
            <Ionicons name="trophy-outline" size={18} color={colors.textFaint} />
          }
        />
      </View>

      {/* Motivational text */}
      <View style={[styles.motivationRow, { backgroundColor: colors.primaryLight }]}>
        <Ionicons
          name="sparkles"
          size={18}
          color={colors.primary}
        />
        <Text style={[styles.motivationText, { color: colors.textMuted }]}>
          {getMotivationalText(goalScore)}
        </Text>
      </View>
    </View>
  );
}

// --- Main Onboarding Screen ---

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Exam date state
  const now = new Date();
  const [examMonth, setExamMonth] = useState(now.getMonth());
  const [examDay, setExamDay] = useState(now.getDate());
  const [examYear, setExamYear] = useState(now.getFullYear());
  const [noExamDate, setNoExamDate] = useState(false);

  // Goal
  const [goalScore, setGoalScore] = useState<number | null>(null);

  const toggleSubject = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedSubjects((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      flatListRef.current?.scrollToOffset({
        offset: step * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentStep(step);
    },
    [],
  );

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      goToStep(currentStep + 1);
    } else {
      // Get Started
      router.replace('/(tabs)');
    }
  }, [currentStep, goToStep, router]);

  const handleSkip = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      goToStep(currentStep + 1);
    } else {
      router.replace('/(tabs)');
    }
  }, [currentStep, goToStep, router]);

  const handleChangeMonth = useCallback(
    (m: number) => {
      setExamMonth(m);
      const maxDay = getDaysInMonth(m, examYear);
      setExamDay((prev) => Math.min(prev, maxDay));
    },
    [examYear],
  );

  const handleChangeYear = useCallback(
    (y: number) => {
      setExamYear(y);
      const maxDay = getDaysInMonth(examMonth, y);
      setExamDay((prev) => Math.min(prev, maxDay));
    },
    [examMonth],
  );

  const steps = useMemo(
    () => [
      { key: 'subjects' },
      { key: 'date' },
      { key: 'goal' },
    ],
    [],
  );

  const renderStep = useCallback(
    ({ item }: { item: { key: string } }) => {
      return (
        <View style={{ width: SCREEN_WIDTH }}>
          {item.key === 'subjects' && (
            <StepSubjects
              selected={selectedSubjects}
              onToggle={toggleSubject}
              colors={colors}
            />
          )}
          {item.key === 'date' && (
            <StepExamDate
              month={examMonth}
              day={examDay}
              year={examYear}
              noDate={noExamDate}
              onChangeMonth={handleChangeMonth}
              onChangeDay={setExamDay}
              onChangeYear={handleChangeYear}
              onToggleNoDate={() => setNoExamDate((p) => !p)}
              colors={colors}
            />
          )}
          {item.key === 'goal' && (
            <StepGoal goalScore={goalScore} onSetGoal={setGoalScore} colors={colors} />
          )}
        </View>
      );
    },
    [
      selectedSubjects,
      toggleSubject,
      examMonth,
      examDay,
      examYear,
      noExamDate,
      handleChangeMonth,
      handleChangeYear,
      goalScore,
      colors,
    ],
  );

  const onMomentumScrollEnd = useCallback(
    (e: any) => {
      const newStep = Math.round(
        e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
      );
      if (newStep !== currentStep) {
        setCurrentStep(newStep);
      }
    },
    [currentStep],
  );

  const isNextDisabled = currentStep === 0 && selectedSubjects.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground, paddingTop: insets.top }]}>
      {/* Progress dots */}
      <ProgressDots current={currentStep} colors={colors} />

      {/* Step pages */}
      <Animated.FlatList
        ref={flatListRef}
        data={steps}
        keyExtractor={(item) => item.key}
        renderItem={renderStep}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={{ flex: 1 }}
      />

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { borderTopColor: colors.border, paddingBottom: insets.bottom + SPACING.sm }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
        </Pressable>

        <Button
          label={currentStep === TOTAL_STEPS - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          size="lg"
          disabled={isNextDisabled}
          icon={
            currentStep === TOTAL_STEPS - 1 ? (
              <Ionicons name="rocket-outline" size={18} color={colors.textOnPrimary} />
            ) : (
              <Ionicons name="arrow-forward" size={18} color={colors.textOnPrimary} />
            )
          }
          style={{ flex: 1, marginLeft: SPACING.md }}
        />
      </View>
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Dots */
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  /* Steps shared */
  stepContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  heading: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xxl,
    marginBottom: SPACING.sm,
    lineHeight: FONT_SIZES.xxl * 1.2,
  },
  subheading: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    marginBottom: SPACING.lg,
    lineHeight: FONT_SIZES.base * 1.6,
  },

  /* Date picker */
  noDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    minHeight: 44,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    textAlign: 'center',
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  pickerScroll: {
    height: 240,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    marginHorizontal: SPACING.xs,
    marginVertical: 2,
    minHeight: 44,
    justifyContent: 'center',
  },
  pickerItemText: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    alignSelf: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  countdownText: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
  },

  /* Goal */
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  goalCard: {
    width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md) / 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    minHeight: 44,
  },
  goalCardPercent: {
    fontFamily: FONTS.displayBold,
    fontSize: 32,
    marginBottom: SPACING.xs,
    lineHeight: 32 * 1.2,
  },
  goalCardLabel: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  motivationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  motivationText: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm + 1,
    flex: 1,
    lineHeight: (FONT_SIZES.sm + 1) * 1.6,
  },

  /* Bottom */
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
  },
  skipButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  skipText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
  },
});
