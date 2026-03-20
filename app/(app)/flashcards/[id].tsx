import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useFlashcardDeck } from '@/hooks/useFlashcards';

const { width } = Dimensions.get('window');

export default function FlashcardStudyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { data: deck, isLoading } = useFlashcardDeck(id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());

  if (isLoading) return <LoadingScreen message="Loading flashcards..." />;
  if (!deck || deck.cards.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text
          style={{
            fontSize: 16,
            color: isDark ? '#ADB5BD' : '#6C757D',
          }}
        >
          No cards in this deck
        </Text>
        <Button title="Go Back" onPress={() => router.back()} variant="ghost" />
      </SafeAreaView>
    );
  }

  const card = deck.cards[currentIndex];
  const progress = (currentIndex + 1) / deck.cards.length;
  const isComplete = currentIndex >= deck.cards.length;

  const handleFlip = () => setShowBack(!showBack);

  const handleKnew = () => {
    setKnown((prev) => new Set(prev).add(card.id));
    nextCard();
  };

  const handleDidntKnow = () => {
    nextCard();
  };

  const nextCard = () => {
    setShowBack(false);
    if (currentIndex < deck.cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session complete
      setCurrentIndex(deck.cards.length);
    }
  };

  if (isComplete) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: isDark ? '#1A1A2E' : '#F8F9FA',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 20,
        }}
      >
        <Ionicons name="checkmark-circle" size={72} color="#00B894" />
        <Text
          style={{
            fontSize: 24,
            fontWeight: '800',
            color: isDark ? '#FFFFFF' : '#1A1A2E',
          }}
        >
          Session Complete!
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: isDark ? '#ADB5BD' : '#6C757D',
            textAlign: 'center',
          }}
        >
          You knew {known.size} out of {deck.cards.length} cards
        </Text>
        <ProgressBar
          progress={known.size / deck.cards.length}
          color="#00CEC9"
          height={10}
        />
        <View style={{ gap: 12, width: '100%', marginTop: 12 }}>
          <Button
            title="Study Again"
            onPress={() => {
              setCurrentIndex(0);
              setShowBack(false);
              setKnown(new Set());
            }}
            size="lg"
          />
          <Button
            title="Back to Decks"
            onPress={() => router.back()}
            variant="outline"
            size="lg"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? '#1A1A2E' : '#F8F9FA' }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
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
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: isDark ? '#FFFFFF' : '#1A1A2E',
            }}
          >
            {deck.name}
          </Text>
          <Text style={{ fontSize: 13, color: isDark ? '#ADB5BD' : '#6C757D' }}>
            Card {currentIndex + 1} of {deck.cards.length}
          </Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        <ProgressBar progress={progress} color="#00CEC9" />
      </View>

      {/* Card */}
      <View
        style={{
          flex: 1,
          padding: 16,
          justifyContent: 'center',
        }}
      >
        <TouchableOpacity
          onPress={handleFlip}
          activeOpacity={0.9}
          style={{
            width: width - 32,
            minHeight: 300,
            backgroundColor: isDark ? '#16213E' : '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.12,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#6C5CE7',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {showBack ? 'Answer' : 'Question'}
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: isDark ? '#FFFFFF' : '#1A1A2E',
              textAlign: 'center',
              lineHeight: 30,
            }}
          >
            {showBack ? card.back : card.front}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? '#6C757D' : '#ADB5BD',
              marginTop: 20,
            }}
          >
            Tap to {showBack ? 'see question' : 'reveal answer'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      {showBack && (
        <View
          style={{
            flexDirection: 'row',
            padding: 16,
            gap: 12,
          }}
        >
          <Button
            title="Didn't Know"
            onPress={handleDidntKnow}
            variant="destructive"
            size="lg"
            style={{ flex: 1 }}
            icon={<Ionicons name="close" size={20} color="#FFFFFF" />}
          />
          <Button
            title="Knew It!"
            onPress={handleKnew}
            variant="secondary"
            size="lg"
            style={{ flex: 1 }}
            icon={<Ionicons name="checkmark" size={20} color="#FFFFFF" />}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
