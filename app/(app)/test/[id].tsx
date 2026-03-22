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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { FadeInView } from '@/components/ui/FadeInView';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { MathRenderer } from '@/components/ui/MathRenderer';
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

interface MockQuestion {
  id: number;
  type: 'mcq';
  text: string;
  topic: string;
  options: string[];
  correctAnswer: string;
}

interface AnswerOptionProps {
  letter: string;
  text: string;
  index: number;
  state: 'default' | 'selected' | 'correct' | 'incorrect';
  onSelect: () => void;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_QUESTIONS: MockQuestion[] = [
  {
    id: 1,
    type: 'mcq',
    text: 'Which data structure uses a First-In, First-Out (FIFO) ordering principle for element access?',
    topic: 'Data Structures',
    options: ['Stack', 'Queue', 'Binary Search Tree', 'Hash Map'],
    correctAnswer: 'B',
  },
  {
    id: 2,
    type: 'mcq',
    text: 'What is the time complexity of searching for an element in a balanced binary search tree?',
    topic: 'Algorithms',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
    correctAnswer: 'C',
  },
  {
    id: 3,
    type: 'mcq',
    text: 'In object-oriented programming, which principle states that a class should have only one reason to change?',
    topic: 'OOP Principles',
    options: [
      'Open/Closed Principle',
      'Liskov Substitution Principle',
      'Single Responsibility Principle',
      'Dependency Inversion Principle',
    ],
    correctAnswer: 'C',
  },
  {
    id: 4,
    type: 'mcq',
    text: 'Which sorting algorithm has the best average-case time complexity?',
    topic: 'Algorithms',
    options: [
      'Bubble Sort — O(n\u00B2)',
      'Merge Sort — O(n log n)',
      'Selection Sort — O(n\u00B2)',
      'Insertion Sort — O(n\u00B2)',
    ],
    correctAnswer: 'B',
  },
  {
    id: 5,
    type: 'mcq',
    text: 'What does the "CAP theorem" state about distributed systems?',
    topic: 'Distributed Systems',
    options: [
      'A system can guarantee Consistency, Availability, and Partition tolerance simultaneously',
      'A system can guarantee at most two of: Consistency, Availability, and Partition tolerance',
      'A system must sacrifice Availability to achieve Consistency',
      'A system must always prioritize Partition tolerance over Consistency',
    ],
    correctAnswer: 'B',
  },
];

const LETTERS = ['A', 'B', 'C', 'D'];

// ─── Memoized Answer Option ─────────────────────────────────────────────────

const AnswerOption = React.memo<AnswerOptionProps>(function AnswerOption({
  letter,
  text,
  index,
  state,
  onSelect,
}) {
  const { colors } = useTheme();
  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect();
  }, [onSelect]);

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

  const borderWidth = isSelected || hasResult ? 2 : 1;

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
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: borderWidth,
        },
        SHADOWS.sm,
      ]}
    >
      <View style={[styles.letterCircle, { backgroundColor: circleBg }]}>
        <Text
          style={{
            fontFamily: FONTS.sansSemiBold,
            fontSize: FONT_SIZES.sm,
            color: circleText,
            lineHeight: FONT_SIZES.sm * 1.3,
          }}
        >
          {letter}
        </Text>
      </View>
      <Text style={[styles.optionText, { color: colors.textPrimary }]}>{text}</Text>
      {isCorrect && (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={colors.success}
          style={{ marginLeft: 8 }}
        />
      )}
      {isIncorrect && (
        <Ionicons
          name="close-circle"
          size={20}
          color={colors.error}
          style={{ marginLeft: 8 }}
        />
      )}
    </Pressable>
  );
});

// ─── AI Explanation Panel (Study Mode) ──────────────────────────────────────

const MOCK_EXPLANATIONS: Record<number, string> = {
  1: "A Queue follows the FIFO (First-In, First-Out) principle, meaning the first element added is the first one removed. Think of it like a line at a store — the first person in line is served first. A Stack, by contrast, uses LIFO (Last-In, First-Out).",
  2: "In a balanced BST, each comparison eliminates roughly half of the remaining nodes. Starting from the root, you go left or right at each level, so the number of comparisons equals the height of the tree, which is $O(\\log n)$ for a balanced tree with $n$ nodes.",
  3: "The Single Responsibility Principle (SRP) states that a class should have only one reason to change. This means each class should encapsulate one piece of functionality. If a class handles both data persistence and business logic, it violates SRP because changes to either concern would require modifying the same class.",
  4: "Merge Sort achieves $O(n \\log n)$ in all cases (best, average, and worst) by dividing the array in half recursively and merging sorted halves. Bubble Sort, Selection Sort, and Insertion Sort are all $O(n^2)$ on average, making them significantly slower for large datasets.",
  5: "The CAP theorem (Brewer's theorem) states that in a distributed system, you can only guarantee two out of three properties simultaneously: Consistency (all nodes see the same data), Availability (every request gets a response), and Partition tolerance (the system works despite network failures).",
};

const ExplanationPanel = React.memo(function ExplanationPanel({
  questionId,
  isCorrect,
  correctAnswer,
}: {
  questionId: number;
  isCorrect: boolean;
  correctAnswer: string;
}) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    // Simulate AI explanation fetch
    const timer = setTimeout(() => {
      setExplanation(MOCK_EXPLANATIONS[questionId] ?? 'Explanation not available for this question.');
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [questionId]);

  return (
    <FadeInView delay={0} duration={400}>
      <View style={[styles.explanationPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Header */}
        <View style={styles.explanationHeader}>
          <View style={[
            styles.explanationBadge,
            { backgroundColor: isCorrect ? colors.successLight : colors.errorLight },
          ]}>
            <Ionicons
              name={isCorrect ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={isCorrect ? colors.success : colors.error}
            />
            <Text style={[
              styles.explanationBadgeText,
              { color: isCorrect ? colors.success : colors.error },
            ]}>
              {isCorrect ? 'Correct!' : `Incorrect — Answer: ${correctAnswer}`}
            </Text>
          </View>
          <View style={styles.explanationLabelRow}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={[styles.explanationLabel, { color: colors.primary }]}>
              AI Explanation
            </Text>
          </View>
        </View>

        {/* Body */}
        {loading ? (
          <View style={styles.explanationLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.explanationLoadingText, { color: colors.textMuted }]}>
              Generating explanation...
            </Text>
          </View>
        ) : (
          <MathRenderer
            content={explanation}
            fontSize={FONT_SIZES.sm}
            style={{ color: colors.textPrimary, lineHeight: FONT_SIZES.sm * 1.7 }}
          />
        )}
      </View>
    </FadeInView>
  );
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TestTakingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // State
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showSubmitSheet, setShowSubmitSheet] = useState(false);
  const [studyMode] = useState(true); // TODO: read from test config
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Derived
  const questions = MOCK_QUESTIONS;
  const totalQuestions = questions.length;
  const question = questions[currentQuestion];
  const progress = totalQuestions > 0 ? (currentQuestion + 1) / totalQuestions : 0;
  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const isFirstQuestion = currentQuestion === 0;
  const isFlagged = flaggedQuestions.has(currentQuestion);

  const answeredCount = useMemo(
    () => Object.keys(selectedAnswers).length,
    [selectedAnswers],
  );
  const flaggedCount = useMemo(() => flaggedQuestions.size, [flaggedQuestions]);
  const unansweredCount = totalQuestions - answeredCount;

  // ─── Timer ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTimer = useMemo(() => formatTimer(timerSeconds), [timerSeconds]);

  // ─── Progress bar animation ────────────────────────────────────────────

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [progress, progressAnim]);

  // ─── Question transition animation ────────────────────────────────────

  const animateTransition = useCallback(
    (callback: () => void) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        callback();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeAnim],
  );

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSelectAnswer = useCallback(
    (optionIndex: number) => {
      setSelectedAnswers((prev) => ({ ...prev, [currentQuestion]: optionIndex }));
      if (studyMode) {
        // Show explanation immediately after answering in study mode
        setShowExplanation((prev) => ({ ...prev, [currentQuestion]: true }));
      }
    },
    [currentQuestion, studyMode],
  );

  const handleToggleFlag = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion)) {
        next.delete(currentQuestion);
      } else {
        next.add(currentQuestion);
      }
      return next;
    });
  }, [currentQuestion]);

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 0) {
      animateTransition(() => setCurrentQuestion((prev) => prev - 1));
    }
  }, [currentQuestion, animateTransition]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      setShowSubmitSheet(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else {
      animateTransition(() => setCurrentQuestion((prev) => prev + 1));
    }
  }, [isLastQuestion, animateTransition]);

  const handleSubmitTest = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowSubmitSheet(false);
    router.replace({
      pathname: '/(app)/test/results/[id]',
      params: {
        id: params.id ?? 'mock',
        answers: JSON.stringify(selectedAnswers),
        time: String(timerSeconds),
      },
    });
  }, [selectedAnswers, timerSeconds, params.id, router]);

  const handleReviewFlagged = useCallback(() => {
    setShowSubmitSheet(false);
    const firstFlagged = Array.from(flaggedQuestions).sort((a, b) => a - b)[0];
    if (firstFlagged !== undefined) {
      animateTransition(() => setCurrentQuestion(firstFlagged));
    }
  }, [flaggedQuestions, animateTransition]);

  // ─── Memoized option state getter ──────────────────────────────────────

  const getOptionState = useCallback(
    (questionIdx: number, optionIdx: number): 'default' | 'selected' | 'correct' | 'incorrect' => {
      if (selectedAnswers[questionIdx] === optionIdx) return 'selected';
      return 'default';
    },
    [selectedAnswers],
  );

  // ─── Layout constants ─────────────────────────────────────────────────

  const topOffset = insets.top;
  const progressBarHeight = 3;
  const topBarHeight = 52;
  const bottomBarHeight = 64;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      {/* ── Progress Bar ──────────────────────────────────────────────── */}
      <View
        style={{
          position: 'absolute',
          top: topOffset,
          left: 0,
          right: 0,
          height: progressBarHeight,
          backgroundColor: colors.border,
          zIndex: 100,
        }}
      >
        <Animated.View
          style={{
            height: progressBarHeight,
            backgroundColor: colors.primary,
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>

      {/* ── Top Bar ───────────────────────────────────────────────────── */}
      <View
        style={{
          position: 'absolute',
          top: topOffset + progressBarHeight,
          left: 0,
          right: 0,
          height: topBarHeight,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          zIndex: 99,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: SPACING.md,
        }}
      >
        {/* Left: test name */}
        <Text
          numberOfLines={1}
          style={{
            fontFamily: FONTS.sansRegular,
            fontSize: FONT_SIZES.sm,
            color: colors.textMuted,
            lineHeight: FONT_SIZES.sm * 1.4,
            flex: 1,
          }}
        >
          Data Structures & Algorithms
        </Text>

        {/* Center: X of Y */}
        <Text
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: FONTS.sansSemiBold,
            fontSize: FONT_SIZES.base,
            color: colors.textPrimary,
            lineHeight: FONT_SIZES.base * 1.4,
          }}
        >
          {currentQuestion + 1} of {totalQuestions}
        </Text>

        {/* Right: timer */}
        <Text
          style={{
            fontFamily: FONTS.sansSemiBold,
            fontSize: FONT_SIZES.base,
            color: timerSeconds < 60 ? colors.error : colors.textPrimary,
            lineHeight: FONT_SIZES.base * 1.4,
            fontVariant: ['tabular-nums'],
            minWidth: 48,
            textAlign: 'right',
          }}
        >
          {formattedTimer}
        </Text>
      </View>

      {/* ── ScrollView ────────────────────────────────────────────────── */}
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
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: colors.primaryLight,
              paddingHorizontal: SPACING.sm + SPACING.xs,
              paddingVertical: SPACING.xs,
              borderRadius: RADIUS.full,
              marginBottom: SPACING.md,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.sansMedium,
                fontSize: FONT_SIZES.xs,
                color: colors.primary,
                lineHeight: FONT_SIZES.xs * 1.4,
              }}
            >
              {question.topic}
            </Text>
          </View>

          {/* Question text */}
          <Text
            style={{
              fontFamily: FONTS.sansMedium,
              fontSize: FONT_SIZES.md,
              color: colors.textPrimary,
              lineHeight: FONT_SIZES.md * 1.6,
              marginBottom: SPACING.xl,
            }}
          >
            {question.text}
          </Text>

          {/* Answer options */}
          {question.options.map((optionText, index) => (
            <AnswerOption
              key={`${currentQuestion}-${index}`}
              letter={LETTERS[index]}
              text={optionText}
              index={index}
              state={getOptionState(currentQuestion, index)}
              onSelect={() => handleSelectAnswer(index)}
            />
          ))}

          {/* AI Explanation Panel (Study Mode) */}
          {studyMode && showExplanation[currentQuestion] && (
            <ExplanationPanel
              questionId={question.id}
              isCorrect={
                selectedAnswers[currentQuestion] !== undefined &&
                LETTERS[selectedAnswers[currentQuestion]] === question.correctAnswer
              }
              correctAnswer={question.correctAnswer}
            />
          )}
        </Animated.View>
      </ScrollView>

      {/* ── Bottom Bar ────────────────────────────────────────────────── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: bottomBarHeight + insets.bottom,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom,
          paddingHorizontal: SPACING.md,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {/* Left: Flag button */}
        <Pressable
          onPress={handleToggleFlag}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isFlagged ? colors.primaryLight : 'transparent',
            paddingHorizontal: SPACING.sm,
            paddingVertical: SPACING.xs,
            borderRadius: RADIUS.sm,
            minHeight: 44,
            minWidth: 44,
            gap: SPACING.xs,
          }}
        >
          <Ionicons
            name={isFlagged ? 'flag' : 'flag-outline'}
            size={18}
            color={isFlagged ? colors.primary : colors.textMuted}
          />
          <Text
            style={{
              fontFamily: FONTS.sansMedium,
              fontSize: FONT_SIZES.sm,
              color: isFlagged ? colors.primary : colors.textMuted,
              lineHeight: FONT_SIZES.sm * 1.4,
            }}
          >
            {isFlagged ? 'Flagged' : 'Flag'}
          </Text>
        </Pressable>

        {/* Center: X / Y answered */}
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontFamily: FONTS.sansSemiBold,
            fontSize: FONT_SIZES.sm,
            color: colors.textMuted,
            lineHeight: FONT_SIZES.sm * 1.4,
          }}
        >
          {answeredCount} / {totalQuestions} answered
        </Text>

        {/* Right: navigation buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          {/* Previous */}
          <Pressable
            onPress={handlePrevious}
            disabled={isFirstQuestion}
            style={{
              width: 40,
              height: 40,
              borderRadius: RADIUS.sm,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isFirstQuestion ? 0.4 : 1,
              minHeight: 44,
            }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>

          {/* Next / Submit */}
          <Pressable
            onPress={handleNext}
            style={[
              {
                height: 40,
                borderRadius: RADIUS.sm,
                backgroundColor: colors.primary,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: SPACING.md,
                minHeight: 44,
                gap: SPACING.xs,
              },
              SHADOWS.primary,
            ]}
          >
            <Text
              style={{
                fontFamily: FONTS.sansSemiBold,
                fontSize: FONT_SIZES.base,
                color: colors.textOnPrimary,
                lineHeight: FONT_SIZES.base * 1.4,
              }}
            >
              {isLastQuestion ? 'Submit' : 'Next'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textOnPrimary} />
          </Pressable>
        </View>
      </View>

      {/* ── Submit Confirmation Modal ─────────────────────────────────── */}
      <Modal
        visible={showSubmitSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubmitSheet(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowSubmitSheet(false)}
        >
          <Pressable
            style={[
              styles.submitSheet,
              { paddingBottom: Math.max(insets.bottom, SPACING.lg), backgroundColor: colors.surface },
            ]}
            onPress={() => {}}
          >
            {/* Handle indicator */}
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            {/* Title */}
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Submit Test?</Text>

            {/* Stats */}
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

            {/* Time spent */}
            <View style={styles.timeSpentRow}>
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.timeSpentText, { color: colors.textMuted }]}>
                Time spent: {formatDuration(timerSeconds)}
              </Text>
            </View>

            {/* Actions */}
            <View style={{ gap: SPACING.sm }}>
              <Button
                label="Submit Test"
                onPress={handleSubmitTest}
                variant="primary"
                size="lg"
                fullWidth
              />
              {flaggedCount > 0 && (
                <Button
                  label="Review Flagged"
                  onPress={handleReviewFlagged}
                  variant="outline"
                  size="lg"
                  fullWidth
                />
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    marginBottom: 10,
    borderRadius: RADIUS.md,
    minHeight: 54,
  },
  letterCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionText: {
    flex: 1,
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  submitSheet: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  sheetTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    textAlign: 'center',
    lineHeight: FONT_SIZES.xl * 1.3,
    marginBottom: SPACING.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.xs,
    lineHeight: FONT_SIZES.xs * 1.4,
  },
  statValue: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.lg,
    lineHeight: FONT_SIZES.lg * 1.3,
  },
  timeSpentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  timeSpentText: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.4,
  },
  // Explanation panel
  explanationPanel: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  explanationHeader: {
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  explanationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: 4,
  },
  explanationBadgeText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.sm,
    includeFontPadding: false,
  },
  explanationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  explanationLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.xs,
    includeFontPadding: false,
  },
  explanationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  explanationLoadingText: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    includeFontPadding: false,
  },
});
