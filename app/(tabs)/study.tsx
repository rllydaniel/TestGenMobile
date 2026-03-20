import React, { useState } from 'react';
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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useFlashcardDecks } from '@/hooks/useFlashcards';
import { theme } from '@/lib/theme';

export default function StudyScreen() {
  const router = useRouter();
  const { data: decks } = useFlashcardDecks();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const totalDue = decks?.reduce((sum, d) => sum + (d.cardCount - d.masteredCount), 0) ?? 0;

  const filters = ['All', ...(decks?.map((d) => d.subject).filter((v, i, a) => a.indexOf(v) === i) ?? [])];

  const filteredDecks = (decks ?? []).filter((d) => {
    if (activeFilter !== 'All' && d.subject !== activeFilter) return false;
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text }}>Flashcards</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 4 }}>
              Master concepts with spaced repetition
            </Text>
          </View>
          <Button
            title="Create Deck"
            onPress={() => router.push('/(tabs)/generate')}
            size="sm"
            icon={<Ionicons name="add" size={16} color="#FFFFFF" />}
          />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginVertical: 16 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: activeFilter === filter ? theme.primary : theme.card,
                borderWidth: 1,
                borderColor: activeFilter === filter ? theme.primary : theme.cardBorder,
              }}
            >
              <Text
                style={{
                  color: activeFilter === filter ? '#FFFFFF' : theme.textSecondary,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search */}
        <Input
          placeholder="Search flashcards..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Ionicons name="search" size={18} color={theme.textMuted} />}
        />

        {/* Due Banner */}
        {totalDue > 0 && (
          <TouchableOpacity
            onPress={() => {
              if (decks && decks.length > 0) {
                router.push({ pathname: '/(app)/flashcards/[id]', params: { id: decks[0].id } });
              }
            }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.card,
              borderRadius: 14,
              padding: 16,
              borderWidth: 1,
              borderColor: '#4F6BF640',
              marginTop: 16,
            }}
          >
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: '#4F6BF620', alignItems: 'center', justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="play" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>
                {totalDue} cards due for review
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
                Keep your streak going!
              </Text>
            </View>
            <View style={{
              backgroundColor: theme.primary, borderRadius: 10,
              paddingHorizontal: 16, paddingVertical: 8,
            }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>
                Review Due
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Deck Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
          {filteredDecks.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', padding: 32 }}>
              <Ionicons name="flash-outline" size={48} color={theme.textMuted} />
              <Text style={{ color: theme.textSecondary, fontSize: 15, marginTop: 12, textAlign: 'center' }}>
                No flashcard decks yet. Generate some after taking a test!
              </Text>
            </View>
          ) : (
            filteredDecks.map((deck) => {
              const masteredPct = deck.cardCount > 0 ? Math.round((deck.masteredCount / deck.cardCount) * 100) : 0;
              const dueCount = deck.cardCount - deck.masteredCount;

              return (
                <View
                  key={deck.id}
                  style={{
                    width: '48%',
                    backgroundColor: theme.card,
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>{deck.name}</Text>
                      <Badge text={deck.subject ?? 'General'} color={theme.primary} size="sm" />
                    </View>
                    <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: theme.cardBorder, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: theme.textMuted, fontSize: 8 }}>{masteredPct}%</Text>
                    </View>
                  </View>

                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 2 }}>
                    {deck.cardCount} cards · {dueCount} due
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 12 }}>
                    {masteredPct}% mastered
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: '/(app)/flashcards/[id]', params: { id: deck.id } })}
                      style={{
                        flex: 1, backgroundColor: theme.primary, borderRadius: 8,
                        paddingVertical: 8, flexDirection: 'row', alignItems: 'center',
                        justifyContent: 'center', gap: 4,
                      }}
                    >
                      <Ionicons name="play" size={14} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Study</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1, backgroundColor: theme.surface, borderRadius: 8,
                        paddingVertical: 8, flexDirection: 'row', alignItems: 'center',
                        justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: theme.cardBorder,
                      }}
                    >
                      <Ionicons name="pencil" size={14} color={theme.textSecondary} />
                      <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600' }}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
