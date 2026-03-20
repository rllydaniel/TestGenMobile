import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useDashboardStats, useStreak } from '@/hooks/useStats';
import { useProfile } from '@/hooks/useProfile';
import { useTestHistory } from '@/hooks/useTests';
import { theme, getScoreColor, formatShortDate } from '@/lib/theme';
import { subjects } from '@/lib/subjects';

export default function HomeScreen() {
  const router = useRouter();
  const { data: stats } = useDashboardStats();
  const { data: streak } = useStreak();
  const { data: profile } = useProfile();
  const { data: tests } = useTestHistory();

  const greeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const recentTests = tests?.slice(0, 5) ?? [];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Resume Test Banner (placeholder) */}
        {recentTests.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/generate')}
            activeOpacity={0.8}
            style={{
              backgroundColor: theme.primary,
              borderRadius: 14,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#FFFFFF20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="play" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF90', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                CREATE NEW TEST
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginTop: 2 }}>
                Generate a personalized practice test
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#FFFFFF20',
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>
                Start
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Greeting */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text, fontStyle: 'italic' }}>
            {greeting()}, {profile?.username ?? 'Student'}.
          </Text>
          <Text style={{ fontSize: 13, color: theme.textSecondary }}>{today}</Text>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <StatCard label="STREAK" value={String(streak?.current_streak ?? 0)} unit="days" icon="flame" iconColor={theme.orange} />
          <StatCard label="TESTS TAKEN" value={String(stats?.testsCompleted ?? 0)} unit="total" icon="bar-chart" iconColor={theme.primary} />
          <StatCard label="ACCURACY" value={`${stats?.averageScore ?? 0}%`} icon="pie-chart" iconColor={theme.primary} isAccuracy accuracyPct={stats?.averageScore ?? 0} />
          <StatCard label="TODAY'S FOCUS" icon="time" iconColor={theme.textSecondary} isFocus />
        </View>

        {/* Action Cards */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/study')}
            activeOpacity={0.7}
            style={{
              flex: 1,
              backgroundColor: theme.card,
              borderRadius: 14,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#4F6BF620', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="layers" size={22} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>Flashcards</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Review and study your saved cards</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/generate')}
            activeOpacity={0.7}
            style={{
              flex: 1,
              backgroundColor: theme.card,
              borderRadius: 14,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#22C55E20', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add-circle" size={22} color={theme.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>Create Test</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Generate a personalized practice test</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Recent Performance */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Recent Performance</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
              <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '600' }}>View All Results</Text>
            </TouchableOpacity>
          </View>

          {recentTests.length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
              <Text style={{ color: theme.success, fontSize: 13, marginBottom: 12 }}>
                Accuracy up {stats?.averageScore ?? 0}% over your last {recentTests.length} tests
              </Text>
            </View>
          )}

          {/* Table header */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.cardBorder }}>
            <Text style={{ flex: 2, color: theme.textMuted, fontSize: 12, fontWeight: '600' }}>Test</Text>
            <Text style={{ flex: 1, color: theme.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>Date</Text>
            <Text style={{ flex: 1, color: theme.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>Score</Text>
            <Text style={{ flex: 1, color: theme.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'right' }}>Status</Text>
          </View>

          {recentTests.map((test, idx) => {
            const pct = Math.round((test.score / test.totalQuestions) * 100);
            const scoreColor = getScoreColor(pct);
            const subjectName = subjects.find((s) => s.id === test.subject)?.name ?? test.subject;

            return (
              <TouchableOpacity
                key={test.id ?? idx}
                onPress={() => router.push({ pathname: '/(app)/test/results/[id]', params: { id: test.id } })}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.cardBorder,
                }}
              >
                <View style={{ flex: 2 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                    {test.topics?.[0] ?? subjectName}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{subjectName}</Text>
                </View>
                <Text style={{ flex: 1, color: theme.textSecondary, fontSize: 13, textAlign: 'center' }}>
                  {formatShortDate(test.completedAt)}
                </Text>
                <Text style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
                  {test.score}/{test.totalQuestions}
                </Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Badge text={`${pct}%`} color={scoreColor} />
                </View>
              </TouchableOpacity>
            );
          })}

          {recentTests.length === 0 && (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: theme.textMuted, fontSize: 14 }}>No tests yet. Generate your first test!</Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  unit,
  icon,
  iconColor,
  isAccuracy,
  accuracyPct,
  isFocus,
}: {
  label: string;
  value?: string;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  isAccuracy?: boolean;
  accuracyPct?: number;
  isFocus?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.cardBorder,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>{label}</Text>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      {isFocus ? (
        <View>
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>Study</Text>
          <Badge text="Start" color={theme.primary} size="sm" />
        </View>
      ) : isAccuracy ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2.5, borderColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary }} />
          </View>
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>{value}</Text>
        </View>
      ) : (
        <View>
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>{value}</Text>
          {unit && <Text style={{ color: theme.textMuted, fontSize: 11 }}>{unit}</Text>}
        </View>
      )}
    </View>
  );
}
