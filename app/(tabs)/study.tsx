import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionLabel } from '@/components/ui/Label';
import { useFlashcardDecks } from '@/hooks/useFlashcards';
import { useTheme } from '@/contexts/ThemeContext';
import {
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
  SHADOWS,
} from '@/constants/theme';

/* ------------------------------------------------------------------ */
/*  Progress Ring                                                      */
/* ------------------------------------------------------------------ */

const ProgressRing = React.memo(function ProgressRing({
  percent,
  size = 36,
  strokeWidth = 3,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Track */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: colors.border,
        }}
      />
      {/* Filled arc (approximated with border) */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: colors.primary,
          borderTopColor: percent > 25 ? colors.primary : 'transparent',
          borderRightColor: percent > 50 ? colors.primary : 'transparent',
          borderBottomColor: percent > 75 ? colors.primary : 'transparent',
          borderLeftColor: percent > 0 ? colors.primary : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }}
      />
      <Text style={[styles.ringText, { color: colors.textMuted }]}>{percent}%</Text>
    </View>
  );
});

/* ------------------------------------------------------------------ */
/*  Filter Pill                                                        */
/* ------------------------------------------------------------------ */

const FilterPill = React.memo(function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primary : colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          { color: active ? colors.textOnPrimary : colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
});

/* ------------------------------------------------------------------ */
/*  Deck Card                                                          */
/* ------------------------------------------------------------------ */

const DeckCard = React.memo(function DeckCard({
  id,
  name,
  subject,
  cardCount,
  masteredCount,
  onStudy,
  onEdit,
}: {
  id: string;
  name: string;
  subject: string;
  cardCount: number;
  masteredCount: number;
  onStudy: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const { colors } = useTheme();
  const masteredPct =
    cardCount > 0 ? Math.round((masteredCount / cardCount) * 100) : 0;
  const dueCount = cardCount - masteredCount;

  const handleStudy = useCallback(() => onStudy(id), [id, onStudy]);
  const handleEdit = useCallback(() => onEdit(id), [id, onEdit]);

  return (
    <View style={[styles.deckCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Top row: name + ring */}
      <View style={styles.deckCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.deckName, { color: colors.textPrimary }]} numberOfLines={2}>
            {name}
          </Text>
          <View style={{ marginTop: SPACING.xs }}>
            <Badge
              text={subject ?? 'General'}
              color={colors.primary}
              size="sm"
            />
          </View>
        </View>
        <ProgressRing percent={masteredPct} />
      </View>

      {/* Stats */}
      <Text style={[styles.deckStats, { color: colors.textMuted }]}>
        {cardCount} cards · {dueCount} due
      </Text>
      <Text style={[styles.deckMastered, { color: colors.textFaint }]}>{masteredPct}% mastered</Text>

      {/* Buttons */}
      <View style={styles.deckButtons}>
        <Pressable
          onPress={handleStudy}
          style={({ pressed }) => [
            styles.studyBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 },
          ]}
        >
          <Ionicons name="play" size={14} color={colors.textOnPrimary} />
          <Text style={[styles.studyBtnText, { color: colors.textOnPrimary }]}>Study</Text>
        </Pressable>
        <Pressable
          onPress={handleEdit}
          style={({ pressed }) => [
            styles.editBtn,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
          ]}
        >
          <Ionicons name="pencil" size={14} color={colors.textMuted} />
          <Text style={[styles.editBtnText, { color: colors.textMuted }]}>Edit</Text>
        </Pressable>
      </View>
    </View>
  );
});

/* ------------------------------------------------------------------ */
/*  Main Screen                                                        */
/* ------------------------------------------------------------------ */

export default function StudyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: decks } = useFlashcardDecks();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  /* ---------- derived data ---------- */

  const totalDue = useMemo(
    () =>
      decks?.reduce((sum, d) => sum + (d.cardCount - d.masteredCount), 0) ?? 0,
    [decks],
  );

  const filters = useMemo(() => {
    const subjectList =
      decks
        ?.map((d) => d.subject)
        .filter((v, i, a) => a.indexOf(v) === i) ?? [];
    return ['All', ...subjectList];
  }, [decks]);

  const filteredDecks = useMemo(() => {
    return (decks ?? []).filter((d) => {
      if (activeFilter !== 'All' && d.subject !== activeFilter) return false;
      if (
        searchQuery &&
        !d.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [decks, activeFilter, searchQuery]);

  /* ---------- callbacks ---------- */

  const { impact: haptic } = useHaptic();

  const handleCreateDeck = useCallback(() => {
    haptic();
    router.push('/(tabs)/generate');
  }, [haptic, router]);

  const handleStudyDeck = useCallback(
    (deckId: string) => {
      haptic();
      router.push({
        pathname: '/(app)/flashcards/[id]',
        params: { id: deckId },
      });
    },
    [haptic, router],
  );

  const handleEditDeck = useCallback(
    (deckId: string) => {
      haptic();
      router.push({
        pathname: '/(app)/flashcards/[id]',
        params: { id: deckId },
      });
    },
    [haptic, router],
  );

  const handleReviewDue = useCallback(() => {
    haptic();
    if (decks && decks.length > 0) {
      router.push({
        pathname: '/(app)/flashcards/[id]',
        params: { id: decks[0].id },
      });
    }
  }, [haptic, decks, router]);

  const handleFilterPress = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  /* ---------- render ---------- */

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
        {/* ===== Header ===== */}
        <FadeInView delay={0} duration={300}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Flashcards</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Master concepts with spaced repetition
              </Text>
            </View>
            <Button
              label="Create Deck"
              onPress={handleCreateDeck}
              size="sm"
              icon={
                <Ionicons name="add" size={16} color={colors.textOnPrimary} />
              }
            />
          </View>
        </FadeInView>

        {/* ===== Filter Pills & Search ===== */}
        <FadeInView delay={100} duration={300}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            {filters.map((filter) => (
              <FilterPill
                key={filter}
                label={filter}
                active={activeFilter === filter}
                onPress={() => handleFilterPress(filter)}
              />
            ))}
          </ScrollView>

          {/* ===== Search ===== */}
          <View style={{ marginBottom: SPACING.md }}>
            <Input
              placeholder="Search flashcard decks..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              icon={
                <Ionicons name="search" size={18} color={colors.textMuted} />
              }
            />
          </View>
        </FadeInView>

        {/* ===== Due Review Banner & Deck Grid ===== */}
        <FadeInView delay={200} duration={300}>
          {totalDue > 0 && (
            <Pressable
              onPress={handleReviewDue}
              style={({ pressed }) => [
                styles.dueBanner,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary + '40',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={[styles.dueBannerIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="play" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dueBannerTitle, { color: colors.textPrimary }]}>
                  {totalDue} cards due for review
                </Text>
                <Text style={[styles.dueBannerSubtitle, { color: colors.textMuted }]}>
                  Keep your streak going!
                </Text>
              </View>
              <View style={[styles.dueBannerBtn, { backgroundColor: colors.primary }]}>
                <Text style={[styles.dueBannerBtnText, { color: colors.textOnPrimary }]}>Review Due</Text>
              </View>
            </Pressable>
          )}

          {/* ===== Deck Grid ===== */}
          {filteredDecks.length === 0 ? (
            <View style={{ marginTop: SPACING.xl }}>
              <EmptyState
                icon="flash-outline"
                title="No Flashcard Decks"
                description="No flashcard decks yet. Generate some after taking a test!"
                actionTitle="Create Deck"
                onAction={handleCreateDeck}
              />
            </View>
          ) : (
            <View style={{ marginTop: SPACING.lg }}>
              <SectionLabel>YOUR DECKS</SectionLabel>
              <View style={styles.deckGrid}>
                {filteredDecks.map((deck) => (
                  <DeckCard
                    key={deck.id}
                    id={deck.id}
                    name={deck.name}
                    subject={deck.subject}
                    cardCount={deck.cardCount}
                    masteredCount={deck.masteredCount}
                    onStudy={handleStudyDeck}
                    onEdit={handleEditDeck}
                  />
                ))}
              </View>
            </View>
          )}
        </FadeInView>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  /* header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.displaySemiBold,
    lineHeight: FONT_SIZES.xxl * 1.2,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    marginTop: SPACING.xs,
    lineHeight: FONT_SIZES.sm * 1.6,
  },

  /* filter pills */
  filterScroll: {
    marginVertical: SPACING.md,
  },
  filterContent: {
    gap: SPACING.sm,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  pillText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansMedium,
    lineHeight: FONT_SIZES.sm * 1.5,
  },

  /* progress ring */
  ringText: {
    fontSize: 9,
    fontFamily: FONTS.sansBold,
    lineHeight: 9 * 1.5,
  },

  /* due banner */
  dueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
    minHeight: 44,
    ...SHADOWS.sm,
  },
  dueBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 4,
  },
  dueBannerTitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  dueBannerSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    marginTop: 2,
    lineHeight: FONT_SIZES.sm * 1.6,
  },
  dueBannerBtn: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    justifyContent: 'center',
    ...SHADOWS.primary,
  },
  dueBannerBtnText: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.5,
  },

  /* deck grid */
  deckGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  deckCard: {
    width: '48%' as any,
    flexGrow: 1,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  deckCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  deckName: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  deckStats: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    marginBottom: 2,
    lineHeight: FONT_SIZES.xs * 1.6,
  },
  deckMastered: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    marginBottom: 12,
    lineHeight: FONT_SIZES.xs * 1.6,
  },
  deckButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  studyBtn: {
    flex: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
    ...SHADOWS.primary,
  },
  studyBtnText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansMedium,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  editBtn: {
    flex: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    minHeight: 44,
  },
  editBtnText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansMedium,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
});
