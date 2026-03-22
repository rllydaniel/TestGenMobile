import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlashcardsSkeleton } from '@/components/ui/Skeleton';
import { AccuracyRing } from '@/components/ui/AccuracyRing';
import { useFlashcardDecks } from '@/hooks/useFlashcards';
import { FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';

function StatChip({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View
      style={[
        styles.statChip,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text
        style={{
          fontFamily: FONTS.sansBold,
          fontSize: FONT_SIZES.base,
          color: colors.textPrimary,
          includeFontPadding: false,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: FONTS.sansRegular,
          fontSize: FONT_SIZES.xs,
          color: colors.textMuted,
          includeFontPadding: false,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function FlashcardsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: decks, isLoading } = useFlashcardDecks();

  const stats = useMemo(() => {
    if (!decks || decks.length === 0) {
      return { totalCards: 0, mastered: 0, dueForReview: 0 };
    }
    const totalCards = decks.reduce((sum: number, d: any) => sum + (d.cardCount ?? 0), 0);
    const mastered = decks.reduce((sum: number, d: any) => sum + (d.masteredCount ?? 0), 0);
    const dueForReview = totalCards - mastered;
    return { totalCards, mastered, dueForReview };
  }, [decks]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.appBackground, paddingTop: insets.top + SPACING.md, paddingHorizontal: SPACING.screenH }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: FONT_SIZES.xl, fontFamily: FONTS.displaySemiBold, color: colors.textPrimary, includeFontPadding: false }}>
            Flashcards
          </Text>
        </View>
        <FlashcardsSkeleton />
      </View>
    );
  }

  const renderDeckCard = ({ item }: { item: any }) => {
    const mastery = item.cardCount > 0 ? Math.round((item.masteredCount / item.cardCount) * 100) : 0;

    return (
      <Pressable
        onPress={() =>
          router.push({ pathname: '/(app)/flashcards/[id]', params: { id: item.id } })
        }
        style={({ pressed }) => [
          styles.deckCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.82 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        <Text
          style={{
            fontFamily: FONTS.sansBold,
            fontSize: FONT_SIZES.base,
            color: colors.textPrimary,
            includeFontPadding: false,
          }}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.sansRegular,
            fontSize: FONT_SIZES.sm,
            color: colors.textMuted,
            includeFontPadding: false,
          }}
        >
          {item.cardCount} cards
        </Text>
        <View style={styles.ringContainer}>
          <AccuracyRing accuracy={mastery} size={48} strokeWidth={4} />
          <Text
            style={{
              fontFamily: FONTS.sansRegular,
              fontSize: FONT_SIZES.xs,
              color: colors.textMuted,
              includeFontPadding: false,
              marginTop: SPACING.xs,
            }}
          >
            {item.masteredCount}/{item.cardCount}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: SPACING.screenH,
          paddingTop: insets.top + SPACING.md,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              minHeight: 44,
              justifyContent: 'center' as const,
              opacity: pressed ? 0.82 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text
            style={{
              fontSize: FONT_SIZES.xl,
              fontFamily: FONTS.displaySemiBold,
              color: colors.textPrimary,
              lineHeight: FONT_SIZES.xl * 1.2,
              includeFontPadding: false,
            }}
          >
            Flashcards
          </Text>
        </View>

        {!decks || decks.length === 0 ? (
          <EmptyState
            icon="flash-outline"
            title="No flashcard decks"
            description="Complete a test to auto-generate flashcards, or create them manually."
            actionTitle="Generate Test"
            onAction={() => router.push('/(tabs)/generate')}
          />
        ) : (
          <>
            {/* Stat chips row */}
            <View style={styles.statRow}>
              <StatChip
                label="Total Cards"
                value={stats.totalCards}
                icon="layers-outline"
                colors={colors}
              />
              <StatChip
                label="Mastered"
                value={stats.mastered}
                icon="checkmark-circle-outline"
                colors={colors}
              />
              <StatChip
                label="Due for Review"
                value={stats.dueForReview}
                icon="time-outline"
                colors={colors}
              />
            </View>

            {/* Deck grid */}
            <FlatList
              data={decks}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.listContent}
              renderItem={renderDeckCard}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
  },
  columnWrapper: {
    gap: SPACING.sm,
  },
  listContent: {
    gap: SPACING.sm,
    paddingBottom: 120,
  },
  deckCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    minHeight: 44,
    gap: SPACING.xs,
  },
  ringContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
});
