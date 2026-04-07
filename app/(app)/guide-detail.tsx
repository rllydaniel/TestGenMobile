import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { StudyGuideRenderer } from '@/components/ui/StudyGuideRenderer';
import { StudyGuideChat } from '@/components/ui/StudyGuideChat';
import { Skeleton } from '@/components/ui/Skeleton';
import { subjects } from '@/lib/subjects';
import {
  useStudyGuide,
  useGenerateStudyGuide,
  StudyGuideSection,
} from '@/hooks/useStudyGuide';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

export default function GuideDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { subjectId, unit } = useLocalSearchParams<{ subjectId: string; unit?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const tocScrollRef = useRef<ScrollView>(null);

  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0];
  const { data: cachedGuide, isLoading: loadingCache } = useStudyGuide(subject.id, unit);
  const generateGuide = useGenerateStudyGuide();

  const [sections, setSections] = useState<StudyGuideSection[]>([]);
  const [activeSection, setActiveSection] = useState('');
  const [chatVisible, setChatVisible] = useState(false);
  const sectionOffsets = useRef<Record<string, number>>({});

  // Load cached or generate
  useEffect(() => {
    if (loadingCache) return;
    if (cachedGuide?.content && Array.isArray(cachedGuide.content) && cachedGuide.content.length > 0) {
      setSections(cachedGuide.content);
      setActiveSection(cachedGuide.content[0]?.id ?? '');
    } else if (!generateGuide.isPending && sections.length === 0) {
      generateGuide.mutate(
        { subject: subject.id, unit, topics: subject.topics.map((t) => t.name) },
        {
          onSuccess: (data) => {
            setSections(data);
            if (data.length > 0) setActiveSection(data[0].id);
          },
        }
      );
    }
  }, [loadingCache, cachedGuide]);

  const isGenerating = generateGuide.isPending || (loadingCache && sections.length === 0);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (sections.length === 0) return;
      const y = e.nativeEvent.contentOffset.y + 120;
      let current = sections[0].id;
      for (const section of sections) {
        const offset = sectionOffsets.current[section.id];
        if (offset !== undefined && y >= offset) {
          current = section.id;
        }
      }
      if (current !== activeSection) {
        setActiveSection(current);
      }
    },
    [activeSection, sections],
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
            {subject.name}{unit ? ` — ${subject.topics.find(t => t.id === unit)?.name ?? unit}` : ''}
          </Text>
        </View>
        <Pressable style={styles.bookmarkBtn}>
          <Ionicons name="bookmark-outline" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Sticky table of contents pills */}
      {sections.length > 0 && (
        <View style={[styles.tocContainer, { borderBottomColor: colors.border, backgroundColor: colors.appBackground }]}>
          <ScrollView
            ref={tocScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tocContent}
          >
            {sections.map((section) => {
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
      )}

      {/* Scrollable body */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
      >
        {/* Hero image */}
        {subject.coverImage ? (
          <View style={[styles.hero, { marginHorizontal: -SPACING.screenH, marginTop: -SPACING.lg }]}>
            <Image source={{ uri: subject.coverImage }} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroOverlay} />
          </View>
        ) : null}

        {/* Guide title */}
        <Text style={[styles.guideTitle, { color: colors.textPrimary }]}>
          {subject.name} Study Guide
        </Text>
        <Text style={[styles.guideMeta, { color: colors.textMuted }]}>
          {sections.length > 0 ? `${sections.length} sections` : 'Generating...'} · {subject.topics.length} topics covered
        </Text>

        {/* Loading skeleton */}
        {isGenerating && (
          <View style={{ gap: SPACING.xl }}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={{ gap: SPACING.sm }}>
                <Skeleton width="60%" height={22} />
                <Skeleton width="100%" height={14} />
                <Skeleton width="100%" height={14} />
                <Skeleton width="85%" height={14} />
                <Skeleton width="100%" height={14} />
                <Skeleton width="70%" height={14} />
              </View>
            ))}
            <View style={{ alignItems: 'center', paddingVertical: SPACING.lg }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.sm, color: colors.textMuted, marginTop: SPACING.sm }}>
                Generating your study guide...
              </Text>
            </View>
          </View>
        )}

        {/* Sections */}
        {sections.map((section) => (
          <View
            key={section.id}
            onLayout={(e) => {
              sectionOffsets.current[section.id] = e.nativeEvent.layout.y;
            }}
            style={styles.section}
          >
            {/* Section header */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{section.title}</Text>

            {/* Rich content with LaTeX + Markdown */}
            <StudyGuideRenderer content={section.content} fontSize={15} />

            {/* Callout box */}
            {section.callout && (
              <View style={[styles.calloutBox, { backgroundColor: colors.primaryLight, borderLeftColor: colors.primary }]}>
                <View style={styles.calloutIcon}>
                  <Ionicons name="bulb" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.calloutText, { color: colors.textPrimary }]}>{section.callout}</Text>
              </View>
            )}

            {/* Key terms */}
            {section.keyTerms && section.keyTerms.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm }}>
                {section.keyTerms.map((term) => (
                  <View key={term} style={{ backgroundColor: colors.surfaceSecondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full }}>
                    <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.xs, color: colors.textMuted }}>{term}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Error state */}
        {generateGuide.isError && sections.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: SPACING.xl }}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
            <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.base, color: colors.textPrimary, marginTop: SPACING.sm }}>
              Failed to generate study guide
            </Text>
            <Button
              label="Retry"
              onPress={() => generateGuide.mutate(
                { subject: subject.id, unit, topics: subject.topics.map((t) => t.name) },
                { onSuccess: (data) => { setSections(data); if (data.length > 0) setActiveSection(data[0].id); } }
              )}
              variant="outline"
              size="sm"
              style={{ marginTop: SPACING.md }}
            />
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating buttons */}
      <View style={[styles.floatingButtonContainer, { bottom: insets.bottom + SPACING.md }]}>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          {/* AI Chat button */}
          <Pressable
            onPress={() => setChatVisible(true)}
            style={[
              styles.chatFab,
              { backgroundColor: colors.surface, borderColor: colors.border, ...SHADOWS.md },
            ]}
          >
            <Ionicons name="sparkles" size={20} color={colors.primary} />
          </Pressable>

          {/* Quiz Me button */}
          <View style={{ flex: 1 }}>
            <Button
              label="Quiz Me on This"
              onPress={() =>
                router.push({
                  pathname: '/(app)/create/config',
                  params: { subjectId: subject.id },
                } as any)
              }
              icon={<Ionicons name="help-circle" size={20} color="#FFFFFF" />}
              size="lg"
              style={styles.floatingButton}
            />
          </View>
        </View>
      </View>

      {/* AI Chat sidebar */}
      <StudyGuideChat
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        subject={subject.name}
        unit={unit ? subject.topics.find(t => t.id === unit)?.name : undefined}
      />
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
  hero: {
    height: 180,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.35)',
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

  // -- Floating Buttons --
  floatingButtonContainer: {
    position: 'absolute',
    left: SPACING.screenH,
    right: SPACING.screenH,
  },
  chatFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  floatingButton: {
    ...SHADOWS.primary,
  },
});
