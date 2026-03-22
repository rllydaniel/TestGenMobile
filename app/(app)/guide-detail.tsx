import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { subjects } from '@/lib/subjects';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

// -- Mock guide data --
interface GuideSection {
  id: string;
  title: string;
  paragraphs: string[];
  callout?: string;
  bullets?: string[];
}

const MOCK_SECTIONS: GuideSection[] = [
  {
    id: 'overview',
    title: 'Overview & Key Concepts',
    paragraphs: [
      'This study guide covers the essential concepts you need to master for your exam. Each section is structured to build on the previous one, taking you from foundational ideas to advanced problem-solving techniques.',
      'Before diving into specific topics, make sure you have a solid understanding of the prerequisite material. Review any areas where you feel uncertain, as later sections assume comfort with earlier concepts.',
      'Research shows that active recall and spaced repetition are the most effective study strategies. As you read through this guide, pause frequently to test yourself on what you have just learned rather than passively re-reading.',
    ],
    callout:
      'Study tip: Read each section once, then close the guide and try to recall the main points from memory. This single technique can improve retention by up to 50%.',
    bullets: [
      'Focus on understanding concepts, not memorizing formulas',
      'Practice with timed problems to build exam-day confidence',
      'Review mistakes carefully — they reveal your weak spots',
      'Use the "Quiz Me" feature after each section for active recall',
    ],
  },
  {
    id: 'core-strategies',
    title: 'Core Strategies & Techniques',
    paragraphs: [
      'Effective problem solving begins with a systematic approach. Before attempting any question, take a moment to identify what type of problem it is and which strategy applies. This saves time and reduces careless errors.',
      'Elimination is one of the most powerful test-taking strategies. On multiple-choice questions, start by ruling out answers you know are wrong. Even eliminating one option significantly improves your odds if you need to make an educated guess.',
      'Time management is critical. Allocate your time based on point values and difficulty. Do not spend five minutes on a single question when that time could earn you points on three easier ones. Mark difficult questions and return to them after completing the rest.',
    ],
    callout:
      'Pro tip: On standardized tests, every question is worth the same number of points. Answer the easy ones first to lock in guaranteed points, then tackle harder questions with remaining time.',
    bullets: [
      'Read the entire question before looking at answer choices',
      'Underline key words like "NOT", "EXCEPT", and "ALWAYS"',
      'Show your work — it helps catch errors and earns partial credit',
      'Double-check units and labels in your final answers',
    ],
  },
  {
    id: 'practice-review',
    title: 'Practice & Review Methods',
    paragraphs: [
      'The final stage of preparation is structured practice. Take full-length practice tests under realistic conditions: timed, no notes, and in a quiet environment. This builds both your skills and your stamina for test day.',
      'After each practice test, conduct a thorough review. For every question you missed, identify whether the error was conceptual (you did not understand the material), procedural (you knew the concept but made a mistake), or careless (you understood everything but rushed). Each type of error requires a different fix.',
      'In the days before your exam, focus on review rather than learning new material. Revisit your notes, redo problems you previously got wrong, and make sure you are comfortable with the test format. Confidence on test day comes from thorough preparation.',
    ],
    callout:
      'Remember: Consistency beats intensity. Studying 30 minutes every day for two weeks is far more effective than cramming for 7 hours the night before. Start early and build a study schedule you can stick with.',
  },
];

// -- Component --
export default function GuideDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const tocScrollRef = useRef<ScrollView>(null);

  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0];
  const [activeSection, setActiveSection] = useState(MOCK_SECTIONS[0].id);
  const sectionOffsets = useRef<Record<string, number>>({});

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y + 120;
      let current = MOCK_SECTIONS[0].id;
      for (const section of MOCK_SECTIONS) {
        const offset = sectionOffsets.current[section.id];
        if (offset !== undefined && y >= offset) {
          current = section.id;
        }
      }
      if (current !== activeSection) {
        setActiveSection(current);
      }
    },
    [activeSection],
  );

  const scrollToSection = useCallback((sectionId: string) => {
    const offset = sectionOffsets.current[sectionId];
    if (offset !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: offset - 100, animated: true });
    }
    setActiveSection(sectionId);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + SPACING.xs }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerSubject, { color: colors.textPrimary }]} numberOfLines={1}>
            {subject.name}
          </Text>
        </View>
        <Pressable style={styles.bookmarkBtn}>
          <Ionicons name="bookmark-outline" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Sticky table of contents pills */}
      <View style={[styles.tocContainer, { borderBottomColor: colors.border, backgroundColor: colors.appBackground }]}>
        <ScrollView
          ref={tocScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tocContent}
        >
          {MOCK_SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <Pressable
                key={section.id}
                onPress={() => scrollToSection(section.id)}
                style={[
                  styles.tocPill,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tocPillText,
                    { color: isActive ? colors.textOnPrimary : colors.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {section.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Scrollable body */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
      >
        {/* Guide title */}
        <Text style={[styles.guideTitle, { color: colors.textPrimary }]}>{subject.name} Study Guide</Text>
        <Text style={[styles.guideMeta, { color: colors.textMuted }]}>
          {MOCK_SECTIONS.length} sections · {subject.topics.length} topics covered
        </Text>

        {MOCK_SECTIONS.map((section) => (
          <View
            key={section.id}
            onLayout={(e) => {
              sectionOffsets.current[section.id] = e.nativeEvent.layout.y;
            }}
            style={styles.section}
          >
            {/* Section header */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{section.title}</Text>

            {/* Paragraphs */}
            {section.paragraphs.map((para, idx) => (
              <Text key={idx} style={[styles.paragraph, { color: colors.textMuted }]}>
                {para}
              </Text>
            ))}

            {/* Callout box */}
            {section.callout && (
              <View style={[styles.calloutBox, { backgroundColor: colors.primaryLight, borderLeftColor: colors.primary }]}>
                <View style={styles.calloutIcon}>
                  <Ionicons name="bulb" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.calloutText, { color: colors.textPrimary }]}>{section.callout}</Text>
              </View>
            )}

            {/* Bullet points */}
            {section.bullets && section.bullets.length > 0 && (
              <View style={styles.bulletList}>
                {section.bullets.map((bullet, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.bulletText, { color: colors.textMuted }]}>{bullet}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Bottom spacer for floating button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating "Quiz Me on This" button */}
      <View style={[styles.floatingButtonContainer, { bottom: insets.bottom + SPACING.md }]}>
        <Button
          label="Quiz Me on This"
          onPress={() =>
            router.push({
              pathname: '/(app)/test/setup',
              params: { subjectId: subject.id },
            } as any)
          }
          icon={<Ionicons name="help-circle" size={20} color={colors.textOnPrimary} />}
          size="lg"
          style={styles.floatingButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // -- Header --
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenH,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubject: {
    fontSize: FONT_SIZES.md + 1,
    fontFamily: FONTS.sansBold,
    lineHeight: (FONT_SIZES.md + 1) * 1.2,
  },
  bookmarkBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // -- Table of Contents --
  tocContainer: {
    borderBottomWidth: 1,
  },
  tocContent: {
    paddingHorizontal: SPACING.screenH,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  tocPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  tocPillText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.xs * 1.5,
  },

  // -- Body --
  body: {
    paddingHorizontal: SPACING.screenH,
    paddingTop: SPACING.lg,
  },
  guideTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.displaySemiBold,
    marginBottom: SPACING.xs,
    lineHeight: FONT_SIZES.xl * 1.2,
  },
  guideMeta: {
    fontSize: FONT_SIZES.sm + 1,
    fontFamily: FONTS.sansRegular,
    marginBottom: SPACING.lg,
    lineHeight: (FONT_SIZES.sm + 1) * 1.5,
  },

  // -- Sections --
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.displaySemiBold,
    marginBottom: SPACING.md,
    lineHeight: FONT_SIZES.lg * 1.2,
  },
  paragraph: {
    fontSize: 16,
    fontFamily: FONTS.sansRegular,
    lineHeight: 16 * 1.6,
    marginBottom: SPACING.md,
  },

  // -- Callout --
  calloutBox: {
    borderLeftWidth: 3,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
    marginVertical: SPACING.md,
  },
  calloutIcon: {
    marginTop: 2,
  },
  calloutText: {
    flex: 1,
    fontSize: FONT_SIZES.sm + 1,
    fontFamily: FONTS.sansRegular,
    lineHeight: (FONT_SIZES.sm + 1) * 1.6,
  },

  // -- Bullets --
  bulletList: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.base * 1.6,
  },

  // -- Floating Button --
  floatingButtonContainer: {
    position: 'absolute',
    left: SPACING.screenH,
    right: SPACING.screenH,
  },
  floatingButton: {
    ...SHADOWS.primary,
  },
});
