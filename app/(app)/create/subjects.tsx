import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptic } from '@/hooks/useHaptic';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';
import { subjects as allSubjects } from '@/lib/subjects';

interface SubjectItem {
  key: string;
  label: string;
  description: string;
}

export default function SubjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { category, categoryLabel, categoryFilter } = useLocalSearchParams<{
    category: string;
    categoryLabel?: string;
    categoryFilter?: string;
  }>();
  const { colors } = useTheme();
  const { impact } = useHaptic();

  const [search, setSearch] = useState('');

  const subjects = useMemo(() => {
    let list: SubjectItem[] = [];

    // Build list dynamically from lib/subjects.ts using categoryFilter
    if (categoryFilter) {
      try {
        const filterIds: string[] = JSON.parse(categoryFilter);
        list = allSubjects
          .filter((s) => filterIds.includes(s.id))
          .map((s) => ({
            key: s.id,
            label: s.name,
            description: s.topics.slice(0, 3).map((t) => t.name).join(', '),
          }));
      } catch {
        list = [];
      }
    } else {
      // Fallback: build from lib/subjects.ts using category key filters
      const CATEGORY_FILTERS: Record<string, (id: string) => boolean> = {
        standardized: (id) => ['sat', 'act', 'gre', 'gmat', 'mcat', 'lsat', 'toefl', 'ielts'].includes(id),
        ap: (id) => id.startsWith('ap-'),
        mathematics: (id) => ['algebra', 'calculus', 'geometry', 'statistics', 'math', 'trigonometry', 'pre-calculus', 'linear-algebra', 'discrete'].some((k) => id.includes(k)) && !id.startsWith('ap-'),
        math: (id) => ['algebra', 'calculus', 'geometry', 'statistics', 'math', 'trigonometry', 'pre-calculus', 'linear-algebra', 'discrete'].some((k) => id.includes(k)) && !id.startsWith('ap-'),
        sciences: (id) => ['biology', 'chemistry', 'physics', 'anatomy', 'microbiology', 'biochemistry', 'organic'].some((k) => id.includes(k)) && !id.startsWith('ap-'),
        science: (id) => ['biology', 'chemistry', 'physics', 'anatomy', 'microbiology', 'biochemistry', 'organic'].some((k) => id.includes(k)) && !id.startsWith('ap-'),
        humanities: (id) => ['history', 'english', 'psychology', 'economics'].some((k) => id.includes(k)) && !id.startsWith('ap-'),
        languages: (id) => ['spanish', 'french', 'german', 'mandarin', 'japanese', 'latin', 'italian', 'portuguese', 'korean', 'arabic'].some((k) => id.includes(k)),
      };

      const filterFn = CATEGORY_FILTERS[category ?? ''];
      if (filterFn) {
        list = allSubjects
          .filter((s) => filterFn(s.id))
          .map((s) => ({
            key: s.id,
            label: s.name,
            description: s.topics.slice(0, 3).map((t) => t.name).join(', '),
          }));
      }
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase().trim();
    return list.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }, [category, categoryFilter, search]);

  const categoryTitle = categoryLabel ?? (category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Subjects');

  const handleSubjectPress = (subject: SubjectItem) => {
    impact();
    router.push({
      pathname: '/(app)/create/config',
      params: { subject: subject.label, subjectId: subject.key },
    });
  };

  const renderSubject = ({ item }: { item: SubjectItem }) => (
    <Pressable
      onPress={() => handleSubjectPress(item)}
      style={({ pressed }) => [
        styles.subjectCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        SHADOWS.md,
      ]}
    >
      <View style={styles.subjectText}>
        <Text
          style={[styles.subjectLabel, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
        <Text
          style={[styles.subjectDescription, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {item.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <View
        style={[
          styles.headerArea,
          { paddingTop: insets.top + SPACING.screenV },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => {
              impact();
              router.back();
            }}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.82 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {categoryTitle}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {subjects.length} subject{subjects.length !== 1 ? 's' : ''} available
        </Text>

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search subjects..."
            placeholderTextColor={colors.textFaint}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => {
                impact();
                setSearch('');
              }}
              style={({ pressed }) => [
                { opacity: pressed ? 0.82 : 1, minHeight: 44, justifyContent: 'center' },
              ]}
            >
              <Ionicons name="close-circle" size={18} color={colors.textFaint} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={(item) => item.key}
        renderItem={renderSubject}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={40} color={colors.textFaint} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No subjects found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: SPACING.screenH,
    paddingBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xxl,
    letterSpacing: -0.3,
    includeFontPadding: false,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    includeFontPadding: false,
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    height: 44,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    includeFontPadding: false,
    height: '100%',
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: SPACING.screenH,
    gap: SPACING.sm,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: 44,
    gap: SPACING.sm,
  },
  subjectText: {
    flex: 1,
    gap: 2,
  },
  subjectLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.base,
    includeFontPadding: false,
  },
  subjectDescription: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    includeFontPadding: false,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyText: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.base,
    includeFontPadding: false,
  },
});
