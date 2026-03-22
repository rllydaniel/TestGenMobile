import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';

export default function AchievementsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const ACHIEVEMENTS = [
    { id: '1', name: 'First Test', description: 'Complete your first test', icon: 'ribbon', color: '#6C5CE7' },
    { id: '2', name: 'Perfect Score', description: 'Get 100% on a test', icon: 'star', color: '#FDCB6E' },
    { id: '3', name: 'Study Streak', description: 'Maintain a 7-day streak', icon: 'flame', color: '#FF6347' },
    { id: '4', name: 'Subject Master', description: 'Complete 10 tests in one subject', icon: 'school', color: '#00CEC9' },
    { id: '5', name: 'Flash Scholar', description: 'Master a flashcard deck', icon: 'flash', color: colors.success },
    { id: '6', name: 'Night Owl', description: 'Study after midnight', icon: 'moon', color: '#A29BFE' },
    { id: '7', name: 'Speed Demon', description: 'Finish a test with >50% time remaining', icon: 'speedometer', color: '#E84393' },
    { id: '8', name: 'Marathon', description: 'Complete 50 tests total', icon: 'trophy', color: '#D63031' },
    { id: '9', name: 'Diverse Learner', description: 'Complete tests in 5 different subjects', icon: 'globe', color: '#E17055' },
    { id: '10', name: 'Upload Pro', description: 'Generate 5 quizzes from uploaded notes', icon: 'cloud-upload', color: '#FD79A8' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <View style={{ flex: 1, paddingHorizontal: SPACING.screenH, paddingTop: insets.top + SPACING.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: FONT_SIZES.xl, fontFamily: FONTS.displaySemiBold, color: colors.textPrimary, lineHeight: FONT_SIZES.xl * 1.2 }}>
            Achievements
          </Text>
        </View>

        <FlatList
          data={ACHIEVEMENTS}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 120 }}
          renderItem={({ item }) => {
            const unlocked = false; // TODO: check from API
            return (
              <Card style={{ flex: 1, alignItems: 'center', padding: SPACING.md, opacity: unlocked ? 1 : 0.5, backgroundColor: colors.surface }}>
                <View style={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: item.color + '20',
                  alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
                }}>
                  <Ionicons name={item.icon as any} size={26} color={item.color} />
                </View>
                <Text style={{ fontSize: FONT_SIZES.sm + 1, fontFamily: FONTS.sansBold, color: colors.textPrimary, textAlign: 'center', lineHeight: (FONT_SIZES.sm + 1) * 1.5 }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, fontFamily: FONTS.sansRegular, color: colors.textMuted, textAlign: 'center', marginTop: 2, lineHeight: FONT_SIZES.xs * 1.5 }}>
                  {item.description}
                </Text>
                {unlocked && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} style={{ marginTop: 6 }} />
                )}
              </Card>
            );
          }}
        />
      </View>
    </View>
  );
}
