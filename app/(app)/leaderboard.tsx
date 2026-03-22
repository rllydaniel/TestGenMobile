import React, { useState } from 'react';
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
import { useSupabase } from '@/hooks/useSupabase';
import { useQuery } from '@tanstack/react-query';
import { FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const supabase = useSupabase();
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all'>('weekly');

  const { data: entries } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const getMedalColor = (rank: number) => {
    if (rank === 0) return '#FFD700';
    if (rank === 1) return '#C0C0C0';
    if (rank === 2) return '#CD7F32';
    return undefined;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <View style={{ flex: 1, paddingHorizontal: SPACING.screenH, paddingTop: insets.top + SPACING.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: FONT_SIZES.xl, fontFamily: FONTS.displaySemiBold, color: colors.textPrimary, lineHeight: FONT_SIZES.xl * 1.2 }}>
            Leaderboard
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg }}>
          {(['weekly', 'monthly', 'all'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={{
                flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm,
                backgroundColor: period === p ? colors.primary : colors.primaryLight,
                alignItems: 'center',
                minHeight: 44,
                justifyContent: 'center',
              }}
            >
              <Text style={{
                fontSize: FONT_SIZES.sm, fontFamily: FONTS.sansSemiBold,
                color: period === p ? colors.textOnPrimary : colors.textMuted,
                textTransform: 'capitalize',
                lineHeight: FONT_SIZES.sm * 1.5,
              }}>
                {p === 'all' ? 'All Time' : p}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={entries}
          keyExtractor={(item, index) => item.id ?? String(index)}
          contentContainerStyle={{ gap: SPACING.sm, paddingBottom: 120 }}
          renderItem={({ item, index }) => {
            const medalColor = getMedalColor(index);
            return (
              <Card style={{ backgroundColor: colors.surface }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: medalColor ? medalColor + '30' : colors.primaryLight,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {medalColor ? (
                      <Ionicons name="medal" size={20} color={medalColor} />
                    ) : (
                      <Text style={{ fontSize: FONT_SIZES.sm + 1, fontFamily: FONTS.sansBold, color: colors.textMuted, lineHeight: (FONT_SIZES.sm + 1) * 1.5 }}>
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FONT_SIZES.base, fontFamily: FONTS.sansMedium, color: colors.textPrimary, lineHeight: FONT_SIZES.base * 1.5 }}>
                      {item.username ?? 'Anonymous'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: FONT_SIZES.base, fontFamily: FONTS.sansBold, color: colors.primary, lineHeight: FONT_SIZES.base * 1.5 }}>
                    {item.score ?? 0}
                  </Text>
                </View>
              </Card>
            );
          }}
        />
      </View>
    </View>
  );
}
