import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { useSupabase } from '@/hooks/useSupabase';
import { useQuery } from '@tanstack/react-query';

export default function LeaderboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? '#1A1A2E' : '#F8F9FA' }}
    >
      <View style={{ flex: 1, padding: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
            gap: 12,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? '#FFFFFF' : '#1A1A2E'}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: isDark ? '#FFFFFF' : '#1A1A2E',
            }}
          >
            Leaderboard
          </Text>
        </View>

        {/* Period Filter */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {(['weekly', 'monthly', 'all'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor:
                  period === p ? '#6C5CE7' : isDark ? '#16213E' : '#F3F4F6',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: period === p ? '#FFFFFF' : isDark ? '#ADB5BD' : '#6C757D',
                  textTransform: 'capitalize',
                }}
              >
                {p === 'all' ? 'All Time' : p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={entries}
          keyExtractor={(item, index) => item.id ?? String(index)}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item, index }) => {
            const medalColor = getMedalColor(index);
            return (
              <Card>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: medalColor
                        ? medalColor + '30'
                        : isDark
                          ? '#2D3A5C'
                          : '#F3F4F6',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {medalColor ? (
                      <Ionicons name="medal" size={20} color={medalColor} />
                    ) : (
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '700',
                          color: isDark ? '#ADB5BD' : '#6C757D',
                        }}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: isDark ? '#FFFFFF' : '#1A1A2E',
                      }}
                    >
                      {item.username ?? 'Anonymous'}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '800',
                      color: '#6C5CE7',
                    }}
                  >
                    {item.score ?? 0}
                  </Text>
                </View>
              </Card>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}
