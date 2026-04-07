import React from 'react';
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
import { subjects } from '@/lib/subjects';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

/* ------------------------------------------------------------------ */
/*  Categories                                                         */
/* ------------------------------------------------------------------ */

interface Category {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorKey: 'categoryStandardized' | 'categoryAP' | 'categoryMath' | 'categoryScience' | 'categoryHumanities' | 'categoryLanguages' | 'categoryCustom';
  filter: (id: string) => boolean;
}

const CATEGORIES: Category[] = [
  {
    key: 'standardized',
    label: 'Standardized Tests',
    description: 'SAT, ACT, GRE, MCAT, and more',
    icon: 'school-outline',
    colorKey: 'categoryStandardized',
    filter: (id) => ['sat', 'act', 'gre', 'gmat', 'mcat', 'lsat', 'toefl', 'ielts'].includes(id),
  },
  {
    key: 'ap',
    label: 'AP Exams',
    description: 'Advanced Placement college-level courses',
    icon: 'ribbon-outline',
    colorKey: 'categoryAP',
    filter: (id) => id.startsWith('ap-'),
  },
  {
    key: 'math',
    label: 'Mathematics',
    description: 'Algebra, calculus, statistics, and more',
    icon: 'calculator-outline',
    colorKey: 'categoryMath',
    filter: (id) => ['math', 'algebra', 'calculus', 'statistics', 'geometry', 'trigonometry', 'pre-calculus', 'linear-algebra', 'discrete'].some((k) => id.includes(k)) && !id.startsWith('ap-'),
  },
  {
    key: 'science',
    label: 'Sciences',
    description: 'Biology, chemistry, physics, and more',
    icon: 'flask-outline',
    colorKey: 'categoryScience',
    filter: (id) => ['biology', 'chemistry', 'physics', 'anatomy', 'microbiology', 'biochemistry', 'organic'].some((k) => id.includes(k)) && !id.startsWith('ap-'),
  },
  {
    key: 'humanities',
    label: 'Humanities',
    description: 'History, literature, economics, and more',
    icon: 'book-outline',
    colorKey: 'categoryHumanities',
    filter: (id) => ['history', 'english', 'psychology', 'economics'].some((k) => id.includes(k)) && !id.startsWith('ap-'),
  },
  {
    key: 'languages',
    label: 'Languages',
    description: 'Spanish, French, Japanese, and more',
    icon: 'chatbubble-outline',
    colorKey: 'categoryLanguages',
    filter: (id) => ['spanish', 'french', 'german', 'mandarin', 'japanese', 'latin', 'italian', 'portuguese', 'korean', 'arabic'].some((k) => id.includes(k)),
  },
];

export default function GenerateScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const getCategoryCount = (filter: (id: string) => boolean) =>
    subjects.filter((s) => filter(s.id)).length;

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
        {/* Header */}
        <FadeInView delay={0} duration={350}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Create Test</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            What are you studying for?
          </Text>
        </FadeInView>

        {/* Category cards */}
        <FadeInView delay={80} duration={350}>
          <View style={{ gap: SPACING.sm }}>
            {CATEGORIES.map((cat) => {
              const count = getCategoryCount(cat.filter);
              if (count === 0) return null;
              const catColor = colors[cat.colorKey] as string;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/create/subjects',
                      params: {
                        category: cat.key,
                        categoryLabel: cat.label,
                        categoryFilter: JSON.stringify(
                          subjects.filter((s) => cat.filter(s.id)).map((s) => s.id),
                        ),
                      },
                    })
                  }
                  style={({ pressed }) => [
                    styles.catCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}
                >
                  {/* Icon box */}
                  <View style={[styles.catIconBox, { backgroundColor: catColor + '18' }]}>
                    <Ionicons name={cat.icon} size={24} color={catColor} />
                  </View>

                  {/* Label + description */}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.catLabel, { color: colors.textPrimary }]}>{cat.label}</Text>
                    <Text style={[styles.catDesc, { color: colors.textMuted }]} numberOfLines={1}>
                      {cat.description}
                    </Text>
                  </View>

                  {/* Count + chevron */}
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={[styles.catCount, { color: colors.textFaint }]}>{count}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                  </View>
                </Pressable>
              );
            })}

            {/* Custom option — skip to config */}
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(app)/test/wizard',
                  params: { subjectId: '' },
                })
              }
              style={({ pressed }) => [
                styles.catCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <View style={[styles.catIconBox, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="add-circle-outline" size={24} color={colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.catLabel, { color: colors.textPrimary }]}>Custom</Text>
                <Text style={[styles.catDesc, { color: colors.textMuted }]} numberOfLines={1}>
                  Enter any subject or topic
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          </View>
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
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
    lineHeight: FONT_SIZES.base * 1.6,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    minHeight: 72,
    ...SHADOWS.sm,
  },
  catIconBox: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  catDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    marginTop: 2,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  catCount: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansMedium,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
});
