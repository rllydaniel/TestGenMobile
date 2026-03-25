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

interface SubjectItem {
  key: string;
  label: string;
  description: string;
}

const SUBJECTS_BY_CATEGORY: Record<string, SubjectItem[]> = {
  standardized: [
    { key: 'sat', label: 'SAT', description: 'College entrance exam' },
    { key: 'act', label: 'ACT', description: 'College readiness assessment' },
    { key: 'psat', label: 'PSAT', description: 'Preliminary SAT / NMSQT' },
  ],
  ap: [
    { key: 'ap-calculus-ab', label: 'AP Calculus AB', description: 'Limits, derivatives, integrals' },
    { key: 'ap-calculus-bc', label: 'AP Calculus BC', description: 'Advanced calculus topics' },
    { key: 'ap-biology', label: 'AP Biology', description: 'Cell biology, genetics, ecology' },
    { key: 'ap-chemistry', label: 'AP Chemistry', description: 'Atomic structure, reactions, kinetics' },
    { key: 'ap-physics-1', label: 'AP Physics 1', description: 'Mechanics, waves, circuits' },
    { key: 'ap-us-history', label: 'AP US History', description: 'American history survey' },
    { key: 'ap-english-lang', label: 'AP English Language', description: 'Rhetoric and composition' },
    { key: 'ap-psychology', label: 'AP Psychology', description: 'Behavior and mental processes' },
    { key: 'ap-computer-science-a', label: 'AP Computer Science A', description: 'Java programming fundamentals' },
    { key: 'ap-statistics', label: 'AP Statistics', description: 'Data analysis, probability, inference' },
  ],
  mathematics: [
    { key: 'algebra-1', label: 'Algebra I', description: 'Linear equations, inequalities, functions' },
    { key: 'algebra-2', label: 'Algebra II', description: 'Polynomials, logarithms, sequences' },
    { key: 'geometry', label: 'Geometry', description: 'Proofs, triangles, circles, area' },
    { key: 'precalculus', label: 'Precalculus', description: 'Trigonometry, conic sections' },
    { key: 'calculus', label: 'Calculus', description: 'Limits, derivatives, integrals' },
    { key: 'statistics', label: 'Statistics', description: 'Probability, distributions, hypothesis testing' },
  ],
  sciences: [
    { key: 'biology', label: 'Biology', description: 'Cells, genetics, evolution, ecology' },
    { key: 'chemistry', label: 'Chemistry', description: 'Atoms, bonding, reactions, stoichiometry' },
    { key: 'physics', label: 'Physics', description: 'Mechanics, electricity, waves' },
    { key: 'earth-science', label: 'Earth Science', description: 'Geology, meteorology, astronomy' },
    { key: 'environmental-science', label: 'Environmental Science', description: 'Ecosystems, pollution, sustainability' },
  ],
  humanities: [
    { key: 'us-history', label: 'US History', description: 'Colonial era to modern America' },
    { key: 'world-history', label: 'World History', description: 'Ancient civilizations to present' },
    { key: 'english-literature', label: 'English Literature', description: 'Poetry, prose, drama analysis' },
    { key: 'philosophy', label: 'Philosophy', description: 'Ethics, logic, metaphysics' },
    { key: 'psychology', label: 'Psychology', description: 'Behavior, cognition, development' },
  ],
  languages: [
    { key: 'spanish', label: 'Spanish', description: 'Grammar, vocabulary, reading' },
    { key: 'french', label: 'French', description: 'Grammar, vocabulary, reading' },
    { key: 'mandarin', label: 'Mandarin Chinese', description: 'Characters, tones, grammar' },
    { key: 'german', label: 'German', description: 'Grammar, vocabulary, reading' },
    { key: 'japanese', label: 'Japanese', description: 'Hiragana, katakana, kanji, grammar' },
  ],
};

const CATEGORY_TITLES: Record<string, string> = {
  standardized: 'Standardized Tests',
  ap: 'AP Exams',
  mathematics: 'Mathematics',
  sciences: 'Sciences',
  humanities: 'Humanities',
  languages: 'Languages',
};

export default function SubjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category: string }>();
  const { colors } = useTheme();
  const { impact } = useHaptic();

  const [search, setSearch] = useState('');

  const subjects = useMemo(() => {
    const list = SUBJECTS_BY_CATEGORY[category ?? ''] ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase().trim();
    return list.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [category, search]);

  const categoryTitle = CATEGORY_TITLES[category ?? ''] ?? 'Subjects';

  const handleSubjectPress = (subject: SubjectItem) => {
    impact();
    router.push({
      pathname: '/(app)/create/config',
      params: { subject: subject.label },
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
