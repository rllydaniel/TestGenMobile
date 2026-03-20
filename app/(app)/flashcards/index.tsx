import React from 'react';
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
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useFlashcardDecks } from '@/hooks/useFlashcards';

export default function FlashcardsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { data: decks, isLoading } = useFlashcardDecks();

  if (isLoading) return <LoadingScreen message="Loading flashcards..." />;

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
            Flashcards
          </Text>
        </View>

        {!decks || decks.length === 0 ? (
          <EmptyState
            icon="flash-outline"
            title="No flashcard decks"
            description="Complete a test to auto-generate flashcards, or create them manually."
            actionTitle="Generate Test"
            onAction={() => router.push('/(tabs)/generate')}
          />
        ) : (
          <FlatList
            data={decks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(app)/flashcards/[id]',
                    params: { id: item.id },
                  })
                }
                activeOpacity={0.7}
              >
                <Card>
                  <View style={{ gap: 10 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: '700',
                          color: isDark ? '#FFFFFF' : '#1A1A2E',
                        }}
                      >
                        {item.name}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={isDark ? '#4A5568' : '#CBD5E0'}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        color: isDark ? '#ADB5BD' : '#6C757D',
                      }}
                    >
                      {item.cardCount} cards · {item.masteredCount} mastered
                    </Text>
                    <ProgressBar
                      progress={
                        item.cardCount > 0
                          ? item.masteredCount / item.cardCount
                          : 0
                      }
                      color="#00CEC9"
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
