import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { subjects, Subject } from '@/lib/subjects';

const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
const PREMIUM_THRESHOLD = 20;
const MINUTES_PER_QUESTION = 1.25;
const MAX_TOPICS = 5;

type QuestionType = 'multiple-choice' | 'short-answer' | 'true-false';
type Difficulty = 'easy' | 'mixed' | 'hard';

const QUESTION_TYPES: { key: QuestionType; label: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'multiple-choice', label: 'Multiple Choice', subtitle: 'Pick from options', icon: 'checkbox-outline' },
  { key: 'short-answer', label: 'Short Answer', subtitle: 'Written responses', icon: 'create-outline' },
  { key: 'true-false', label: 'True / False', subtitle: 'Statement judgments', icon: 'swap-horizontal-outline' },
];

const DIFFICULTIES: { key: Difficulty; label: string; bars: number[] }[] = [
  { key: 'easy', label: 'Easy', bars: [1, 0, 0] },
  { key: 'mixed', label: 'Mixed', bars: [1, 1, 0] },
  { key: 'hard', label: 'Hard', bars: [1, 1, 1] },
];

function hapticFeedback() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default function TestWizardScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(subjectId ?? null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(20);
  const [questionType, setQuestionType] = useState<QuestionType>('multiple-choice');
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) ?? null,
    [selectedSubjectId],
  );

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjects;
    const q = subjectSearch.toLowerCase();
    return subjects.filter((s) => s.name.toLowerCase().includes(q));
  }, [subjectSearch]);

  const estimatedMinutes = Math.round(questionCount * MINUTES_PER_QUESTION);

  // ---------- handlers ----------

  function handleSelectSubject(subject: Subject) {
    hapticFeedback();
    setSelectedSubjectId(subject.id);
    setSelectedTopics([]);
    setShowSubjectModal(false);
    setSubjectSearch('');
  }

  function handleToggleTopic(topicId: string) {
    hapticFeedback();
    setSelectedTopics((prev) => {
      if (prev.includes(topicId)) return prev.filter((t) => t !== topicId);
      if (prev.length >= MAX_TOPICS) return prev;
      return [...prev, topicId];
    });
  }

  function handleSelectCount(count: number) {
    hapticFeedback();
    setQuestionCount(count);
  }

  function handleSelectQuestionType(type: QuestionType) {
    hapticFeedback();
    setQuestionType(type);
  }

  function handleSelectDifficulty(d: Difficulty) {
    hapticFeedback();
    setDifficulty(d);
  }

  function handleStartTest() {
    hapticFeedback();
    router.push({
      pathname: '/(app)/test/[id]',
      params: {
        id: 'new',
        subjectId: selectedSubjectId ?? '',
        topics: selectedTopics.join(','),
        count: String(questionCount),
        type: questionType,
        difficulty,
      },
    });
  }

  // ---------- summary line ----------

  const difficultyLabel = DIFFICULTIES.find((d) => d.key === difficulty)?.label ?? 'Mixed';
  const subjectLabel = selectedSubject?.name ?? 'No subject';
  const summaryText = `${questionCount} Qs \u00B7 ${subjectLabel} \u00B7 ${difficultyLabel} \u00B7 Timed`;

  // ---------- render ----------

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: SPACING.screenH,
          paddingTop: insets.top + SPACING.md,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ===== HEADER ===== */}
        <View style={{ marginBottom: SPACING.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
            <Pressable
              onPress={() => {
                hapticFeedback();
                router.back();
              }}
              hitSlop={12}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Build Your Practice Test</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Customize your session — then start when you're ready.
          </Text>
          <Button
            label="Upload Notes Instead"
            variant="outline"
            size="sm"
            onPress={() => {
              hapticFeedback();
            }}
            icon={<Ionicons name="cloud-upload-outline" size={16} color={colors.textMuted} />}
            style={{ alignSelf: 'flex-start', marginTop: SPACING.md }}
          />
        </View>

        {/* ===== SUBJECT / EXAM ===== */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>SUBJECT / EXAM</Text>
          <Pressable
            style={[
              styles.selectorButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              selectedSubject && { borderColor: selectedSubject.color },
            ]}
            onPress={() => {
              hapticFeedback();
              setShowSubjectModal(true);
            }}
          >
            {selectedSubject ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <Ionicons
                  name={(selectedSubject.icon as keyof typeof Ionicons.glyphMap) ?? 'book'}
                  size={20}
                  color={selectedSubject.color}
                />
                <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.base, color: colors.textPrimary, lineHeight: FONT_SIZES.base * 1.5, flex: 1 }}>
                  {selectedSubject.name}
                </Text>
              </View>
            ) : (
              <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZES.base, color: colors.textFaint, lineHeight: FONT_SIZES.base * 1.5 }}>
                Select a subject or exam...
              </Text>
            )}
            <Ionicons name="chevron-down" size={20} color={colors.textFaint} />
          </Pressable>
        </View>

        {/* ===== TOPICS ===== */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>TOPICS</Text>
          {selectedSubject ? (
            <>
              <View style={styles.pillContainer}>
                {selectedSubject.topics.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.id);
                  return (
                    <Pressable
                      key={topic.id}
                      onPress={() => handleToggleTopic(topic.id)}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontFamily: FONTS.sansMedium,
                          fontSize: FONT_SIZES.sm,
                          color: isSelected ? colors.textOnPrimary : colors.textMuted,
                          lineHeight: FONT_SIZES.sm * 1.5,
                        }}
                      >
                        {topic.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.helperText, { color: colors.textFaint }]}>
                {selectedTopics.length}/{MAX_TOPICS} topics selected — select up to {MAX_TOPICS} or type your own
              </Text>
            </>
          ) : (
            <Text style={[styles.helperText, { color: colors.textFaint }]}>Select a subject first to see topics.</Text>
          )}
        </View>

        {/* ===== QUESTION COUNT ===== */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>QUESTION COUNT</Text>
          <View style={{ alignItems: 'center', marginBottom: SPACING.md }}>
            <Text style={[styles.bigNumber, { color: colors.textPrimary }]}>{questionCount}</Text>
            <Text style={[styles.estimateText, { color: colors.textMuted }]}>~{estimatedMinutes} minutes</Text>
          </View>
          <View style={styles.countRow}>
            {QUESTION_COUNTS.map((count) => {
              const isSelected = count === questionCount;
              const isPremiumLocked = count > PREMIUM_THRESHOLD;
              return (
                <Pressable
                  key={count}
                  onPress={() => handleSelectCount(count)}
                  style={[
                    styles.countChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      opacity: isPremiumLocked && !isSelected ? 0.45 : 1,
                    },
                  ]}
                >
                  {isPremiumLocked && (
                    <Ionicons
                      name="lock-closed"
                      size={10}
                      color={isSelected ? colors.textOnPrimary : colors.textFaint}
                      style={{ marginRight: 2 }}
                    />
                  )}
                  <Text
                    style={{
                      fontFamily: FONTS.sansMedium,
                      fontSize: FONT_SIZES.sm,
                      color: isSelected ? colors.textOnPrimary : isPremiumLocked ? colors.textFaint : colors.textMuted,
                      lineHeight: FONT_SIZES.sm * 1.5,
                    }}
                  >
                    {count}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {/* Track marks */}
          <View style={styles.trackMarks}>
            {[0, ...QUESTION_COUNTS].map((n) => (
              <Text key={n} style={[styles.trackMarkText, { color: colors.textFaint }]}>
                {n}
              </Text>
            ))}
          </View>
        </View>

        {/* ===== QUESTION TYPE ===== */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>QUESTION TYPE</Text>
          <View style={styles.typeRow}>
            {QUESTION_TYPES.map((qt) => {
              const isSelected = qt.key === questionType;
              return (
                <Pressable
                  key={qt.key}
                  onPress={() => handleSelectQuestionType(qt.key)}
                  style={{ flex: 1 }}
                >
                  <Card
                    style={{
                      alignItems: 'center' as const,
                      paddingVertical: SPACING.md,
                      backgroundColor: colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                  >
                    <Ionicons
                      name={qt.icon}
                      size={24}
                      color={isSelected ? colors.primary : colors.textMuted}
                      style={{ marginBottom: 6 }}
                    />
                    {isSelected && (
                      <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                        <Ionicons name="checkmark" size={10} color={colors.textOnPrimary} />
                      </View>
                    )}
                    <Text
                      style={{
                        fontFamily: FONTS.sansMedium,
                        fontSize: FONT_SIZES.xs,
                        color: isSelected ? colors.textPrimary : colors.textMuted,
                        textAlign: 'center',
                        marginBottom: 2,
                        lineHeight: FONT_SIZES.xs * 1.5,
                      }}
                      numberOfLines={1}
                    >
                      {qt.label}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.sansRegular,
                        fontSize: 10,
                        color: colors.textFaint,
                        textAlign: 'center',
                        lineHeight: 10 * 1.5,
                      }}
                      numberOfLines={1}
                    >
                      {qt.subtitle}
                    </Text>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ===== DIFFICULTY ===== */}
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>DIFFICULTY</Text>
          <View style={styles.typeRow}>
            {DIFFICULTIES.map((d) => {
              const isSelected = d.key === difficulty;
              return (
                <Pressable
                  key={d.key}
                  onPress={() => handleSelectDifficulty(d.key)}
                  style={{ flex: 1 }}
                >
                  <Card
                    style={{
                      alignItems: 'center' as const,
                      paddingVertical: SPACING.md,
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                  >
                    {/* Visual bars icon */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginBottom: 8, height: 24 }}>
                      {d.bars.map((active, i) => (
                        <View
                          key={i}
                          style={{
                            width: 6,
                            height: 8 + i * 8,
                            borderRadius: 2,
                            backgroundColor: active
                              ? isSelected
                                ? colors.textOnPrimary
                                : colors.textMuted
                              : isSelected
                                ? 'rgba(255,255,255,0.25)'
                                : colors.textFaint,
                          }}
                        />
                      ))}
                    </View>
                    <Text
                      style={{
                        fontFamily: FONTS.sansMedium,
                        fontSize: FONT_SIZES.sm + 1,
                        color: isSelected ? colors.textOnPrimary : colors.textMuted,
                        lineHeight: (FONT_SIZES.sm + 1) * 1.5,
                      }}
                    >
                      {d.label}
                    </Text>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ===== STICKY BOTTOM CTA ===== */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + SPACING.sm,
            backgroundColor: colors.appBackground,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.summaryText, { color: colors.textMuted }]} numberOfLines={1}>
          {summaryText}
        </Text>
        <Button
          label="Start Test →"
          onPress={handleStartTest}
          size="lg"
          style={{ width: '100%' } as any}
          disabled={!selectedSubject}
        />
      </View>

      {/* ===== SUBJECT MODAL ===== */}
      <Modal
        visible={showSubjectModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
          {/* Modal header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={{ fontFamily: FONTS.sansBold, fontSize: FONT_SIZES.md + 1, color: colors.textPrimary, lineHeight: (FONT_SIZES.md + 1) * 1.2 }}>
              Select Subject / Exam
            </Text>
            <Pressable
              onPress={() => {
                setShowSubjectModal(false);
                setSubjectSearch('');
              }}
              hitSlop={12}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Search input */}
          <View style={{ paddingHorizontal: SPACING.screenH, marginBottom: SPACING.md }}>
            <Input
              placeholder="Search subjects..."
              value={subjectSearch}
              onChangeText={setSubjectSearch}
              icon={<Ionicons name="search" size={18} color={colors.textFaint} />}
            />
          </View>

          {/* Subject list */}
          <FlatList
            data={filteredSubjects}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: SPACING.screenH }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isActive = item.id === selectedSubjectId;
              return (
                <Pressable
                  onPress={() => handleSelectSubject(item)}
                  style={[
                    styles.subjectRow,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isActive && { borderColor: item.color, backgroundColor: colors.primaryLight },
                  ]}
                >
                  <View
                    style={[
                      styles.subjectIcon,
                      { backgroundColor: item.color + '20' },
                    ]}
                  >
                    <Ionicons
                      name={(item.icon as keyof typeof Ionicons.glyphMap) ?? 'book'}
                      size={20}
                      color={item.color}
                    />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: FONTS.sansMedium,
                      fontSize: FONT_SIZES.base,
                      color: colors.textPrimary,
                      lineHeight: FONT_SIZES.base * 1.5,
                    }}
                  >
                    {item.name}
                  </Text>
                  {isActive && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
          />
        </View>
      </Modal>
    </View>
  );
}

// ---------- styles ----------

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    lineHeight: FONT_SIZES.xl * 1.2,
  },
  headerSubtitle: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.6,
    marginLeft: 32,
  },
  sectionLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    height: 52,
    minHeight: 44,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  helperText: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  bigNumber: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 48,
    lineHeight: 48 * 1.2,
  },
  estimateText: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm + 1,
    marginTop: 2,
    lineHeight: (FONT_SIZES.sm + 1) * 1.5,
  },
  countRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    minWidth: 48,
    minHeight: 44,
  },
  trackMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    paddingHorizontal: 4,
  },
  trackMarkText: {
    fontFamily: FONTS.sansRegular,
    fontSize: 10,
    lineHeight: 10 * 1.5,
  },
  typeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: SPACING.screenH,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  summaryText: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenH,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    minHeight: 44,
  },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
