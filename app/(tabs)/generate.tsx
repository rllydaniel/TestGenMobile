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
import { subjects, Subject } from '@/lib/subjects';
import { Input } from '@/components/ui/Input';
import { theme } from '@/lib/theme';

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  school: 'school',
  leaf: 'leaf',
  flask: 'flask',
  atom: 'nuclear',
  flag: 'flag',
  globe: 'globe',
  brain: 'bulb',
  book: 'book',
  calculator: 'calculator',
  shapes: 'shapes',
  'bar-chart': 'bar-chart',
  code: 'code',
  language: 'language',
  'trending-up': 'trending-up',
};

export default function GenerateScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const standardizedTests = filteredSubjects.filter(
    (s) => s.id === 'sat' || s.id === 'act'
  );
  const apSubjects = filteredSubjects.filter((s) => s.id.startsWith('ap-'));
  const coreSubjects = filteredSubjects.filter(
    (s) => !s.id.startsWith('ap-') && s.id !== 'sat' && s.id !== 'act'
  );

  const handleSelectSubject = (subject: Subject) => {
    router.push({
      pathname: '/(app)/test/wizard',
      params: { subjectId: subject.id },
    });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text }}>
            Build Your Practice Test
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 4 }}>
            Customize your session — then start when you're ready.
          </Text>
        </View>

        {/* Upload Notes */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/upload')}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.card,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 8,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            alignSelf: 'flex-start',
          }}
        >
          <Ionicons name="cloud-upload-outline" size={18} color={theme.text} />
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>
            Upload Notes Instead
          </Text>
        </TouchableOpacity>

        {/* Search */}
        <Input
          placeholder="e.g., AP Physics I, SAT Math..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Ionicons name="book" size={18} color={theme.textMuted} />}
        />

        {/* Standardized Tests */}
        {standardizedTests.length > 0 && (
          <SubjectSection
            title="Standardized Tests"
            subjects={standardizedTests}
            onSelect={handleSelectSubject}
          />
        )}

        {/* AP Subjects */}
        {apSubjects.length > 0 && (
          <SubjectSection
            title="AP Subjects"
            subjects={apSubjects}
            onSelect={handleSelectSubject}
          />
        )}

        {/* Core Subjects */}
        {coreSubjects.length > 0 && (
          <SubjectSection
            title="Core Subjects"
            subjects={coreSubjects}
            onSelect={handleSelectSubject}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SubjectSection({
  title,
  subjects: subjectList,
  onSelect,
}: {
  title: string;
  subjects: Subject[];
  onSelect: (s: Subject) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </Text>
      <View style={{ gap: 8 }}>
        {subjectList.map((subject) => (
          <TouchableOpacity
            key={subject.id}
            onPress={() => onSelect(subject)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.card,
              borderRadius: 14,
              padding: 14,
              gap: 12,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: subject.color + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={iconMap[subject.icon] ?? 'book'}
                size={22}
                color={subject.color}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                {subject.name}
              </Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                {subject.topics.length} topics
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
