import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptic } from '@/hooks/useHaptic';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';
import { generateTest, resolveQuestionTypes, QuestionTypeOption } from '@/lib/api/generateTest';
import { TopicSelector } from '@/components/ui/TopicSelector';
import { QuestionCountSlider } from '@/components/ui/QuestionCountSlider';
import { subjects } from '@/lib/subjects';

type Difficulty = 'easy' | 'mixed' | 'hard';

const TIME_PRESETS = [5, 10, 15, 30];

const DIFFICULTY_OPTIONS: { key: Difficulty; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'easy', label: 'Easy', icon: 'sunny-outline' },
  { key: 'mixed', label: 'Mixed', icon: 'partly-sunny-outline' },
  { key: 'hard', label: 'Hard', icon: 'thunderstorm-outline' },
];

const QUESTION_TYPE_OPTIONS: { key: QuestionTypeOption; label: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'multiple-choice', label: 'Multiple Choice', desc: 'Pick the correct answer from options', icon: 'list-outline' },
  { key: 'short-response', label: 'Short Response', desc: 'Write your own answer', icon: 'create-outline' },
  { key: 'mixed', label: 'Mixed', desc: 'A combination of both types', icon: 'shuffle-outline' },
];

export default function ConfigScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { subject: subjectParam } = useLocalSearchParams<{ subject: string }>();
  const { colors } = useTheme();
  const { impact } = useHaptic();

  const [customSubject, setCustomSubject] = useState(subjectParam ?? '');
  const isCustom = !subjectParam;

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(20);
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
  const [questionType, setQuestionType] = useState<QuestionTypeOption>('multiple-choice');
  const [timedMode, setTimedMode] = useState(false);
  const [timeLimit, setTimeLimit] = useState(15);
  const [focusMode, setFocusMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const resolvedSubject = isCustom ? customSubject.trim() : (subjectParam ?? '');

  // Get available topics for the selected subject
  const availableTopics = useMemo(() => {
    if (!subjectParam) return [];
    const subj = subjects.find((s) => s.id === subjectParam || s.name === subjectParam);
    return subj?.topics.map((t) => t.name) ?? [];
  }, [subjectParam]);

  // Summary pills data
  const summaryPills = useMemo(() => {
    const pills: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [];
    pills.push({ label: `${questionCount} questions`, icon: 'help-circle-outline' });
    pills.push({ label: difficulty.charAt(0).toUpperCase() + difficulty.slice(1), icon: 'speedometer-outline' });
    pills.push({
      label: QUESTION_TYPE_OPTIONS.find((o) => o.key === questionType)?.label ?? 'Multiple Choice',
      icon: 'document-text-outline',
    });
    if (timedMode) pills.push({ label: `${timeLimit} min`, icon: 'timer-outline' });
    if (selectedTopics.length > 0) pills.push({ label: `${selectedTopics.length} topics`, icon: 'pricetags-outline' });
    return pills;
  }, [questionCount, difficulty, questionType, timedMode, timeLimit, selectedTopics]);

  const handleGenerate = useCallback(async () => {
    if (!resolvedSubject) {
      Alert.alert('Subject Required', 'Please enter a subject to generate a test.');
      return;
    }

    impact();
    setLoading(true);

    try {
      const result = await generateTest({
        subject: resolvedSubject,
        questionCount,
        difficulty,
        questionTypes: resolveQuestionTypes(questionType),
        timeLimit: timedMode ? timeLimit * 60 : null,
        studyMode: false,
        focusMode,
        topics: selectedTopics.length > 0 ? selectedTopics : undefined,
      });

      if (result.sessionId) {
        router.push({
          pathname: '/(app)/test/[id]',
          params: { id: result.sessionId },
        });
      }
    } catch (err: any) {
      Alert.alert('Generation Failed', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [resolvedSubject, questionCount, difficulty, questionType, timedMode, timeLimit, selectedTopics, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + SPACING.screenV,
            paddingBottom: insets.bottom + 160,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              impact();
              router.back();
            }}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.82 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Configure Test
          </Text>
          {!isCustom && (
            <Text
              style={[styles.subtitle, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {resolvedSubject}
            </Text>
          )}
        </View>

        {/* Custom subject input */}
        {isCustom && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              SUBJECT
            </Text>
            <View
              style={[
                styles.textInputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="create-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="Enter any subject or topic..."
                placeholderTextColor={colors.textFaint}
                value={customSubject}
                onChangeText={setCustomSubject}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>
        )}

        {/* Topic selector (only for known subjects) */}
        {availableTopics.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              TOPICS (OPTIONAL)
            </Text>
            <TopicSelector
              availableTopics={availableTopics}
              selectedTopics={selectedTopics}
              onTopicsChange={setSelectedTopics}
              maxTopics={5}
              placeholder="Search topics..."
            />
          </View>
        )}

        {/* Question count slider */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            NUMBER OF QUESTIONS
          </Text>
          <QuestionCountSlider
            value={questionCount}
            onChange={setQuestionCount}
            min={5}
            max={50}
            step={5}
            freeMax={20}
            isPremium={false}
          />
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            DIFFICULTY
          </Text>
          <View style={styles.difficultyRow}>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => {
                  impact();
                  setDifficulty(opt.key);
                }}
                style={({ pressed }) => [
                  styles.difficultyCard,
                  {
                    backgroundColor:
                      difficulty === opt.key
                        ? colors.primaryLight
                        : colors.surface,
                    borderColor:
                      difficulty === opt.key
                        ? colors.primary
                        : colors.border,
                    opacity: pressed ? 0.82 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={
                    difficulty === opt.key
                      ? colors.primary
                      : colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.difficultyLabel,
                    {
                      color:
                        difficulty === opt.key
                          ? colors.primary
                          : colors.textPrimary,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Question types — 3 options, single select */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            QUESTION TYPE
          </Text>
          <View style={styles.questionTypeList}>
            {QUESTION_TYPE_OPTIONS.map((opt) => {
              const selected = questionType === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    impact();
                    setQuestionType(opt.key);
                  }}
                  style={({ pressed }) => [
                    styles.questionTypeCard,
                    {
                      backgroundColor: selected ? colors.primaryLight : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                      opacity: pressed ? 0.82 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <View style={[styles.questionTypeIcon, { backgroundColor: selected ? colors.primary : colors.surfaceSecondary }]}>
                    <Ionicons
                      name={opt.icon}
                      size={18}
                      color={selected ? colors.textOnPrimary : colors.textMuted}
                    />
                  </View>
                  <View style={styles.questionTypeText}>
                    <Text
                      style={[
                        styles.questionTypeLabel,
                        { color: selected ? colors.primary : colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={[
                        styles.questionTypeDesc,
                        { color: colors.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {opt.desc}
                    </Text>
                  </View>
                  <View style={[styles.radioOuter, { borderColor: selected ? colors.primary : colors.border }]}>
                    {selected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Timed mode */}
        <View style={styles.section}>
          <View
            style={[
              styles.toggleRow,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              SHADOWS.md,
            ]}
          >
            <Ionicons name="timer-outline" size={20} color={colors.textPrimary} />
            <View style={styles.toggleText}>
              <Text
                style={[styles.toggleLabel, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                Timed Mode
              </Text>
              <Text
                style={[styles.toggleDescription, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                Set a time limit for the test
              </Text>
            </View>
            <Switch
              value={timedMode}
              onValueChange={(val) => {
                impact();
                setTimedMode(val);
              }}
              trackColor={{ false: colors.surfaceSecondary, true: colors.primary }}
              thumbColor={colors.textOnPrimary}
            />
          </View>

          {timedMode && (
            <View style={styles.timePresetRow}>
              {TIME_PRESETS.map((mins) => (
                <Pressable
                  key={mins}
                  onPress={() => {
                    impact();
                    setTimeLimit(mins);
                  }}
                  style={({ pressed }) => [
                    styles.timeChip,
                    {
                      backgroundColor:
                        timeLimit === mins
                          ? colors.primary
                          : colors.surface,
                      borderColor:
                        timeLimit === mins
                          ? colors.primary
                          : colors.border,
                      opacity: pressed ? 0.82 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      {
                        color:
                          timeLimit === mins
                            ? colors.textOnPrimary
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    {mins} min
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Exam Focus mode */}
        <View style={styles.section}>
          <View
            style={[
              styles.toggleRow,
              {
                backgroundColor: focusMode ? `${colors.primary}10` : colors.surface,
                borderColor: focusMode ? `${colors.primary}40` : colors.border,
              },
              SHADOWS.md,
            ]}
          >
            <Ionicons name="eye-off-outline" size={20} color={colors.textPrimary} />
            <View style={styles.toggleText}>
              <Text
                style={[styles.toggleLabel, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                Exam Focus Mode
              </Text>
              <Text
                style={[styles.toggleDescription, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                No hints or feedback — pure simulation
              </Text>
            </View>
            <Switch
              value={focusMode}
              onValueChange={(val) => {
                impact();
                setFocusMode(val);
              }}
              trackColor={{ false: colors.surfaceSecondary, true: colors.primary }}
              thumbColor={colors.textOnPrimary}
            />
          </View>
        </View>
      </ScrollView>

      {/* Fixed bottom — summary pills + centered generate button */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.appBackground,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + SPACING.md,
          },
        ]}
      >
        {/* Summary pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryRow}
        >
          {summaryPills.map((pill, i) => (
            <View
              key={i}
              style={[styles.summaryPill, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Ionicons name={pill.icon} size={12} color={colors.textMuted} />
              <Text style={[styles.summaryPillText, { color: colors.textMuted }]}>
                {pill.label}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Centered generate button */}
        <View style={styles.generateContainer}>
          <Pressable
            onPress={handleGenerate}
            disabled={loading || !resolvedSubject}
            style={({ pressed }) => [
              styles.generateButton,
              {
                backgroundColor:
                  !resolvedSubject
                    ? colors.surfaceSecondary
                    : colors.primary,
                opacity: loading ? 0.7 : pressed ? 0.82 : 1,
                transform: [{ scale: pressed && !loading ? 0.98 : 1 }],
              },
              resolvedSubject ? SHADOWS.primary : undefined,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <>
                <Ionicons
                  name="sparkles"
                  size={20}
                  color={
                    !resolvedSubject
                      ? colors.textFaint
                      : colors.textOnPrimary
                  }
                />
                <Text
                  style={[
                    styles.generateText,
                    {
                      color: !resolvedSubject
                        ? colors.textFaint
                        : colors.textOnPrimary,
                    },
                  ]}
                >
                  Generate Test
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenH,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    minHeight: 44,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xxl,
    letterSpacing: -0.3,
    includeFontPadding: false,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    includeFontPadding: false,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    includeFontPadding: false,
    marginBottom: SPACING.sm,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    height: 48,
    gap: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    includeFontPadding: false,
    height: '100%',
    paddingVertical: 0,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  difficultyCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    minHeight: 44,
    gap: SPACING.xs,
  },
  difficultyLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.sm,
    includeFontPadding: false,
  },
  questionTypeList: {
    gap: SPACING.sm,
  },
  questionTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    minHeight: 44,
    gap: SPACING.sm,
  },
  questionTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionTypeText: {
    flex: 1,
    gap: 2,
  },
  questionTypeLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.base,
    includeFontPadding: false,
  },
  questionTypeDesc: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.xs,
    includeFontPadding: false,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: 44,
    gap: SPACING.sm,
  },
  toggleText: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.base,
    includeFontPadding: false,
  },
  toggleDescription: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    includeFontPadding: false,
  },
  timePresetRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  timeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    minHeight: 44,
  },
  timeChipText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.sm,
    includeFontPadding: false,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  summaryRow: {
    paddingHorizontal: SPACING.screenH,
    gap: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: 4,
  },
  summaryPillText: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.xs,
    includeFontPadding: false,
  },
  generateContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.screenH,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: RADIUS.md,
    minHeight: 44,
    gap: SPACING.sm,
    width: '100%',
    maxWidth: 360,
  },
  generateText: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.md,
    includeFontPadding: false,
  },
});
