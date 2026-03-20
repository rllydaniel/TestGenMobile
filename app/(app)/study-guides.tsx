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
import { subjects } from '@/lib/subjects';

export default function StudyGuidesScreen() {
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
            Study Guides
          </Text>
        </View>

        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                // Navigate to subject study guide detail
                // For now, just show subject topics
              }}
              activeOpacity={0.7}
            >
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
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: item.color + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="book" size={22} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '700',
                        color: isDark ? '#FFFFFF' : '#1A1A2E',
                      }}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: isDark ? '#ADB5BD' : '#6C757D',
                      }}
                    >
                      {item.topics.length} topics available
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isDark ? '#4A5568' : '#CBD5E0'}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
