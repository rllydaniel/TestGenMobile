import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useFlashcardDeck } from '@/hooks/useFlashcards';
import { FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ResponseType = 'got_it' | 'almost' | 'missed';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastery: number;
  difficulty?: string;
  lastReviewed?: string;
  nextReview?: string;
}

/* ------------------------------------------------------------------ */
/*  Mock Data (fallback when deck has no cards)                        */
/* ------------------------------------------------------------------ */

const MOCK_FLASHCARDS: Flashcard[] = [
  {
    id: 'mock-1',
    front: 'What is the powerhouse of the cell?',
    back: 'The mitochondria is the powerhouse of the cell. It generates most of the cell\'s supply of ATP, used as a source of chemical energy.',
    mastery: 0.3,
    difficulty: 'learning',
    nextReview: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    front: 'What is the difference between mitosis and meiosis?',
    back: 'Mitosis produces two identical daughter cells for growth and repair. Meiosis produces four genetically different daughter cells (gametes) for sexual reproduction, with half the chromosome number.',
    mastery: 0.3,
    difficulty: 'learning',
    nextReview: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    front: 'Describe the structure of DNA.',
    back: 'DNA is a double-stranded helix made of nucleotides. Each nucleotide contains a phosphate group, deoxyribose sugar, and a nitrogenous base (A, T, G, or C). Bases pair A-T and G-C via hydrogen bonds.',
    mastery: 0,
    difficulty: 'new',
    nextReview: new Date().toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/*  Confetti Dot (simple animated circle for success screen)           */
/* ------------------------------------------------------------------ */

const ConfettiDot = React.memo(function ConfettiDot({
  color,
  delay,
  startX,
  startY,
}: {
  color: string;
  delay: number;
  startX: number;
  startY: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: startY,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        opacity: anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 0.8, 0],
        }),
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -80],
            }),
          },
          {
            scale: anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 1.3, 0.6],
            }),
          },
        ],
      }}
    />
  );
});

/* ------------------------------------------------------------------ */
/*  Flashcard Face                                                     */
/* ------------------------------------------------------------------ */

const FlashcardFace = React.memo(function FlashcardFace({
  side,
  text,
  subject,
  difficulty,
  animatedStyle,
  colors,
}: {
  side: 'front' | 'back';
  text: string;
  subject?: string;
  difficulty?: string;
  animatedStyle: object;
  colors: any;
}) {
  const isFront = side === 'front';

  function getDifficultyColor(diff: string): string {
    switch (diff) {
      case 'mastered':
        return colors.success;
      case 'learning':
        return colors.warning;
      case 'new':
        return colors.primary;
      default:
        return colors.warning;
    }
  }

  return (
    <Animated.View style={[styles.cardFace, { backgroundColor: colors.surface, borderColor: colors.border }, animatedStyle]}>
      {/* Top row: badges */}
      <View style={styles.cardBadgeRow}>
        {subject && <Badge text={subject} color={colors.primary} size="sm" />}
        {difficulty && (
          <Badge
            text={difficulty}
            color={getDifficultyColor(difficulty)}
            size="sm"
          />
        )}
      </View>

      {/* Label */}
      <Text style={[styles.cardLabel, { color: colors.textFaint }]}>
        {isFront ? 'QUESTION' : 'ANSWER'}
      </Text>

      {/* Content */}
      <Text style={[styles.cardText, { color: colors.textPrimary }]}>{text}</Text>

      {/* Hint */}
      {isFront && (
        <Text style={[styles.cardHint, { color: colors.textFaint }]}>Tap to reveal answer</Text>
      )}
    </Animated.View>
  );
});

/* ------------------------------------------------------------------ */
/*  Response Button                                                    */
/* ------------------------------------------------------------------ */

const ResponseButton = React.memo(function ResponseButton({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.responseBtn, { backgroundColor: color + '20', borderColor: color + '40' }]}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.responseBtnText, { color }]}>{label}</Text>
    </Pressable>
  );
});

/* ------------------------------------------------------------------ */
/*  Session Complete Screen                                            */
/* ------------------------------------------------------------------ */

const SessionComplete = React.memo(function SessionComplete({
  total,
  responses,
  onStudyAgain,
  onBack,
  colors,
}: {
  total: number;
  responses: Map<string, ResponseType>;
  onStudyAgain: () => void;
  onBack: () => void;
  colors: any;
}) {
  const gotIt = Array.from(responses.values()).filter((r) => r === 'got_it').length;
  const almost = Array.from(responses.values()).filter((r) => r === 'almost').length;
  const missed = Array.from(responses.values()).filter((r) => r === 'missed').length;
  const accuracy = total > 0 ? Math.round((gotIt / total) * 100) : 0;

  const confettiColors = [colors.primary, colors.success, colors.warning, colors.warning, '#9B59B6', '#1ABC9C'];
  const confettiDots = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        color: confettiColors[i % confettiColors.length],
        delay: i * 120,
        x: 30 + Math.random() * (SCREEN_WIDTH - 60),
        y: 60 + Math.random() * 120,
      })),
    [],
  );

  return (
    <View style={styles.completeContainer}>
      {/* Confetti */}
      {confettiDots.map((dot) => (
        <ConfettiDot
          key={dot.id}
          color={dot.color}
          delay={dot.delay}
          startX={dot.x}
          startY={dot.y}
        />
      ))}

      <View style={[styles.completeIcon, { backgroundColor: colors.warningLight }]}>
        <Ionicons name="trophy" size={48} color={colors.warning} />
      </View>

      <Text style={[styles.completeTitle, { color: colors.textPrimary }]}>Session Complete!</Text>
      <Text style={[styles.completeSubtitle, { color: colors.textMuted }]}>
        Great job reviewing all your flashcards
      </Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.success }]}>{gotIt}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Got it</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.warning }]}>{almost}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Almost</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statNumber, { color: colors.error }]}>{missed}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Missed</Text>
        </View>
      </View>

      {/* Accuracy bar */}
      <View style={[styles.accuracyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.accuracyHeader}>
          <Text style={[styles.accuracyLabel, { color: colors.textMuted }]}>Accuracy</Text>
          <Text style={[styles.accuracyValue, { color: colors.success }]}>{accuracy}%</Text>
        </View>
        <ProgressBar progress={accuracy / 100} color={colors.success} height={8} />
      </View>

      {/* Actions */}
      <View style={styles.completeActions}>
        <Button
          label="Study Again"
          onPress={onStudyAgain}
          size="lg"
          icon={<Ionicons name="refresh" size={18} color={colors.textOnPrimary} />}
          style={{ flex: 1 }}
        />
        <Button
          label="Back to Decks"
          onPress={onBack}
          variant="outline"
          size="lg"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
});

/* ------------------------------------------------------------------ */
/*  Main Screen                                                        */
/* ------------------------------------------------------------------ */

export default function FlashcardStudyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: deck } = useFlashcardDeck(id!);

  /* Use real flashcards if available, otherwise fall back to mocks */
  const flashcards: Flashcard[] = useMemo(() => {
    if (deck?.cards && deck.cards.length > 0) return deck.cards;
    return MOCK_FLASHCARDS;
  }, [deck]);

  const deckName = deck?.name ?? 'Study Session';
  const deckSubject = deck?.subject ?? 'Biology';

  /* ---------- state ---------- */

  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [responses, setResponses] = useState<Map<string, ResponseType>>(new Map());
  const [sessionComplete, setSessionComplete] = useState(false);

  /* ---------- animation ---------- */

  const flipAnim = useRef(new Animated.Value(0)).current;

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
    backfaceVisibility: 'hidden' as const,
  };
  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
    backfaceVisibility: 'hidden' as const,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  /* ---------- helpers ---------- */

  const haptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const flipCard = useCallback(() => {
    haptic();
    const toValue = flipped ? 0 : 180;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setFlipped(!flipped);
  }, [flipped, flipAnim, haptic]);

  const resetFlip = useCallback(() => {
    flipAnim.setValue(0);
    setFlipped(false);
  }, [flipAnim]);

  const handleResponse = useCallback(
    (type: ResponseType) => {
      haptic();
      const card = flashcards[currentIndex];
      setResponses((prev) => {
        const next = new Map(prev);
        next.set(card.id, type);
        return next;
      });

      // Move to next card or complete
      resetFlip();
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionComplete(true);
      }
    },
    [currentIndex, flashcards, haptic, resetFlip],
  );

  const handleGotIt = useCallback(() => handleResponse('got_it'), [handleResponse]);
  const handleAlmost = useCallback(() => handleResponse('almost'), [handleResponse]);
  const handleMissed = useCallback(() => handleResponse('missed'), [handleResponse]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      haptic();
      resetFlip();
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, haptic, resetFlip]);

  const handleNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      haptic();
      resetFlip();
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, flashcards.length, haptic, resetFlip]);

  const handleEndSession = useCallback(() => {
    haptic();
    setSessionComplete(true);
  }, [haptic]);

  const handleStudyAgain = useCallback(() => {
    haptic();
    setCurrentIndex(0);
    setFlipped(false);
    setResponses(new Map());
    setSessionComplete(false);
    flipAnim.setValue(0);
  }, [haptic, flipAnim]);

  const handleBack = useCallback(() => {
    haptic();
    router.back();
  }, [haptic, router]);

  /* ---------- derived ---------- */

  const progress = flashcards.length > 0 ? (currentIndex + 1) / flashcards.length : 0;
  const currentCard = flashcards[currentIndex];

  /* ---------- session complete ---------- */

  if (sessionComplete) {
    return (
      <View style={[styles.safe, { backgroundColor: colors.appBackground }]}>
        <View style={{ paddingTop: insets.top }} />
        <SessionComplete
          total={flashcards.length}
          responses={responses}
          onStudyAgain={handleStudyAgain}
          onBack={handleBack}
          colors={colors}
        />
      </View>
    );
  }

  /* ---------- render ---------- */

  return (
    <View style={[styles.safe, { backgroundColor: colors.appBackground }]}>
      <View style={{ paddingTop: insets.top }} />

      {/* ===== Header Bar ===== */}
      <View style={styles.headerBar}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          <Text style={[styles.backText, { color: colors.textPrimary }]}>Back</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Ionicons name="layers" size={16} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {deckName}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={[styles.counterText, { color: colors.textMuted }]}>
            {currentIndex + 1} / {flashcards.length}
          </Text>
          <Pressable onPress={handleEndSession} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={[styles.endSessionText, { color: colors.error }]}>End Session</Text>
          </Pressable>
        </View>
      </View>

      {/* ===== Progress ===== */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} color={colors.primary} height={4} />
        <Text style={[styles.reviewedText, { color: colors.textMuted }]}>
          {currentIndex + 1} of {flashcards.length} reviewed
        </Text>
      </View>

      {/* ===== Flashcard ===== */}
      <View style={styles.cardContainer}>
        <Pressable
          onPress={flipCard}
          style={styles.cardTouchable}
        >
          <View style={styles.cardWrapper}>
            {/* Front face */}
            <FlashcardFace
              side="front"
              text={currentCard.front}
              subject={deckSubject}
              difficulty={currentCard.difficulty}
              animatedStyle={frontAnimatedStyle}
              colors={colors}
            />
            {/* Back face */}
            <FlashcardFace
              side="back"
              text={currentCard.back}
              subject={deckSubject}
              difficulty={currentCard.difficulty}
              animatedStyle={backAnimatedStyle}
              colors={colors}
            />
          </View>
        </Pressable>
      </View>

      {/* ===== Navigation Arrows ===== */}
      <View style={styles.navRow}>
        <Pressable
          onPress={handlePrev}
          disabled={currentIndex === 0}
          style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }, currentIndex === 0 && { opacity: 0.3 }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
        </Pressable>
        <Text style={[styles.navLabel, { color: colors.textFaint }]}>Navigate cards</Text>
        <Pressable
          onPress={handleNext}
          disabled={currentIndex >= flashcards.length - 1}
          style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }, currentIndex >= flashcards.length - 1 && { opacity: 0.3 }]}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* ===== Response Buttons (after flip) ===== */}
      {flipped && (
        <View style={styles.responseBtnRow}>
          <ResponseButton
            label="Got it"
            icon="checkmark-circle"
            color={colors.success}
            onPress={handleGotIt}
          />
          <ResponseButton
            label="Almost"
            icon="help-circle"
            color={colors.warning}
            onPress={handleAlmost}
          />
          <ResponseButton
            label="Missed it"
            icon="close-circle"
            color={colors.error}
            onPress={handleMissed}
          />
        </View>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  /* header bar */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenH,
    paddingVertical: SPACING.sm + 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 44,
  },
  backText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansMedium,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  counterText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansMedium,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  endSessionText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.xs * 1.5,
  },

  /* progress */
  progressContainer: {
    paddingHorizontal: SPACING.screenH,
    marginBottom: SPACING.sm,
  },
  reviewedText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: FONT_SIZES.xs * 1.5,
  },

  /* card */
  cardContainer: {
    flex: 1,
    paddingHorizontal: SPACING.screenH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTouchable: {
    width: SCREEN_WIDTH - SPACING.screenH * 2,
    minHeight: 320,
  },
  cardWrapper: {
    width: '100%',
    minHeight: 320,
  },
  cardFace: {
    width: '100%',
    minHeight: 320,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBadgeRow: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansBold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  cardText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.sansBold,
    textAlign: 'center',
    lineHeight: FONT_SIZES.lg * 1.5,
  },
  cardHint: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    marginTop: SPACING.lg,
    lineHeight: FONT_SIZES.sm * 1.5,
  },

  /* navigation */
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
  },

  /* response buttons */
  responseBtnRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.screenH,
    paddingBottom: SPACING.md,
    gap: SPACING.sm + 2,
  },
  responseBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 4,
    minHeight: 44,
  },
  responseBtnText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.sm * 1.5,
  },

  /* session complete */
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  completeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  completeTitle: {
    fontSize: FONT_SIZES.xxl - 2,
    fontFamily: FONTS.displaySemiBold,
    marginBottom: SPACING.sm,
    lineHeight: (FONT_SIZES.xxl - 2) * 1.2,
  },
  completeSubtitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  statBox: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.sansBold,
    lineHeight: FONT_SIZES.xxl * 1.2,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    marginTop: 2,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  accuracyContainer: {
    width: '100%',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  accuracyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  accuracyLabel: {
    fontSize: FONT_SIZES.sm + 1,
    fontFamily: FONTS.sansMedium,
    lineHeight: (FONT_SIZES.sm + 1) * 1.5,
  },
  accuracyValue: {
    fontSize: FONT_SIZES.sm + 1,
    fontFamily: FONTS.sansBold,
    lineHeight: (FONT_SIZES.sm + 1) * 1.5,
  },
  completeActions: {
    flexDirection: 'row',
    gap: SPACING.sm + 4,
    width: '100%',
  },
});
