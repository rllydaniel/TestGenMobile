import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { subjects } from '@/lib/subjects';
import { FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';

const FILTER_PILLS = ['All', 'SAT', 'ACT', 'AP', 'Core'] as const;

const CATEGORY_MAP: Record<string, (id: string) => boolean> = {
  All: () => true,
  SAT: (id) => id === 'sat',
  ACT: (id) => id === 'act',
  AP: (id) => id.startsWith('ap-'),
  Core: (id) =>
    !id.startsWith('ap-') && id !== 'sat' && id !== 'act',
};

export default function StudyGuidesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const filteredSubjects = useMemo(() => {
    const filterFn = CATEGORY_MAP[activeFilter] ?? CATEGORY_MAP.All;
    return subjects.filter((s) => {
      if (!filterFn(s.id)) return false;
      if (search.trim()) {
        return s.name.toLowerCase().includes(search.trim().toLowerCase());
      }
      return true;
    });
  }, [search, activeFilter]);

  const guideCount = (topicCount: number) => Math.max(1, Math.floor(topicCount * 0.8));

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground }]}>
      <FlatList
        data={filteredSubjects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Header band */}
            <View style={[styles.headerBand, { backgroundColor: colors.primaryLight, paddingTop: insets.top + SPACING.md }]}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Study Guides</Text>

              <View style={{ marginTop: SPACING.md }}>
                <Input
                  placeholder="Search subjects..."
                  value={search}
                  onChangeText={setSearch}
                  icon={
                    <Ionicons
                      name="search"
                      size={18}
                      color={colors.textFaint}
                    />
                  }
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillRow}
                style={{ marginTop: SPACING.md }}
              >
                {FILTER_PILLS.map((pill) => {
                  const isActive = activeFilter === pill;
                  return (
                    <Pressable
                      key={pill}
                      onPress={() => setActiveFilter(pill)}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: isActive ? colors.primary : colors.surface,
                          borderColor: isActive ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          { color: isActive ? colors.textOnPrimary : colors.textMuted },
                        ]}
                      >
                        {pill}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Featured guide card */}
            <View style={{ paddingHorizontal: SPACING.screenH, marginTop: SPACING.lg }}>
              <Card
                style={{
                  borderTopWidth: 3,
                  borderTopColor: colors.primary,
                  overflow: 'hidden',
                  backgroundColor: colors.surface,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: SPACING.sm,
                  }}
                >
                  <Badge text="FEATURED" color={colors.primary} size="sm" />
                  <Ionicons name="star" size={18} color={colors.warning} />
                </View>

                <Text style={[styles.featuredTitle, { color: colors.textPrimary }]}>
                  Complete SAT Math Guide
                </Text>
                <Text style={[styles.featuredDesc, { color: colors.textMuted }]}>
                  Master every concept tested on the SAT Math section with
                  step-by-step explanations, practice problems, and proven
                  strategies from top scorers.
                </Text>
                <Text style={[styles.featuredMeta, { color: colors.textFaint }]}>
                  32 sections · 2hr read
                </Text>

                <View style={{ marginTop: SPACING.md }}>
                  <Button
                    label="Start Reading →"
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/guide-detail',
                        params: { subjectId: 'sat' },
                      })
                    }
                  />
                </View>
              </Card>
            </View>

            {/* Section title */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Browse by Subject</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                {filteredSubjects.length} subjects
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: SPACING.screenH, marginBottom: SPACING.sm }}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(app)/guide-detail',
                  params: { subjectId: item.id },
                })
              }
            >
              <Card padding="none" style={{ backgroundColor: colors.surface }}>
                {/* Cover image or colored band */}
                {item.coverImage ? (
                  <Image
                    source={{ uri: item.coverImage }}
                    style={{
                      height: 100,
                      borderTopLeftRadius: RADIUS.lg,
                      borderTopRightRadius: RADIUS.lg,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      height: 4,
                      backgroundColor: item.color,
                      borderTopLeftRadius: RADIUS.lg,
                      borderTopRightRadius: RADIUS.lg,
                    }}
                  />
                )}
                <View style={styles.subjectCardInner}>
                  <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
                    <Ionicons
                      name={(item.icon as any) || 'book'}
                      size={22}
                      color={item.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.subjectName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.subjectMeta, { color: colors.textMuted }]}>
                      {item.topics.length} topics · {guideCount(item.topics.length)} guides
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textFaint}
                  />
                </View>
              </Card>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={colors.textFaint} />
            <Text style={[styles.emptyText, { color: colors.textFaint }]}>No subjects found</Text>
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
  headerBand: {
    paddingHorizontal: SPACING.screenH,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.displaySemiBold,
    lineHeight: FONT_SIZES.xxl * 1.2,
  },
  pillRow: {
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  pillText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  featuredTitle: {
    fontSize: FONT_SIZES.md + 1,
    fontFamily: FONTS.sansBold,
    marginBottom: SPACING.xs,
    lineHeight: (FONT_SIZES.md + 1) * 1.2,
  },
  featuredDesc: {
    fontSize: FONT_SIZES.sm + 1,
    fontFamily: FONTS.sansRegular,
    lineHeight: (FONT_SIZES.sm + 1) * 1.6,
    marginBottom: SPACING.sm,
  },
  featuredMeta: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansMedium,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: SPACING.screenH,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md + 1,
    fontFamily: FONTS.displaySemiBold,
    lineHeight: (FONT_SIZES.md + 1) * 1.2,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  subjectCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: SPACING.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectName: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  subjectMeta: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    marginTop: 2,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.base * 1.5,
  },
});
