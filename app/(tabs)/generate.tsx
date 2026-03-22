import React, { useState } from 'react';
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
import { MotiView } from 'moti';
import { subjects, Subject } from '@/lib/subjects';
import { Input } from '@/components/ui/Input';
import { SectionLabel } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/contexts/ThemeContext';
import {
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
  SHADOWS,
} from '@/constants/theme';

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  school: 'school',
  leaf: 'leaf',
  flask: 'flask',
  atom: 'nuclear',
  flag: 'flag',
  globe: 'globe',
  brain: 'bulb',
  book: 'book',
  calculator: 'calculator',
  shapes: 'shapes',
  'bar-chart': 'bar-chart',
  code: 'code',
  language: 'language',
  'trending-up': 'trending-up',
};

export default function GenerateScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const standardizedTests = filteredSubjects.filter(
    (s) => s.id === 'sat' || s.id === 'act',
  );
  const apSubjects = filteredSubjects.filter((s) => s.id.startsWith('ap-'));
  const coreSubjects = filteredSubjects.filter(
    (s) => !s.id.startsWith('ap-') && s.id !== 'sat' && s.id !== 'act',
  );

  const handleSelectSubject = (subject: Subject) => {
    router.push({
      pathname: '/(app)/test/wizard',
      params: { subjectId: subject.id },
    });
  };

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
        {/* Title */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300 }}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>Build Your Practice Test</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Customize your session — then start when you're ready.
          </Text>

          {/* Upload button */}
          <Pressable
            onPress={() => router.push('/(app)/upload')}
            style={({ pressed }) => [
              styles.uploadButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={18}
              color={colors.textPrimary}
            />
            <Text style={[styles.uploadButtonText, { color: colors.textPrimary }]}>Upload Notes Instead</Text>
          </Pressable>
        </MotiView>

        {/* Search */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: 100 }}
        >
          <View style={{ marginBottom: SPACING.lg }}>
            <Input
              placeholder="e.g., AP Physics I, SAT Math..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              icon={
                <Ionicons name="book" size={18} color={colors.textMuted} />
              }
            />
          </View>
        </MotiView>

        {/* Subject sections */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: 200 }}
        >
          {standardizedTests.length > 0 && (
            <View style={{ marginBottom: SPACING.lg }}>
              <SubjectSection
                title="Standardized Tests"
                subjects={standardizedTests}
                onSelect={handleSelectSubject}
              />
            </View>
          )}
          {apSubjects.length > 0 && (
            <View style={{ marginBottom: SPACING.lg }}>
              <SubjectSection
                title="AP Subjects"
                subjects={apSubjects}
                onSelect={handleSelectSubject}
              />
            </View>
          )}
          {coreSubjects.length > 0 && (
            <View style={{ marginBottom: SPACING.lg }}>
              <SubjectSection
                title="Core Subjects"
                subjects={coreSubjects}
                onSelect={handleSelectSubject}
              />
            </View>
          )}
        </MotiView>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Subject Section                                                    */
/* ------------------------------------------------------------------ */

function SubjectSection({
  title,
  subjects: subjectList,
  onSelect,
}: {
  title: string;
  subjects: Subject[];
  onSelect: (s: Subject) => void;
}) {
  const { colors } = useTheme();
  return (
    <View>
      <SectionLabel>{title.toUpperCase()}</SectionLabel>
      <View style={{ gap: SPACING.sm }}>
        {subjectList.map((subject) => (
          <Pressable
            key={subject.id}
            onPress={() => onSelect(subject)}
            style={({ pressed }) => [
              styles.subjectCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.subjectIconCircle,
                { backgroundColor: subject.color + '20' },
              ]}
            >
              <Ionicons
                name={iconMap[subject.icon] ?? 'book'}
                size={22}
                color={subject.color}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subjectName, { color: colors.textPrimary }]}>{subject.name}</Text>
              <Text style={[styles.subjectTopicCount, { color: colors.textMuted }]}>
                {subject.topics.length} topics
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.displaySemiBold,
    lineHeight: FONT_SIZES.xxl * 1.2,
  },
  subtitle: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
    lineHeight: FONT_SIZES.sm * 1.6,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    gap: SPACING.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: SPACING.lg,
    minHeight: 44,
    ...SHADOWS.sm,
  },
  uploadButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansMedium,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    minHeight: 44,
    ...SHADOWS.sm,
  },
  subjectIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectName: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansMedium,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  subjectTopicCount: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.6,
  },
});
