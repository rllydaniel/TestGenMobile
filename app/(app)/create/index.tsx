import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

interface Category {
  key: string;
  label: string;
  description: string;
  count: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CATEGORIES: Category[] = [
  {
    key: 'standardized',
    label: 'Standardized Tests',
    description: 'SAT, ACT, PSAT',
    count: '3',
    icon: 'school-outline',
    color: '#2360E8',
  },
  {
    key: 'ap',
    label: 'AP Exams',
    description: '38 subjects',
    count: '38',
    icon: 'ribbon-outline',
    color: '#7C3AED',
  },
  {
    key: 'mathematics',
    label: 'Mathematics',
    description: 'Algebra, Calculus, Statistics & more',
    count: '12',
    icon: 'calculator-outline',
    color: '#059669',
  },
  {
    key: 'sciences',
    label: 'Sciences',
    description: 'Physics, Chemistry, Biology & more',
    count: '10',
    icon: 'flask-outline',
    color: '#DC2626',
  },
  {
    key: 'humanities',
    label: 'Humanities',
    description: 'History, Literature, Philosophy & more',
    count: '9',
    icon: 'book-outline',
    color: '#D97706',
  },
  {
    key: 'languages',
    label: 'Languages',
    description: 'Spanish, French, Mandarin & more',
    count: '8',
    icon: 'chatbubbles-outline',
    color: '#0891B2',
  },
  {
    key: 'custom',
    label: 'Custom',
    description: 'Enter any subject or topic',
    count: '\u221E',
    icon: 'add-circle-outline',
    color: '#6B7280',
  },
];

function hapticFeedback() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default function CategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const handleCategoryPress = (category: Category) => {
    hapticFeedback();
    if (category.key === 'custom') {
      router.push({
        pathname: '/(app)/create/config',
        params: { subject: '' },
      });
    } else {
      router.push({
        pathname: '/(app)/create/subjects',
        params: { category: category.key },
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + SPACING.screenV,
            paddingBottom: insets.bottom + SPACING.xl,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              hapticFeedback();
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
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary },
            ]}
          >
            Create Test
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.textMuted },
            ]}
          >
            Choose a category to get started
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          CATEGORIES
        </Text>

        <View style={styles.cardList}>
          {CATEGORIES.map((category) => (
            <Pressable
              key={category.key}
              onPress={() => handleCategoryPress(category)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.82 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
                SHADOWS.md,
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: category.color + '14' }]}>
                <Ionicons name={category.icon} size={24} color={category.color} />
              </View>

              <View style={styles.cardText}>
                <Text
                  style={[styles.cardLabel, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {category.label}
                </Text>
                <Text
                  style={[styles.cardDescription, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {category.description}
                </Text>
              </View>

              <View style={[styles.countBadge, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.countText, { color: colors.textMuted }]}>
                  {category.count}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textFaint}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenH,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
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
  },
  sectionLabel: {
    fontFamily: FONTS.sansBold,
    fontSize: FONT_SIZES.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    includeFontPadding: false,
    marginBottom: SPACING.sm,
  },
  cardList: {
    gap: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: 44,
    gap: SPACING.sm,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.base,
    includeFontPadding: false,
  },
  cardDescription: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    includeFontPadding: false,
  },
  countBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    minWidth: 32,
    alignItems: 'center',
  },
  countText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.xs,
    includeFontPadding: false,
  },
});
