import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useTestHistory } from '@/hooks/useTests';
import { subjects } from '@/lib/subjects';
import { theme, getScoreColor, formatRelativeDate } from '@/lib/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const { data: tests, isLoading } = useTestHistory();
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) return <LoadingScreen message="Loading history..." />;

  const filteredTests = (tests ?? []).filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const subjectName = subjects.find((s) => s.id === t.subject)?.name ?? t.subject;
    return (
      subjectName.toLowerCase().includes(q) ||
      t.topics?.some((topic: string) => topic.toLowerCase().includes(q))
    );
  });

  const totalTests = tests?.length ?? 0;
  const avgScore = totalTests > 0
    ? Math.round(tests!.reduce((sum, t) => sum + (t.score / t.totalQuestions) * 100, 0) / totalTests)
    : 0;
  const bestScore = totalTests > 0
    ? Math.round(Math.max(...tests!.map((t) => (t.score / t.totalQuestions) * 100)))
    : 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: 16, paddingBottom: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Ionicons name="time" size={28} color={theme.primary} />
            <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text }}>
              Test History
            </Text>
          </View>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 16 }}>
            Your past tests and performance over time
          </Text>

          {/* Summary Stats */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <View style={{
              flex: 1, backgroundColor: theme.card, borderRadius: 12, padding: 14,
              borderWidth: 1, borderColor: theme.cardBorder, alignItems: 'center',
            }}>
              <Ionicons name="book" size={20} color={theme.primary} style={{ marginBottom: 6 }} />
              <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800' }}>{totalTests}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}>Tests Taken</Text>
            </View>
            <View style={{
              flex: 1, backgroundColor: theme.card, borderRadius: 12, padding: 14,
              borderWidth: 1, borderColor: theme.cardBorder, alignItems: 'center',
            }}>
              <Ionicons name="trending-up" size={20} color={theme.warning} style={{ marginBottom: 6 }} />
              <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800' }}>{avgScore}%</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}>Avg Score</Text>
            </View>
            <View style={{
              flex: 1, backgroundColor: theme.card, borderRadius: 12, padding: 14,
              borderWidth: 1, borderColor: theme.cardBorder, alignItems: 'center',
            }}>
              <Ionicons name="trophy" size={20} color={theme.orange} style={{ marginBottom: 6 }} />
              <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800' }}>{bestScore}%</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}>Best Score</Text>
            </View>
          </View>

          {/* Search */}
          <Input
            placeholder="Search by topic or subject..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon={<Ionicons name="search" size={18} color={theme.textMuted} />}
          />

          <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 12, marginBottom: 8 }}>
            Showing {filteredTests.length} of {totalTests} Tests
          </Text>
        </View>

        {filteredTests.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No tests yet"
            description="Generate your first test to see your history here."
            actionTitle="Generate Test"
            onAction={() => router.push('/(tabs)/generate')}
          />
        ) : (
          <FlatList
            data={filteredTests}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}
            renderItem={({ item }) => {
              const pct = Math.round((item.score / item.totalQuestions) * 100);
              const scoreColor = getScoreColor(pct);
              const subjectName = subjects.find((s) => s.id === item.subject)?.name ?? item.subject;

              return (
                <TouchableOpacity
                  onPress={() =>
                    router.push({ pathname: '/(app)/test/results/[id]', params: { id: item.id } })
                  }
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: theme.card,
                    borderRadius: 14,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    borderLeftWidth: 3,
                    borderLeftColor: scoreColor,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>
                        {item.topics?.[0] ?? subjectName}
                      </Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
                        {subjectName}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                        <Badge text="MCQ" color={theme.textMuted} />
                        <Badge text={item.difficulty ?? 'random'} color={theme.textMuted} />
                        <Badge text={`${item.timeTaken ?? '—'}s`} color={theme.textMuted} />
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                        <Ionicons name="calendar-outline" size={12} color={theme.textMuted} />
                        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                          {formatRelativeDate(item.completedAt)}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: scoreColor, fontSize: 26, fontWeight: '800' }}>{pct}%</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                        {item.score}/{item.totalQuestions}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
