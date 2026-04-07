import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';
import { generateTest, resolveQuestionTypes } from '@/lib/api/generateTest';

const SUBTEXTS = [
  'Crafting questions tailored to your topics...',
  'Calibrating difficulty to your level...',
  'Preparing your personalized session...',
  'Almost ready — just a few more seconds...',
];

const STAGES = [
  'Analyzing topics',
  'Writing questions',
  'Reviewing answers',
  'Finalizing...',
];

export default function GeneratingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    subject: string;
    topics: string;
    questionCount: string;
    questionType: string;
    difficulty: string;
    studyMode: string;
    timerEnabled: string;
    timerMinutes: string;
    focusMode: string;
  }>();

  const [subtextIdx, setSubtextIdx] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const floatRotate = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;
  const cancelOpacity = useRef(new Animated.Value(0)).current;
  const pageFlip = useRef(new Animated.Value(0)).current;

  const cancelled = useRef(false);

  /* ---------- Animations ---------- */

  useEffect(() => {
    // Non-linear progress
    Animated.sequence([
      Animated.timing(progressAnim, { toValue: 0.25, duration: 1500, useNativeDriver: false, easing: Easing.out(Easing.quad) }),
      Animated.timing(progressAnim, { toValue: 0.6, duration: 3000, useNativeDriver: false, easing: Easing.inOut(Easing.quad) }),
      Animated.timing(progressAnim, { toValue: 0.85, duration: 4000, useNativeDriver: false, easing: Easing.out(Easing.cubic) }),
    ]).start();

    // Floating book — gentle bob up and down
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -14, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(floatY, { toValue: 0, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]),
    );
    float.start();

    // Subtle tilt
    const tilt = Animated.loop(
      Animated.sequence([
        Animated.timing(floatRotate, { toValue: 1, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(floatRotate, { toValue: -1, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(floatRotate, { toValue: 0, duration: 1400, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]),
    );
    tilt.start();

    // Glow pulse
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.15, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(glowScale, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]),
    );
    glow.start();

    const glowFade = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.75, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(glowOpacity, { toValue: 0.4, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]),
    );
    glowFade.start();

    // Page flip animation — subtle scaleX oscillation
    const flip = Animated.loop(
      Animated.sequence([
        Animated.timing(pageFlip, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pageFlip, { toValue: 0, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]),
    );
    flip.start();

    // Sparkle particles — each loops with stagger
    const makeSparkle = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );
    const s1 = makeSparkle(sparkle1, 0);
    const s2 = makeSparkle(sparkle2, 600);
    const s3 = makeSparkle(sparkle3, 1200);
    s1.start(); s2.start(); s3.start();

    // Cancel button fade in after 2s
    const cancelTimer = setTimeout(() => {
      Animated.timing(cancelOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 2000);

    return () => {
      clearTimeout(cancelTimer);
      float.stop(); tilt.stop(); glow.stop(); glowFade.stop(); flip.stop();
      s1.stop(); s2.stop(); s3.stop();
    };
  }, []);

  // Cycle subtext every 2.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setSubtextIdx((i) => (i + 1) % SUBTEXTS.length);
      setStageIdx((i) => Math.min(i + 1, STAGES.length - 1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  /* ---------- Generation call ---------- */

  const runGeneration = useCallback(async () => {
    try {
      const questionCount = parseInt(params.questionCount ?? '10', 10);
      const questionType = params.questionType ?? 'multiple-choice';
      const resolvedTypes = resolveQuestionTypes(questionType as any);
      const topics = params.topics ? JSON.parse(params.topics) : [params.subject];

      const result = await generateTest({
        subject: params.subject ?? 'General',
        questionCount,
        difficulty: (params.difficulty as any) ?? 'mixed',
        questionTypes: resolvedTypes,
        timeLimit: params.timerEnabled === 'true' ? parseInt(params.timerMinutes ?? '10', 10) * 60 : null,
        studyMode: params.studyMode === 'true',
        focusMode: params.focusMode === 'true',
        topics,
      });

      if (cancelled.current) return;

      sessionIdRef.current = result.sessionId;
      setDone(true);

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        if (!cancelled.current) {
          router.replace({
            pathname: '/(app)/test/[id]',
            params: { id: result.sessionId },
          });
        }
      });
    } catch (e: any) {
      if (!cancelled.current) {
        setError(e?.message ?? 'Something went wrong. Please try again.');
      }
    }
  }, [params]);

  useEffect(() => {
    runGeneration();
    return () => { cancelled.current = true; };
  }, []);

  /* ---------- Interpolations ---------- */

  const bookRotate = floatRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-3deg', '0deg', '3deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Sparkle helpers
  const makeSparkleStyle = (anim: Animated.Value, xOffset: number, startY: number) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.3, 0.8, 1], outputRange: [0, 1, 0.6, 0] }),
    transform: [
      { translateX: xOffset },
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [startY, startY - 50] }) },
      { scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.3] }) },
    ],
  });

  // Page lines subtle movement
  const pageLineOffset = pageFlip.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });

  const CIRCLE_SIZE = 140;

  /* ---------- Error state ---------- */
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.appBackground, paddingTop: insets.top }]}>
        <View style={styles.errorBox}>
          <View style={{ width: 64, height: 64, borderRadius: RADIUS.full, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Generation Failed</Text>
          <Text style={[styles.errorDesc, { color: colors.textMuted }]}>{error}</Text>
          <Pressable
            onPress={() => { setError(null); cancelled.current = false; runGeneration(); }}
            style={[styles.retryBtn, { backgroundColor: colors.primary, ...SHADOWS.primary }]}
          >
            <Text style={[styles.retryText, { color: '#FFFFFF' }]}>Try Again</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={{ marginTop: SPACING.sm, minHeight: 44, justifyContent: 'center' }}>
            <Text style={[styles.cancelText, { color: colors.textMuted }]}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground, paddingTop: insets.top }]}>
      {/* Subject badge */}
      <View style={[styles.subjectBadge, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.subjectText, { color: colors.primary }]}>{params.subject}</Text>
      </View>

      {/* Config summary */}
      <Text style={[styles.configText, { color: colors.textMuted }]}>
        {params.questionCount ?? '10'} questions · {params.difficulty ?? 'Mixed'} · {params.questionType?.replace('-', ' ') ?? 'Multiple Choice'}
      </Text>

      {/* Center animation */}
      <View style={styles.animCenter}>
        {/* Glow circle */}
        <Animated.View
          style={[
            styles.glowCircle,
            {
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              borderRadius: CIRCLE_SIZE / 2,
              backgroundColor: colors.primaryLight,
              transform: [{ scale: glowScale }],
              opacity: glowOpacity,
            },
          ]}
        />

        {/* Second glow ring */}
        <Animated.View
          style={[
            styles.glowCircle,
            {
              width: CIRCLE_SIZE + 40,
              height: CIRCLE_SIZE + 40,
              borderRadius: (CIRCLE_SIZE + 40) / 2,
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderColor: colors.primary + '20',
              transform: [{ scale: glowScale }],
              opacity: glowOpacity,
            },
          ]}
        />

        {/* Sparkle particles */}
        <Animated.View style={[styles.sparkle, makeSparkleStyle(sparkle1, -30, 10)]}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
        </Animated.View>
        <Animated.View style={[styles.sparkle, makeSparkleStyle(sparkle2, 28, 5)]}>
          <Ionicons name="star" size={10} color={colors.primary + 'AA'} />
        </Animated.View>
        <Animated.View style={[styles.sparkle, makeSparkleStyle(sparkle3, -8, 15)]}>
          <Ionicons name="sparkles" size={11} color={colors.primary + '88'} />
        </Animated.View>

        {/* Floating book */}
        <Animated.View
          style={[
            styles.bookContainer,
            {
              transform: [
                { translateY: floatY },
                { rotate: bookRotate },
              ],
            },
          ]}
        >
          {/* Book body */}
          <View style={[styles.bookBody, { backgroundColor: colors.primary }]}>
            {/* Book spine */}
            <View style={[styles.bookSpine, { backgroundColor: colors.primary + 'CC' }]} />
            {/* Page lines */}
            <View style={styles.pageArea}>
              <Animated.View style={[styles.pageLine, { backgroundColor: '#FFFFFF50', transform: [{ translateX: pageLineOffset }] }]} />
              <Animated.View style={[styles.pageLine, { backgroundColor: '#FFFFFF40', width: 22, transform: [{ translateX: pageLineOffset }] }]} />
              <Animated.View style={[styles.pageLine, { backgroundColor: '#FFFFFF35', width: 18, transform: [{ translateX: pageLineOffset }] }]} />
            </View>
            {/* Book icon overlay */}
            <View style={styles.bookIconOverlay}>
              <Ionicons name="book" size={28} color="#FFFFFF" />
            </View>
          </View>
          {/* Book shadow */}
          <View style={[styles.bookShadow, { backgroundColor: colors.primary + '15' }]} />
        </Animated.View>
      </View>

      {/* Heading */}
      <Text style={[styles.heading, { color: colors.textPrimary }]}>Building your test</Text>
      <Text style={[styles.subtext, { color: colors.textMuted }]}>{SUBTEXTS[subtextIdx]}</Text>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.primary }]} />
      </View>

      {/* Stage label */}
      <Text style={[styles.stageLabel, { color: colors.textFaint }]}>{STAGES[stageIdx]}</Text>

      {/* Cancel */}
      <Animated.View style={{ opacity: cancelOpacity }}>
        <Pressable
          onPress={() => { cancelled.current = true; router.back(); }}
          style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.screenH,
  },
  subjectBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    marginBottom: SPACING.sm,
  },
  subjectText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  configText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
    marginBottom: SPACING.xl,
  },
  animCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    width: 220,
    height: 220,
  },
  glowCircle: {
    position: 'absolute',
  },
  sparkle: {
    position: 'absolute',
  },
  bookContainer: {
    alignItems: 'center',
  },
  bookBody: {
    width: 72,
    height: 88,
    borderRadius: 6,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  pageArea: {
    position: 'absolute',
    top: 16,
    left: 16,
    gap: 6,
  },
  pageLine: {
    height: 2,
    width: 28,
    borderRadius: 1,
  },
  bookIconOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 10,
    opacity: 0.4,
  },
  bookShadow: {
    width: 56,
    height: 8,
    borderRadius: 28,
    marginTop: 8,
  },
  heading: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.displaySemiBold,
    textAlign: 'center',
    lineHeight: FONT_SIZES.xxl * 1.2,
    includeFontPadding: false,
    marginBottom: SPACING.sm,
  },
  subtext: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    textAlign: 'center',
    lineHeight: FONT_SIZES.sm * 1.6,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  progressTrack: {
    width: '100%',
    maxWidth: 280,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  stageLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.xs * 1.5,
    marginBottom: SPACING.xl,
  },
  cancelBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
    textDecorationLine: 'underline',
  },
  errorBox: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.displaySemiBold,
    includeFontPadding: false,
  },
  errorDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    textAlign: 'center',
    lineHeight: FONT_SIZES.sm * 1.6,
  },
  retryBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  retryText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },
});
