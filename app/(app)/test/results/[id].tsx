import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ShimmerBlock } from '@/components/ui/Shimmer';
import { useTheme } from '@/contexts/ThemeContext';
import {
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
  SHADOWS,
  getScoreColor,
  getScoreBgColor,
  formatDuration,
} from '@/constants/theme';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface MockQuestion {
  id: string;
  topic: string;
  text: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  selectedAnswer: string | null;
  explanation: string;
}

const MOCK_QUESTIONS: MockQuestion[] = [
  {
    id: 'q1',
    topic: 'Cell Biology',
    text: 'Which organelle is responsible for producing ATP through oxidative phosphorylation in eukaryotic cells?',
    options: [
      { id: 'a', text: 'Golgi apparatus' },
      { id: 'b', text: 'Mitochondria' },
      { id: 'c', text: 'Endoplasmic reticulum' },
      { id: 'd', text: 'Lysosome' },
    ],
    correctAnswer: 'b',
    selectedAnswer: 'b',
    explanation:
      'Mitochondria are the powerhouses of the cell, generating most of the cell\'s supply of ATP via oxidative phosphorylation on the inner mitochondrial membrane.',
  },
  {
    id: 'q2',
    topic: 'Cell Biology',
    text: 'What is the primary function of ribosomes within a cell?',
    options: [
      { id: 'a', text: 'DNA replication' },
      { id: 'b', text: 'Lipid synthesis' },
      { id: 'c', text: 'Protein synthesis' },
      { id: 'd', text: 'Cell division' },
    ],
    correctAnswer: 'c',
    selectedAnswer: 'c',
    explanation:
      'Ribosomes translate mRNA into polypeptide chains (proteins). They can be found free in the cytoplasm or bound to the endoplasmic reticulum.',
  },
  {
    id: 'q3',
    topic: 'Cell Biology',
    text: 'Which structure regulates the transport of materials in and out of the nucleus?',
    options: [
      { id: 'a', text: 'Cell membrane' },
      { id: 'b', text: 'Nuclear envelope' },
      { id: 'c', text: 'Cytoskeleton' },
      { id: 'd', text: 'Vacuole' },
    ],
    correctAnswer: 'b',
    selectedAnswer: 'b',
    explanation:
      'The nuclear envelope (with its nuclear pores) controls the movement of molecules between the nucleus and cytoplasm, allowing selective transport of RNA and proteins.',
  },
  {
    id: 'q4',
    topic: 'Genetics',
    text: 'In Mendelian genetics, what is the expected phenotypic ratio of a monohybrid cross between two heterozygous parents?',
    options: [
      { id: 'a', text: '1:1' },
      { id: 'b', text: '1:2:1' },
      { id: 'c', text: '3:1' },
      { id: 'd', text: '9:3:3:1' },
    ],
    correctAnswer: 'c',
    selectedAnswer: 'a',
    explanation:
      'A monohybrid cross (Aa x Aa) yields a 3:1 phenotypic ratio: three offspring displaying the dominant phenotype for every one displaying the recessive phenotype.',
  },
  {
    id: 'q5',
    topic: 'Genetics',
    text: 'Which type of mutation involves the insertion or deletion of nucleotides that shifts the reading frame of the gene?',
    options: [
      { id: 'a', text: 'Silent mutation' },
      { id: 'b', text: 'Missense mutation' },
      { id: 'c', text: 'Frameshift mutation' },
      { id: 'd', text: 'Point mutation' },
    ],
    correctAnswer: 'c',
    selectedAnswer: 'c',
    explanation:
      'Frameshift mutations result from insertions or deletions of nucleotides (not in multiples of three), shifting the reading frame and typically producing a nonfunctional protein.',
  },
];

const MOCK_AI_SUMMARY =
  'Strong performance overall with 80% accuracy. You demonstrated excellent understanding of Cell Biology concepts, answering all three questions correctly. In Genetics, you struggled with phenotypic ratios from Mendelian crosses — review Punnett squares and dominant/recessive inheritance patterns. Focus your next study session on monohybrid and dihybrid crosses to solidify this foundational concept.';

interface TopicBreakdown {
  name: string;
  correct: number;
  total: number;
}

const MOCK_TOPICS: TopicBreakdown[] = [
  { name: 'Cell Biology', correct: 3, total: 3 },
  { name: 'Genetics', correct: 1, total: 2 },
];

const TOTAL_CORRECT = 4;
const TOTAL_QUESTIONS = 5;
const TOTAL_SKIPPED = 0;
const SCORE_PCT = Math.round((TOTAL_CORRECT / TOTAL_QUESTIONS) * 100);
const TEST_DURATION = 483; // seconds

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGradeLetter(pct: number): string {
  if (pct >= 97) return 'A+';
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 60) return 'D';
  return 'F';
}

// ---------------------------------------------------------------------------
// Score Ring Component
// ---------------------------------------------------------------------------

interface ScoreRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

function ScoreRing({ percentage, size = 120, strokeWidth = 10 }: ScoreRingProps) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;
  const color = colors.primary;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Foreground circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Center text overlay */}
      <View style={StyleSheet.absoluteFillObject as any}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <Text
              style={{
                fontSize: 36,
                fontFamily: FONTS.displayBold,
                color: colors.textPrimary,
                lineHeight: 36 * 1.2,
              }}
            >
              {percentage}
            </Text>
            <Text
              style={{
                fontSize: FONT_SIZES.base,
                fontFamily: FONTS.sansMedium,
                color: colors.textMuted,
                marginBottom: 4,
                lineHeight: FONT_SIZES.base * 1.5,
              }}
            >
              %
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Typing Text Component
// ---------------------------------------------------------------------------

function TypingText({ text, speed = 18 }: { text: string; speed?: number }) {
  const { colors } = useTheme();
  const [displayedLength, setDisplayedLength] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDisplayedLength(0);
    intervalRef.current = setInterval(() => {
      setDisplayedLength((prev) => {
        if (prev >= text.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed]);

  return (
    <Text
      style={{
        fontSize: FONT_SIZES.sm + 1,
        fontFamily: FONTS.sansRegular,
        color: colors.textPrimary,
        lineHeight: (FONT_SIZES.sm + 1) * 1.6,
      }}
    >
      {text.slice(0, displayedLength)}
      {displayedLength < text.length && (
        <Text style={{ color: colors.primary }}>|</Text>
      )}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Question Card Component
// ---------------------------------------------------------------------------

function QuestionCard({ question, index }: { question: MockQuestion; index: number }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const isCorrect = question.selectedAnswer === question.correctAnswer;
  const wasSkipped = question.selectedAnswer === null;

  const statusColor = wasSkipped
    ? colors.textFaint
    : isCorrect
      ? colors.success
      : colors.error;

  const statusIcon = wasSkipped
    ? 'remove-circle'
    : isCorrect
      ? 'checkmark-circle'
      : 'close-circle';

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  const firstLine = question.text.length > 60
    ? question.text.slice(0, 60) + '...'
    : question.text;

  const selectedOption = question.options.find((o) => o.id === question.selectedAnswer);
  const correctOption = question.options.find((o) => o.id === question.correctAnswer);

  return (
    <Pressable onPress={toggleExpanded}>
      <Card style={{ marginBottom: SPACING.sm, backgroundColor: colors.surface }}>
        {/* Collapsed header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: statusColor + '20',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={statusIcon as any} size={18} color={statusColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: FONT_SIZES.xs,
                fontFamily: FONTS.sansSemiBold,
                color: colors.textMuted,
                marginBottom: 2,
                lineHeight: FONT_SIZES.xs * 1.5,
              }}
            >
              Question {index + 1}
            </Text>
            {!expanded && (
              <Text
                style={{
                  fontSize: FONT_SIZES.sm + 1,
                  fontFamily: FONTS.sansRegular,
                  color: colors.textPrimary,
                  lineHeight: (FONT_SIZES.sm + 1) * 1.5,
                }}
                numberOfLines={1}
              >
                {firstLine}
              </Text>
            )}
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textFaint}
          />
        </View>

        {/* Expanded body */}
        {expanded && (
          <View style={{ marginTop: SPACING.md, gap: SPACING.sm }}>
            {/* Full question */}
            <Text
              style={{
                fontSize: FONT_SIZES.base,
                fontFamily: FONTS.sansRegular,
                color: colors.textPrimary,
                lineHeight: FONT_SIZES.base * 1.6,
              }}
            >
              {question.text}
            </Text>

            {/* Selected answer (red if wrong) */}
            {!wasSkipped && !isCorrect && selectedOption && (
              <View
                style={{
                  backgroundColor: colors.errorLight,
                  borderRadius: RADIUS.sm,
                  padding: SPACING.sm + 2,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.error,
                }}
              >
                <Text
                  style={{
                    fontSize: FONT_SIZES.xs,
                    fontFamily: FONTS.sansSemiBold,
                    color: colors.error,
                    marginBottom: 2,
                    lineHeight: FONT_SIZES.xs * 1.5,
                  }}
                >
                  Your Answer
                </Text>
                <Text
                  style={{
                    fontSize: FONT_SIZES.sm + 1,
                    fontFamily: FONTS.sansRegular,
                    color: colors.error,
                    lineHeight: (FONT_SIZES.sm + 1) * 1.5,
                  }}
                >
                  {selectedOption.text}
                </Text>
              </View>
            )}

            {/* Correct answer (green) */}
            {correctOption && (
              <View
                style={{
                  backgroundColor: colors.successLight,
                  borderRadius: RADIUS.sm,
                  padding: SPACING.sm + 2,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.success,
                }}
              >
                <Text
                  style={{
                    fontSize: FONT_SIZES.xs,
                    fontFamily: FONTS.sansSemiBold,
                    color: colors.success,
                    marginBottom: 2,
                    lineHeight: FONT_SIZES.xs * 1.5,
                  }}
                >
                  Correct Answer
                </Text>
                <Text
                  style={{
                    fontSize: FONT_SIZES.sm + 1,
                    fontFamily: FONTS.sansRegular,
                    color: colors.success,
                    lineHeight: (FONT_SIZES.sm + 1) * 1.5,
                  }}
                >
                  {correctOption.text}
                </Text>
              </View>
            )}

            {/* Explanation */}
            {question.explanation && (
              <View
                style={{
                  backgroundColor: colors.primaryLight,
                  borderRadius: RADIUS.sm,
                  padding: SPACING.sm + 2,
                }}
              >
                <Text
                  style={{
                    fontSize: FONT_SIZES.xs,
                    fontFamily: FONTS.sansSemiBold,
                    color: colors.textMuted,
                    marginBottom: 4,
                    lineHeight: FONT_SIZES.xs * 1.5,
                  }}
                >
                  Explanation
                </Text>
                <Text
                  style={{
                    fontSize: FONT_SIZES.sm,
                    fontFamily: FONTS.sansRegular,
                    color: colors.textMuted,
                    lineHeight: FONT_SIZES.sm * 1.6,
                  }}
                >
                  {question.explanation}
                </Text>
              </View>
            )}
          </View>
        )}
      </Card>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function TestResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [aiLoading, setAiLoading] = useState(true);

  // Simulate AI summary loading
  useEffect(() => {
    const timer = setTimeout(() => setAiLoading(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const scoreColor = getScoreColor(SCORE_PCT);
  const scoreBgColor = getScoreBgColor(SCORE_PCT);
  const grade = getGradeLetter(SCORE_PCT);
  const incorrect = TOTAL_QUESTIONS - TOTAL_CORRECT - TOTAL_SKIPPED;

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `I scored ${SCORE_PCT}% (${TOTAL_CORRECT}/${TOTAL_QUESTIONS}) on my TestGen quiz! Grade: ${grade}`,
      });
    } catch {
      // User cancelled
    }
  }, [grade]);

  const handleBackToDashboard = useCallback(() => {
    router.replace('/(tabs)');
  }, [router]);

  const handleNewTest = useCallback(() => {
    router.replace('/(tabs)/generate');
  }, [router]);

  const handleReviewFlashcards = useCallback(() => {
    router.push('/(tabs)/study');
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SPACING.screenH, paddingTop: insets.top + SPACING.md, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ----------------------------------------------------------------- */}
        {/* Action Row                                                        */}
        {/* ----------------------------------------------------------------- */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.lg,
          }}
        >
          <Pressable
            onPress={handleBackToDashboard}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text
              style={{
                fontSize: FONT_SIZES.base,
                fontFamily: FONTS.sansSemiBold,
                color: colors.primary,
                lineHeight: FONT_SIZES.base * 1.5,
              }}
            >
              Dashboard
            </Text>
          </Pressable>

          <Pressable
            onPress={handleShare}
            style={{
              width: 44,
              height: 44,
              borderRadius: RADIUS.full,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="share-outline" size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* ----------------------------------------------------------------- */}
        {/* Score Hero Section                                                */}
        {/* ----------------------------------------------------------------- */}
        <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
          <ScoreRing percentage={SCORE_PCT} />

          <Text
            style={{
              fontSize: FONT_SIZES.xxl,
              fontFamily: FONTS.displayBold,
              color: scoreColor,
              marginTop: SPACING.md,
              lineHeight: FONT_SIZES.xxl * 1.2,
            }}
          >
            {grade}
          </Text>

          <Text
            style={{
              fontSize: FONT_SIZES.sm + 1,
              fontFamily: FONTS.sansRegular,
              color: colors.textMuted,
              marginTop: SPACING.xs,
              lineHeight: (FONT_SIZES.sm + 1) * 1.5,
            }}
          >
            {TOTAL_CORRECT} of {TOTAL_QUESTIONS} correct  ·  {formatDuration(TEST_DURATION)}
          </Text>

          {/* Stat chips */}
          <View
            style={{
              flexDirection: 'row',
              gap: SPACING.sm,
              marginTop: SPACING.md,
            }}
          >
            <Badge text={`${TOTAL_CORRECT} Correct`} color={colors.success} size="md" />
            <Badge text={`${incorrect} Incorrect`} color={colors.error} size="md" />
            <Badge text={`${TOTAL_SKIPPED} Skipped`} color={colors.textFaint} size="md" />
          </View>
        </View>

        {/* ----------------------------------------------------------------- */}
        {/* AI Summary Card                                                   */}
        {/* ----------------------------------------------------------------- */}
        <View
          style={{
            backgroundColor: colors.primaryLight,
            borderRadius: RADIUS.lg,
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
            padding: SPACING.md,
            marginBottom: SPACING.lg,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.sm,
              marginBottom: SPACING.sm,
            }}
          >
            <Ionicons name="sparkles" size={18} color={colors.primary} />
            <Text
              style={{
                fontSize: FONT_SIZES.base,
                fontFamily: FONTS.sansBold,
                color: colors.primary,
                lineHeight: FONT_SIZES.base * 1.5,
              }}
            >
              AI Analysis
            </Text>
          </View>

          {aiLoading ? (
            <ShimmerBlock lines={4} />
          ) : (
            <TypingText text={MOCK_AI_SUMMARY} />
          )}
        </View>

        {/* ----------------------------------------------------------------- */}
        {/* Topic Breakdown                                                   */}
        {/* ----------------------------------------------------------------- */}
        <Text
          style={{
            fontSize: FONT_SIZES.md + 1,
            fontFamily: FONTS.displaySemiBold,
            color: colors.textPrimary,
            marginBottom: SPACING.sm,
            lineHeight: (FONT_SIZES.md + 1) * 1.2,
          }}
        >
          Topic Breakdown
        </Text>

        <Card style={{ marginBottom: SPACING.lg }}>
          {MOCK_TOPICS.map((topic, i) => {
            const topicPct = Math.round((topic.correct / topic.total) * 100);
            const topicColor = getScoreColor(topicPct);

            return (
              <View
                key={topic.name}
                style={{
                  marginBottom: i < MOCK_TOPICS.length - 1 ? SPACING.md : 0,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: SPACING.xs + 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: FONT_SIZES.sm + 1,
                      fontFamily: FONTS.sansSemiBold,
                      color: colors.textPrimary,
                      lineHeight: (FONT_SIZES.sm + 1) * 1.5,
                    }}
                  >
                    {topic.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: FONT_SIZES.sm,
                      fontFamily: FONTS.sansSemiBold,
                      color: topicColor,
                      lineHeight: FONT_SIZES.sm * 1.5,
                    }}
                  >
                    {topic.correct}/{topic.total}
                  </Text>
                </View>
                <ProgressBar
                  progress={topic.correct / topic.total}
                  color={topicColor}
                  height={6}
                  animated
                />
              </View>
            );
          })}
        </Card>

        {/* ----------------------------------------------------------------- */}
        {/* Question Review                                                   */}
        {/* ----------------------------------------------------------------- */}
        <Text
          style={{
            fontSize: FONT_SIZES.md + 1,
            fontFamily: FONTS.displaySemiBold,
            color: colors.textPrimary,
            marginBottom: SPACING.sm,
            lineHeight: (FONT_SIZES.md + 1) * 1.2,
          }}
        >
          Question Review
        </Text>

        {MOCK_QUESTIONS.map((question, index) => (
          <QuestionCard key={question.id} question={question} index={index} />
        ))}

        {/* ----------------------------------------------------------------- */}
        {/* CTA Buttons                                                       */}
        {/* ----------------------------------------------------------------- */}
        <View style={{ gap: SPACING.sm, marginTop: SPACING.md }}>
          <Button
            label="Create New Test"
            onPress={handleNewTest}
            size="lg"
            icon={<Ionicons name="add-circle" size={20} color={colors.textOnPrimary} />}
          />
          <Button
            label="Review Flashcards"
            onPress={handleReviewFlashcards}
            variant="outline"
            size="lg"
            icon={<Ionicons name="albums-outline" size={20} color={colors.textMuted} />}
          />
          <Button
            label="Back to Dashboard"
            onPress={handleBackToDashboard}
            variant="ghost"
            size="lg"
            icon={<Ionicons name="arrow-back" size={18} color={colors.textMuted} />}
          />
        </View>
      </ScrollView>
    </View>
  );
}
