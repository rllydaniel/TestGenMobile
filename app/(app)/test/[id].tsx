import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Modal,
  Platform,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { FadeInView } from '@/components/ui/FadeInView';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { MathRenderer } from '@/components/ui/MathRenderer';
import { supabase } from '@/lib/supabase';
import type { TestQuestion } from '@/lib/api/generateTest';
import {
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
  SHADOWS,
  formatTimer,
  formatDuration,
} from '@/constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TestSession {
  id: string;
  subject: string;
  difficulty: string;
  study_mode: boolean;
  questions: TestQuestion[];
  config: Record<string, unknown>;
}

interface AnswerOptionProps {
  letter: string;
  text: string;
  index: number;
  state: 'default' | 'selected' | 'correct' | 'incorrect';
  onSelect: () => void;
  disabled: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D'];

// ─── Answer Option ────────────────────────────────────────────────────────────

const AnswerOption = React.memo<AnswerOptionProps>(function AnswerOption({
  letter, text, index, state, onSelect, disabled,
}) {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    if (disabled) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  }, [onSelect, disabled]);

  const isSelected = state === 'selected';
  const isCorrect = state === 'correct';
  const isIncorrect = state === 'incorrect';
  const hasResult = isCorrect || isIncorrect;

  const bgColor = isCorrect
    ? colors.answerCorrect
    : isIncorrect
    ? colors.answerIncorrect
    : isSelected
    ? colors.answerSelected
    : colors.answerDefault;

  const borderColor = isCorrect
    ? colors.answerCorrectBorder
    : isIncorrect
    ? colors.answerIncorrectBorder
    : isSelected
    ? colors.answerSelectedBorder
    : colors.border;

  const circleBg = isCorrect
    ? colors.success
    : isIncorrect
    ? colors.error
    : isSelected
    ? colors.primary
    : colors.primaryLight;

  const circleText = isSelected || hasResult ? '#FFFFFF' : colors.primary;

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.optionCard,
        { backgroundColor: bgColor, borderColor, borderWidth: isSelected || hasResult ? 2 : 1 },
        SHADOWS.sm,
      ]}
    >
      <View style={[styles.letterCircle, { backgroundColor: circleBg }]}>
        <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.sm, color: circleText, lineHeight: FONT_SIZES.sm * 1.3 }}>
          {letter}
        </Text>
      </View>
      <Text style={[styles.optionText, { color: colors.textPrimary }]}>{text}</Text>
      {isCorrect && <Ionicons name="checkmark-circle" size={20} color={colors.success} style={{ marginLeft: 8 }} />}
      {isIncorrect && <Ionicons name="close-circle" size={20} color={colors.error} style={{ marginLeft: 8 }} />}
    </Pressable>
  );
});

// ─── Explanation Panel ────────────────────────────────────────────────────────

const ExplanationPanel = React.memo(function ExplanationPanel({
  explanation,
  isCorrect,
  correctAnswerLabel,
}: {
  explanation: string;
  isCorrect: boolean;
  correctAnswerLabel: string;
}) {
  const { colors } = useTheme();

  return (
    <FadeInView delay={0} duration={300}>
      <View style={[styles.explanationPanel, {
        backgroundColor: colors.primaryLight,
        borderLeftColor: colors.primary,
      }]}>
        <View style={[styles.explanationBadge, { backgroundColor: isCorrect ? colors.successLight : colors.errorLight }]}>
          <Ionicons name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={16} color={isCorrect ? colors.success : colors.error} />
          <Text style={[styles.explanationBadgeText, { color: isCorrect ? colors.success : colors.error }]}>
            {isCorrect ? 'Correct!' : `Incorrect — Answer: ${correctAnswerLabel}`}
          </Text>
        </View>
        <MathRenderer
          content={explanation}
          fontSize={FONT_SIZES.sm}
          style={{ color: colors.textPrimary, lineHeight: FONT_SIZES.sm * 1.7, marginTop: SPACING.sm }}
        />
      </View>
    </FadeInView>
  );
});

// ─── Short Response Input ─────────────────────────────────────────────────────

const ShortResponseInput = React.memo(function ShortResponseInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (text: string) => void;
  disabled: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.shortResponseContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <TextInput
        style={[styles.shortResponseInput, { color: colors.textPrimary }]}
        placeholder="Type your answer here..."
        placeholderTextColor={colors.textFaint}
        value={value}
        onChangeText={onChange}
        multiline
        editable={!disabled}
        autoCapitalize="sentences"
        returnKeyType="default"
      />
    </View>
  );
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TestTakingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; returnTo?: string; diagnosticSetup?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Session loading state
  const [session, setSession] = useState<TestSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Test state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showSubmitSheet, setShowSubmitSheet] = useState(false);
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ─── Load session ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!params.id) {
      setLoadError('No test session ID provided.');
      setLoadingSession(false);
      return;
    }

    supabase
      .from('test_sessions')
      .select('id, subject, difficulty, study_mode, questions, config')
      .eq('id', params.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setLoadError(error?.message ?? 'Test session not found.');
        } else {
          setSession(data as TestSession);
        }
        setLoadingSession(false);
      });
  }, [params.id]);

  // ─── Timer ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => setTimerSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Derived ──────────────────────────────────────────────────────────────

  const questions = session?.questions ?? [];
  const totalQuestions = questions.length;
  const question = questions[currentQuestion];
  const progress = totalQuestions > 0 ? (currentQuestion + 1) / totalQuestions : 0;
  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const isFirstQuestion = currentQuestion === 0;
  const isFlagged = flaggedQuestions.has(currentQuestion);
  const studyMode = session?.study_mode ?? false;

  const answeredCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < totalQuestions; i++) {
      const q = questions[i];
      if (!q) continue;
      if (q.type === 'short-response') {
        if ((shortAnswers[i] ?? '').trim().length > 0) count++;
      } else {
        if (selectedAnswers[i] !== undefined) count++;
      }
    }
    return count;
  }, [selectedAnswers, shortAnswers, totalQuestions, questions]);

  const flaggedCount = useMemo(() => flaggedQuestions.size, [flaggedQuestions]);
  const unansweredCount = totalQuestions - answeredCount;
  const formattedTimer = useMemo(() => formatTimer(timerSeconds), [timerSeconds]);

  // ─── Progress animation ───────────────────────────────────────────────────

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [progress, progressAnim]);

  // ─── Transition animation ─────────────────────────────────────────────────

  const animateTransition = useCallback((callback: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSelectAnswer = useCallback((optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion]: optionIndex }));
    if (studyMode) {
      setShowExplanation((prev) => ({ ...prev, [currentQuestion]: true }));
    }
  }, [currentQuestion, studyMode]);

  const handleShortAnswerChange = useCallback((text: string) => {
    setShortAnswers((prev) => ({ ...prev, [currentQuestion]: text }));
  }, [currentQuestion]);

  const handleToggleFlag = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion)) next.delete(currentQuestion);
      else next.add(currentQuestion);
      return next;
    });
  }, [currentQuestion]);

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) animateTransition(() => setCurrentQuestion((prev) => prev - 1));
  }, [currentQuestion, animateTransition]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      setShowSubmitSheet(true);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      animateTransition(() => setCurrentQuestion((prev) => prev + 1));
    }
  }, [isLastQuestion, animateTransition]);

  const handleSubmitTest = useCallback(async () => {
    if (!session || submitting) return;
    setSubmitting(true);

    try {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Build answers map: questionIndex -> answer string
      const answersMap: Record<string, string> = {};
      questions.forEach((q, i) => {
        if (q.type === 'short-response') {
          answersMap[String(i)] = shortAnswers[i] ?? '';
        } else {
          answersMap[String(i)] = selectedAnswers[i] !== undefined ? LETTERS[selectedAnswers[i]] : '';
        }
      });

      // Calculate score (MCQ only — short response graded server-side later)
      let correct = 0;
      questions.forEach((q, i) => {
        if (q.type === 'multiple-choice' && answersMap[String(i)] === q.correctAnswer) {
          correct++;
        }
      });
      const mcqCount = questions.filter((q) => q.type === 'multiple-choice').length;
      const score = mcqCount > 0 ? Math.round((correct / mcqCount) * 100) : null;

      await supabase
        .from('test_sessions')
        .update({
          answers: answersMap,
          score,
          status: 'completed',
          time_spent: timerSeconds,
          completed_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      setShowSubmitSheet(false);
      if (params.returnTo === 'plan/results') {
        router.replace({
          pathname: '/(app)/plan/results',
          params: { sessionId: session.id, diagnosticSetup: params.diagnosticSetup ?? '' },
        });
      } else {
        router.replace({
          pathname: '/(app)/test/results/[id]',
          params: { id: session.id },
        });
      }
    } catch {
      setSubmitting(false);
    }
  }, [session, submitting, questions, selectedAnswers, shortAnswers, timerSeconds, router, params.returnTo, params.diagnosticSetup]);

  const handleReviewFlagged = useCallback(() => {
    setShowSubmitSheet(false);
    const firstFlagged = Array.from(flaggedQuestions).sort((a, b) => a - b)[0];
    if (firstFlagged !== undefined) animateTransition(() => setCurrentQuestion(firstFlagged));
  }, [flaggedQuestions, animateTransition]);

  // ─── Option state ─────────────────────────────────────────────────────────

  const getOptionState = useCallback((questionIdx: number, optionIdx: number): 'default' | 'selected' | 'correct' | 'incorrect' => {
    const q = questions[questionIdx];
    const selected = selectedAnswers[questionIdx];
    const didAnswer = selected !== undefined;
    const isStudy = studyMode && showExplanation[questionIdx];

    if (isStudy && q?.options) {
      const correctIdx = LETTERS.indexOf(q.correctAnswer);
      if (optionIdx === correctIdx) return 'correct';
      if (optionIdx === selected && selected !== correctIdx) return 'incorrect';
    } else if (didAnswer && optionIdx === selected) {
      return 'selected';
    }
    return 'default';
  }, [selectedAnswers, questions, studyMode, showExplanation]);

  // ─── Layout constants ─────────────────────────────────────────────────────

  const topOffset = insets.top;
  const progressBarHeight = 3;
  const topBarHeight = 52;
  const bottomBarHeight = 64;

  // ─── Loading / Error states ───────────────────────────────────────────────

  if (loadingSession) {
    return (
      <View style={[styles.centeredState, { backgroundColor: colors.appBackground }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading your test...</Text>
      </View>
    );
  }

  if (loadError || !session) {
    return (
      <View style={[styles.centeredState, { backgroundColor: colors.appBackground }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Failed to load test</Text>
        <Text style={[styles.errorBody, { color: colors.textMuted }]}>{loadError ?? 'Unknown error'}</Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.errorBack, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.errorBackText, { color: colors.textOnPrimary }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (!question) {
    return (
      <View style={[styles.centeredState, { backgroundColor: colors.appBackground }]}>
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>No questions found</Text>
        <Pressable onPress={() => router.back()} style={[styles.errorBack, { backgroundColor: colors.primary }]}>
          <Text style={[styles.errorBackText, { color: colors.textOnPrimary }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isMCQ = question.type === 'multiple-choice';
  const correctAnswerLabel = isMCQ
    ? `${question.correctAnswer}: ${question.options?.[LETTERS.indexOf(question.correctAnswer)] ?? ''}`
    : question.correctAnswer;

  const mcqAnswered = isMCQ && selectedAnswers[currentQuestion] !== undefined;
  const srAnswered = !isMCQ && (shortAnswers[currentQuestion] ?? '').trim().length > 0;
  const currentAnswered = isMCQ ? mcqAnswered : srAnswered;

  // In study mode, show explanation after MCQ answer; for short-response always show after submit
  const showCurrentExplanation = studyMode && showExplanation[currentQuestion];

  // For MCQ in study mode: once answered, disable further selection
  const optionsDisabled = studyMode && mcqAnswered;

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      {/* Progress Bar */}
      <View style={{ position: 'absolute', top: topOffset, left: 0, right: 0, height: progressBarHeight, backgroundColor: colors.border, zIndex: 100 }}>
        <Animated.View style={{
          height: progressBarHeight,
          backgroundColor: colors.primary,
          width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }} />
      </View>

      {/* Top Bar */}
      <View style={{
        position: 'absolute',
        top: topOffset + progressBarHeight,
        left: 0, right: 0,
        height: topBarHeight,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        zIndex: 99,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
      }}>
        <Text numberOfLines={1} style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZES.sm, color: colors.textMuted, flex: 1, lineHeight: FONT_SIZES.sm * 1.4 }}>
          {session.subject}
        </Text>
        <Text style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: colors.textPrimary, lineHeight: FONT_SIZES.base * 1.4 }}>
          {currentQuestion + 1} of {totalQuestions}
        </Text>
        <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: colors.textPrimary, lineHeight: FONT_SIZES.base * 1.4, fontVariant: ['tabular-nums'], minWidth: 48, textAlign: 'right' }}>
          {formattedTimer}
        </Text>
      </View>

      {/* ScrollView */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: topOffset + progressBarHeight + topBarHeight + SPACING.lg,
          paddingBottom: bottomBarHeight + insets.bottom + SPACING.xl,
          paddingHorizontal: SPACING.screenH,
        }}
      >
        <Animated.View key={currentQuestion} style={{ opacity: fadeAnim }}>
          {/* Topic tag */}
          <View style={{ alignSelf: 'flex-start', backgroundColor: colors.primaryLight, paddingHorizontal: SPACING.sm + SPACING.xs, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, marginBottom: SPACING.md }}>
            <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.xs, color: colors.primary, lineHeight: FONT_SIZES.xs * 1.4 }}>
              {question.topic}
            </Text>
          </View>

          {/* Question type badge */}
          {!isMCQ && (
            <View style={{ alignSelf: 'flex-start', backgroundColor: colors.surfaceSecondary, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full, marginBottom: SPACING.sm }}>
              <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.xs, color: colors.textMuted }}>Short Response</Text>
            </View>
          )}

          {/* Question text */}
          <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.md, color: colors.textPrimary, lineHeight: FONT_SIZES.md * 1.6, marginBottom: SPACING.xl }}>
            {question.text}
          </Text>

          {/* MCQ Options */}
          {isMCQ && question.options && question.options.map((optionText, index) => (
            <AnswerOption
              key={`${currentQuestion}-${index}`}
              letter={LETTERS[index]}
              text={optionText}
              index={index}
              state={getOptionState(currentQuestion, index)}
              onSelect={() => handleSelectAnswer(index)}
              disabled={optionsDisabled}
            />
          ))}

          {/* Short Response Input */}
          {!isMCQ && (
            <ShortResponseInput
              value={shortAnswers[currentQuestion] ?? ''}
              onChange={handleShortAnswerChange}
              disabled={showCurrentExplanation}
            />
          )}

          {/* Study Mode: show explanation button for short-response */}
          {!isMCQ && studyMode && srAnswered && !showCurrentExplanation && (
            <Pressable
              onPress={() => setShowExplanation((prev) => ({ ...prev, [currentQuestion]: true }))}
              style={[styles.checkAnswerBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="sparkles" size={16} color={colors.textOnPrimary} />
              <Text style={[styles.checkAnswerText, { color: colors.textOnPrimary }]}>Check Answer</Text>
            </Pressable>
          )}

          {/* Explanation Panel */}
          {showCurrentExplanation && (
            <ExplanationPanel
              explanation={question.explanation}
              isCorrect={
                isMCQ
                  ? selectedAnswers[currentQuestion] !== undefined && LETTERS[selectedAnswers[currentQuestion]] === question.correctAnswer
                  : false // short-response: we show model answer, not grade
              }
              correctAnswerLabel={correctAnswerLabel}
            />
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: bottomBarHeight + insets.bottom,
        backgroundColor: colors.surface,
        borderTopWidth: 1, borderTopColor: colors.border,
        paddingBottom: insets.bottom,
        paddingHorizontal: SPACING.md,
        flexDirection: 'row', alignItems: 'center',
      }}>
        {/* Flag */}
        <Pressable
          onPress={handleToggleFlag}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isFlagged ? colors.primaryLight : 'transparent', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm, minHeight: 44, minWidth: 44, gap: SPACING.xs }}
        >
          <Ionicons name={isFlagged ? 'flag' : 'flag-outline'} size={18} color={isFlagged ? colors.primary : colors.textMuted} />
          <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.sm, color: isFlagged ? colors.primary : colors.textMuted, lineHeight: FONT_SIZES.sm * 1.4 }}>
            {isFlagged ? 'Flagged' : 'Flag'}
          </Text>
        </Pressable>

        {/* Answered count */}
        <Text style={{ flex: 1, textAlign: 'center', fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.sm, color: colors.textMuted, lineHeight: FONT_SIZES.sm * 1.4 }}>
          {answeredCount} / {totalQuestions} answered
        </Text>

        {/* Navigation */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Pressable
            onPress={handlePrevious}
            disabled={isFirstQuestion}
            style={{ width: 40, height: 40, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', opacity: isFirstQuestion ? 0.4 : 1, minHeight: 44 }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>

          <Pressable
            onPress={handleNext}
            style={[{ height: 40, borderRadius: RADIUS.sm, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.md, minHeight: 44, gap: SPACING.xs }, SHADOWS.primary]}
          >
            <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: colors.textOnPrimary, lineHeight: FONT_SIZES.base * 1.4 }}>
              {isLastQuestion ? 'Submit' : 'Next'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textOnPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Submit Modal */}
      <Modal visible={showSubmitSheet} transparent animationType="slide" onRequestClose={() => setShowSubmitSheet(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSubmitSheet(false)}>
          <Pressable
            style={[styles.submitSheet, { paddingBottom: Math.max(insets.bottom, SPACING.lg), backgroundColor: colors.surface }]}
            onPress={() => {}}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Submit Test?</Text>

            <View style={[styles.statsContainer, { backgroundColor: colors.primaryLight }]}>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Answered</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{answeredCount}</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Flagged</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{flaggedCount}</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: colors.textFaint }]} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Unanswered</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{unansweredCount}</Text>
              </View>
            </View>

            <View style={styles.timeSpentRow}>
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.timeSpentText, { color: colors.textMuted }]}>Time spent: {formatDuration(timerSeconds)}</Text>
            </View>

            <View style={{ gap: SPACING.sm }}>
              <Button label={submitting ? 'Submitting...' : 'Submit Test'} onPress={handleSubmitTest} variant="primary" size="lg" fullWidth />
              {flaggedCount > 0 && (
                <Button label="Review Flagged" onPress={handleReviewFlagged} variant="outline" size="lg" fullWidth />
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centeredState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, paddingHorizontal: SPACING.screenH,
  },
  loadingText: {
    fontFamily: FONTS.sansRegular, fontSize: FONT_SIZES.base, includeFontPadding: false,
  },
  errorTitle: {
    fontFamily: FONTS.displaySemiBold, fontSize: FONT_SIZES.xl, includeFontPadding: false, textAlign: 'center',
  },
  errorBody: {
    fontFamily: FONTS.sansRegular, fontSize: FONT_SIZES.sm, includeFontPadding: false, textAlign: 'center',
  },
  errorBack: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, marginTop: SPACING.sm,
  },
  errorBackText: {
    fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, includeFontPadding: false,
  },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 14, marginBottom: 10, borderRadius: RADIUS.md, minHeight: 54,
  },
  letterCircle: {
    width: 32, height: 32, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  optionText: {
    flex: 1, fontFamily: FONTS.sansRegular, fontSize: FONT_SIZES.base, lineHeight: FONT_SIZES.base * 1.5,
  },
  shortResponseContainer: {
    borderWidth: 1.5, borderRadius: RADIUS.md, minHeight: 120, padding: SPACING.md, marginBottom: SPACING.md,
  },
  shortResponseInput: {
    fontFamily: FONTS.sansRegular, fontSize: FONT_SIZES.base, lineHeight: FONT_SIZES.base * 1.6, includeFontPadding: false, minHeight: 96,
  },
  checkAnswerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: RADIUS.md, gap: SPACING.xs, marginBottom: SPACING.md,
  },
  checkAnswerText: {
    fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, includeFontPadding: false,
  },
  explanationPanel: {
    borderLeftWidth: 3, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md, marginBottom: SPACING.sm,
  },
  explanationBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, gap: 4,
  },
  explanationBadgeText: {
    fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.sm, includeFontPadding: false,
  },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  submitSheet: {
    borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.lg,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.lg,
  },
  sheetTitle: {
    fontFamily: FONTS.displaySemiBold, fontSize: FONT_SIZES.xl, textAlign: 'center', lineHeight: FONT_SIZES.xl * 1.3, marginBottom: SPACING.lg,
  },
  statsContainer: {
    flexDirection: 'row', justifyContent: 'space-around', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md,
  },
  statItem: { alignItems: 'center', gap: SPACING.xs },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statLabel: { fontFamily: FONTS.sansRegular, fontSize: FONT_SIZES.xs, lineHeight: FONT_SIZES.xs * 1.4 },
  statValue: { fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.lg, lineHeight: FONT_SIZES.lg * 1.3 },
  timeSpentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, marginBottom: SPACING.lg,
  },
  timeSpentText: {
    fontFamily: FONTS.sansRegular, fontSize: FONT_SIZES.sm, lineHeight: FONT_SIZES.sm * 1.4,
  },
});
