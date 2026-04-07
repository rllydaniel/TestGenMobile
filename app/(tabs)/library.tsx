import React, { useState, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInView } from '@/components/ui/FadeInView';
import { useHaptic } from '@/hooks/useHaptic';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFlashcardDecks } from '@/hooks/useFlashcards';
import { subjects } from '@/lib/subjects';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

type Tab = 'flashcards' | 'guides';

/* ------------------------------------------------------------------ */
/*  Segmented Control                                                  */
/* ------------------------------------------------------------------ */

function SegmentedControl({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  const { colors } = useTheme();
  const tabs: { id: Tab; label: string }[] = [
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'guides', label: 'Study Guides' },
  ];
  return (
    <View style={[segStyles.container, { backgroundColor: colors.surfaceSecondary }]}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[
              segStyles.tab,
              isActive && [segStyles.activeTab, { backgroundColor: colors.surface, ...SHADOWS.sm }],
            ]}
          >
            <Text
              style={{
                fontSize: FONT_SIZES.sm,
                fontFamily: isActive ? FONTS.sansSemiBold : FONTS.sansRegular,
                color: isActive ? colors.textPrimary : colors.textMuted,
                lineHeight: FONT_SIZES.sm * 1.5,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    minHeight: 36,
  },
  activeTab: {
    borderRadius: RADIUS.sm,
  },
});

/* ------------------------------------------------------------------ */
/*  Flashcards Panel                                                   */
/* ------------------------------------------------------------------ */

function FlashcardsPanel() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: decks } = useFlashcardDecks();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);

  const { impact: haptic } = useHaptic();

  const filteredDecks = useMemo(
    () =>
      (decks ?? []).filter((d) =>
        debouncedSearch ? d.name.toLowerCase().includes(debouncedSearch.toLowerCase()) : true,
      ),
    [decks, debouncedSearch],
  );

  const totalDue = useMemo(
    () => (decks ?? []).reduce((sum, d) => sum + Math.max(0, d.cardCount - d.masteredCount), 0),
    [decks],
  );

  return (
    <View>
      {/* Due banner */}
      {totalDue > 0 && (
        <Pressable
          onPress={() => {
            haptic();
            if (decks && decks.length > 0) {
              router.push({ pathname: '/(app)/flashcards/[id]', params: { id: decks[0].id } });
            }
          }}
          style={({ pressed }) => [
            fcStyles.dueBanner,
            { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30', opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons name="play-circle" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[fcStyles.dueTitle, { color: colors.primary }]}>{totalDue} cards due for review</Text>
            <Text style={[fcStyles.dueSub, { color: colors.textMuted }]}>Tap to start reviewing</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>
      )}

      {/* Search */}
      <View style={{ marginBottom: SPACING.md }}>
        <Input
          placeholder="Search decks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Ionicons name="search" size={18} color={colors.textMuted} />}
        />
      </View>

      {/* Deck list */}
      {filteredDecks.length === 0 ? (
        <EmptyState
          icon="layers-outline"
          title="No flashcard decks"
          description="Create a deck or generate one after taking a test."
          actionTitle="Create Deck"
          onAction={() => { haptic(); router.push('/(app)/flashcards/index'); }}
        />
      ) : (
        <View style={{ gap: SPACING.sm }}>
          {filteredDecks.map((deck) => {
            const masteredPct = deck.cardCount > 0 ? Math.round((deck.masteredCount / deck.cardCount) * 100) : 0;
            const dueCount = Math.max(0, deck.cardCount - deck.masteredCount);
            return (
              <Pressable
                key={deck.id}
                onPress={() => {
                  haptic();
                  router.push({ pathname: '/(app)/flashcards/[id]', params: { id: deck.id } });
                }}
                style={({ pressed }) => [
                  fcStyles.deckCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                {/* Left: icon box */}
                <View style={[fcStyles.deckIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="layers" size={22} color={colors.primary} />
                </View>

                {/* Center: info */}
                <View style={{ flex: 1 }}>
                  <Text style={[fcStyles.deckName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {deck.name}
                  </Text>
                  <View style={{ marginTop: 4 }}>
                    <Badge text={deck.subject || 'General'} color={colors.primary} size="sm" />
                  </View>
                  <Text style={[fcStyles.deckStats, { color: colors.textMuted }]}>
                    {deck.cardCount} cards · {dueCount > 0 ? `${dueCount} due` : 'all caught up'}
                  </Text>
                </View>

                {/* Right: mastery % */}
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[fcStyles.masteryPct, { color: colors.primary }]}>{masteredPct}%</Text>
                  <Text style={[fcStyles.masteryLabel, { color: colors.textFaint }]}>mastered</Text>
                </View>
              </Pressable>
            );
          })}

          {/* Create deck CTA */}
          <Pressable
            onPress={() => { haptic(); router.push('/(app)/flashcards/index'); }}
            style={({ pressed }) => [
              fcStyles.createDeckCard,
              { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="add" size={20} color={colors.textMuted} />
            <Text style={[fcStyles.createDeckText, { color: colors.textMuted }]}>+ Create Deck</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const fcStyles = StyleSheet.create({
  dueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  dueTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  dueSub: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  deckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    minHeight: 80,
    ...SHADOWS.sm,
  },
  deckIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckName: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  deckStats: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    marginTop: 4,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  masteryPct: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.sansBold,
    lineHeight: FONT_SIZES.lg * 1.2,
    includeFontPadding: false,
  },
  masteryLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  createDeckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: SPACING.md,
    minHeight: 52,
  },
  createDeckText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansMedium,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
});

/* ------------------------------------------------------------------ */
/*  Study Guides Panel                                                 */
/* ------------------------------------------------------------------ */

const GUIDE_FILTER_PILLS = ['All', 'SAT', 'ACT', 'AP', 'Core'] as const;

const CATEGORY_MAP: Record<string, (id: string) => boolean> = {
  All: () => true,
  SAT: (id) => id === 'sat',
  ACT: (id) => id === 'act',
  AP: (id) => id.startsWith('ap-'),
  Core: (id) => !id.startsWith('ap-') && id !== 'sat' && id !== 'act',
};

function GuidesPanel() {
  const { colors } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredSubjects = useMemo(() => {
    const filterFn = CATEGORY_MAP[activeFilter] ?? CATEGORY_MAP.All;
    return subjects.filter((s) => {
      if (!filterFn(s.id)) return false;
      if (debouncedSearch.trim()) return s.name.toLowerCase().includes(debouncedSearch.trim().toLowerCase());
      return true;
    });
  }, [debouncedSearch, activeFilter]);

  return (
    <View>
      {/* Search */}
      <View style={{ marginBottom: SPACING.sm }}>
        <Input
          placeholder="Search guides..."
          value={search}
          onChangeText={setSearch}
          icon={<Ionicons name="search" size={18} color={colors.textMuted} />}
        />
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: SPACING.sm, paddingBottom: SPACING.md }}
      >
        {GUIDE_FILTER_PILLS.map((pill) => (
          <Pressable
            key={pill}
            onPress={() => setActiveFilter(pill)}
            style={[
              guideStyles.pill,
              {
                backgroundColor: activeFilter === pill ? colors.primary : colors.surface,
                borderColor: activeFilter === pill ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={{
                fontSize: FONT_SIZES.sm,
                fontFamily: FONTS.sansMedium,
                color: activeFilter === pill ? '#FFFFFF' : colors.textMuted,
                lineHeight: FONT_SIZES.sm * 1.5,
              }}
            >
              {pill}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Subject cards */}
      {filteredSubjects.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="No guides found"
          description="Try adjusting your search or filter."
        />
      ) : (
        <View style={{ gap: SPACING.sm }}>
          {filteredSubjects.map((subject) => {
            const guideCount = Math.max(1, Math.floor(subject.topics.length * 0.8));
            return (
              <Pressable
                key={subject.id}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/guide-detail',
                    params: { subjectId: subject.id },
                  })
                }
                style={({ pressed }) => [
                  guideStyles.guideCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                {/* Colored top band */}
                <View style={[guideStyles.colorBand, { backgroundColor: subject.color + '18' }]}>
                  <Text style={[guideStyles.subjectInitial, { color: subject.color }]}>
                    {subject.name.charAt(0)}
                  </Text>
                </View>
                <View style={guideStyles.guideCardBody}>
                  <View style={{ flex: 1 }}>
                    <Text style={[guideStyles.guideName, { color: colors.textPrimary }]}>
                      {subject.name}
                    </Text>
                    <Text style={[guideStyles.guideCount, { color: colors.textMuted }]}>
                      {guideCount} guides
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const guideStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  guideCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  colorBand: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectInitial: {
    fontSize: 28,
    fontFamily: FONTS.displayBold,
    includeFontPadding: false,
  },
  guideCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  guideName: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  guideCount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    marginTop: 2,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
});

/* ------------------------------------------------------------------ */
/*  Main Screen                                                        */
/* ------------------------------------------------------------------ */

export default function LibraryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('flashcards');

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.lg,
          paddingHorizontal: SPACING.screenH,
          paddingBottom: 80 + insets.bottom + SPACING.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView delay={0} duration={350}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Library</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Your flashcard decks and study guides.
          </Text>
          <SegmentedControl active={activeTab} onChange={setActiveTab} />
        </FadeInView>

        <FadeInView delay={80} duration={350}>
          {activeTab === 'flashcards' ? <FlashcardsPanel /> : <GuidesPanel />}
        </FadeInView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.displaySemiBold,
    lineHeight: FONT_SIZES.xxl * 1.2,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
    lineHeight: FONT_SIZES.sm * 1.6,
  },
});
