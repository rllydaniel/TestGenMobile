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
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';
import { generateTest, resolveQuestionTypes } from '@/lib/api/generateTest';
import { LogoMark } from '@/components/ui/LogoMark';

const SUBTEXTS = [
  'Analyzing your subject area…',
  'Selecting representative topics…',
  'Calibrating question difficulty…',
  'Almost ready for your diagnostic…',
];

const STAGES = [
  'Identifying key topics',
  'Writing diagnostic questions',
  'Reviewing coverage',
  'Finalizing…',
];

export default function PlanDiagnosticScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    subject: string;
    targetExam: string;
    targetDate: string;
    availableDays: string;
    minutesPerSession: string;
    goalScore: string;
  }>();

  const [subtextIdx, setSubtextIdx] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const orbitAngle1 = useRef(new Animated.Value(0)).current;
  const orbitAngle2 = useRef(new Animated.Value(0)).current;
  const orbitAngle3 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cancelOpacity = useRef(new Animated.Value(0)).current;

  const cancelled = useRef(false);

  /* ---------- Animations ---------- */

  useEffect(() => {
    Animated.sequence([
      Animated.timing(progressAnim, { toValue: 0.25, duration: 1500, useNativeDriver: false, easing: Easing.out(Easing.quad) }),
      Animated.timing(progressAnim, { toValue: 0.6, duration: 3000, useNativeDriver: false, easing: Easing.inOut(Easing.quad) }),
      Animated.timing(progressAnim, { toValue: 0.85, duration: 4000, useNativeDriver: false, easing: Easing.out(Easing.cubic) }),
    ]).start();

    const makeOrbit = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.timing(anim, { toValue: 1, duration: 2400, delay, useNativeDriver: true, easing: Easing.linear }),
      );
    const o1 = makeOrbit(orbitAngle1, 0);
    const o2 = makeOrbit(orbitAngle2, 800);
    const o3 = makeOrbit(orbitAngle3, 1600);
    o1.start(); o2.start(); o3.start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]),
    );
    pulse.start();

    const cancelTimer = setTimeout(() => {
      Animated.timing(cancelOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 2000);

    return () => {
      clearTimeout(cancelTimer);
      o1.stop(); o2.stop(); o3.stop(); pulse.stop();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtextIdx((i) => (i + 1) % SUBTEXTS.length);
      setStageIdx((i) => Math.min(i + 1, STAGES.length - 1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  /* ---------- Generation ---------- */

  const runGeneration = useCallback(async () => {
    try {
      const resolvedTypes = resolveQuestionTypes('multiple-choice');
      const result = await generateTest({
        subject: params.subject ?? 'General',
        questionCount: 15,
        difficulty: 'mixed',
        questionTypes: resolvedTypes,
        timeLimit: null,
        studyMode: false,
        topics: [params.subject ?? 'General'],
      });

      if (cancelled.current) return;

      Animated.timing(progressAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start(() => {
        if (!cancelled.current) {
          const diagnosticSetup = JSON.stringify({
            subject: params.subject,
            targetExam: params.targetExam,
            targetDate: params.targetDate,
            availableDays: params.availableDays,
            minutesPerSession: params.minutesPerSession,
            goalScore: params.goalScore,
          });
          router.replace({
            pathname: '/(app)/test/[id]',
            params: {
              id: result.sessionId,
              returnTo: 'plan/results',
              diagnosticSetup,
            },
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

  /* ---------- Orbit helpers ---------- */
  const ORBIT_RADIUS = 70;
  const DOT_SIZE = 10;
  const CIRCLE_SIZE = 160;

  const makeOrbitStyle = (anim: Animated.Value, phase: number) => {
    const rotate = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [`${phase}deg`, `${phase + 360}deg`],
    });
    return {
      position: 'absolute' as const,
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      backgroundColor: colors.primary,
      transform: [{ rotate }, { translateX: ORBIT_RADIUS }],
      opacity: 0.9,
    };
  };

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.appBackground, paddingTop: insets.top }]}>
        <View style={styles.errorBox}>
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Generation Failed</Text>
          <Text style={[styles.errorDesc, { color: colors.textMuted }]}>{error}</Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.retryBtn, { backgroundColor: colors.primary, ...SHADOWS.primary }]}
          >
            <Text style={[styles.retryText, { color: '#FFFFFF' }]}>Go Back</Text>
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

      <Text style={[styles.configText, { color: colors.textMuted }]}>
        15 diagnostic questions · Mixed difficulty
      </Text>

      {/* Center animation */}
      <View style={styles.animCenter}>
        <View
          style={[
            styles.orbitContainer,
            {
              width: (ORBIT_RADIUS + DOT_SIZE) * 2,
              height: (ORBIT_RADIUS + DOT_SIZE) * 2,
              borderRadius: (ORBIT_RADIUS + DOT_SIZE),
            },
          ]}
        >
          <View style={[makeOrbitStyle(orbitAngle1, 0), { position: 'absolute', top: ORBIT_RADIUS + DOT_SIZE / 2, left: ORBIT_RADIUS + DOT_SIZE / 2 }]} />
          <View style={[makeOrbitStyle(orbitAngle2, 120), { position: 'absolute', top: ORBIT_RADIUS + DOT_SIZE / 2, left: ORBIT_RADIUS + DOT_SIZE / 2 }]} />
          <View style={[makeOrbitStyle(orbitAngle3, 240), { position: 'absolute', top: ORBIT_RADIUS + DOT_SIZE / 2, left: ORBIT_RADIUS + DOT_SIZE / 2 }]} />
        </View>

        <Animated.View
          style={[
            styles.pulseCircle,
            {
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              borderRadius: CIRCLE_SIZE / 2,
              backgroundColor: colors.primaryLight,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />

        <View style={[styles.markInner, { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2 }]}>
          <LogoMark size={72} />
        </View>
      </View>

      <Text style={[styles.heading, { color: colors.textPrimary }]}>Building your diagnostic</Text>
      <Text style={[styles.subtext, { color: colors.textMuted }]}>{SUBTEXTS[subtextIdx]}</Text>

      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.primary }]} />
      </View>

      <Text style={[styles.stageLabel, { color: colors.textFaint }]}>{STAGES[stageIdx]}</Text>

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
    width: 200,
    height: 200,
  },
  orbitContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: { position: 'absolute' },
  markInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    fontSize: 28,
    fontFamily: FONTS.displayBold,
    includeFontPadding: false,
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
  progressFill: { height: 4, borderRadius: 2 },
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
  errorBox: { alignItems: 'center', paddingHorizontal: SPACING.lg, gap: SPACING.md },
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
