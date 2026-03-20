import React from 'react';
import {
  View,
  Text,
  FlatList,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';

const ACHIEVEMENTS = [
  { id: '1', name: 'First Test', description: 'Complete your first test', icon: 'ribbon', color: '#6C5CE7' },
  { id: '2', name: 'Perfect Score', description: 'Get 100% on a test', icon: 'star', color: '#FDCB6E' },
  { id: '3', name: 'Study Streak', description: 'Maintain a 7-day streak', icon: 'flame', color: '#FF6347' },
  { id: '4', name: 'Subject Master', description: 'Complete 10 tests in one subject', icon: 'school', color: '#00CEC9' },
  { id: '5', name: 'Flash Scholar', description: 'Master a flashcard deck', icon: 'flash', color: '#00B894' },
  { id: '6', name: 'Night Owl', description: 'Study after midnight', icon: 'moon', color: '#A29BFE' },
  { id: '7', name: 'Speed Demon', description: 'Finish a test with >50% time remaining', icon: 'speedometer', color: '#E84393' },
  { id: '8', name: 'Marathon', description: 'Complete 50 tests total', icon: 'trophy', color: '#D63031' },
  { id: '9', name: 'Diverse Learner', description: 'Complete tests in 5 different subjects', icon: 'globe', color: '#E17055' },
  { id: '10', name: 'Upload Pro', description: 'Generate 5 quizzes from uploaded notes', icon: 'cloud-upload', color: '#FD79A8' },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
            Achievements
          </Text>
        </View>

        <FlatList
          data={ACHIEVEMENTS}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item }) => {
            const unlocked = false; // TODO: check from API
            return (
              <Card
                style={{
                  flex: 1,
                  alignItems: 'center',
                  padding: 16,
                  opacity: unlocked ? 1 : 0.5,
                }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: item.color + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={26}
                    color={item.color}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: isDark ? '#FFFFFF' : '#1A1A2E',
                    textAlign: 'center',
                  }}
                >
                  {item.name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? '#ADB5BD' : '#6C757D',
                    textAlign: 'center',
                    marginTop: 2,
                  }}
                >
                  {item.description}
                </Text>
                {unlocked && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#00B894"
                    style={{ marginTop: 6 }}
                  />
                )}
              </Card>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}
