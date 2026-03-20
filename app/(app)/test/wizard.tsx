import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { subjects } from '@/lib/subjects';
import {
  QUESTION_COUNTS,
  DIFFICULTY_LEVELS,
  QUESTION_TYPES,
  type Difficulty,
  type QuestionType,
} from '@/lib/constants';
import { useGenerateTest } from '@/hooks/useTests';
import { TestConfig } from '@/types/test';

type WizardStep = 'topics' | 'config' | 'review';

export default function TestWizardScreen() {
  const router = useRouter();
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const subject = subjects.find((s) => s.id === subjectId);
  const generateTest = useGenerateTest();

  const [step, setStep] = useState<WizardStep>('topics');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [questionType, setQuestionType] = useState<QuestionType>('Multiple Choice');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(15);

  if (!subject) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Subject not found</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="ghost" />
      </SafeAreaView>
    );
  }

  const stepIndex = step === 'topics' ? 0 : step === 'config' ? 1 : 2;

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((t) => t !== topicId) : [...prev, topicId]
    );
  };

  const selectAllTopics = () => {
    if (selectedTopics.length === subject.topics.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(subject.topics.map((t) => t.id));
    }
  };

  const handleGenerate = async () => {
    const config: TestConfig = {
      subjectId: subject.id,
      topicIds: selectedTopics,
      questionCount,
      questionType,
      difficulty,
      timerEnabled,
      timerMinutes,
    };

    try {
      const questions = await generateTest.mutateAsync(config);
      router.replace({
        pathname: '/(app)/test/[id]',
        params: {
          id: 'new',
          config: JSON.stringify(config),
          questions: JSON.stringify(questions),
        },
      });
    } catch {
      // Error handled by mutation state
    }
  };

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
        <TouchableOpacity onPress={() => (step === 'topics' ? router.back() : setStep(step === 'config' ? 'topics' : 'config'))}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? '#FFFFFF' : '#1A1A2E'}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: isDark ? '#FFFFFF' : '#1A1A2E',
            }}
          >
            {subject.name}
          </Text>
          <Text style={{ fontSize: 13, color: isDark ? '#ADB5BD' : '#6C757D' }}>
            Step {stepIndex + 1} of 3
          </Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        <ProgressBar progress={(stepIndex + 1) / 3} color={subject.color} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {step === 'topics' && (
          <>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: isDark ? '#FFFFFF' : '#1A1A2E',
                }}
              >
                Select Topics
              </Text>
              <TouchableOpacity onPress={selectAllTopics}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6C5CE7' }}>
                  {selectedTopics.length === subject.topics.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>

            {subject.topics.map((topic) => {
              const selected = selectedTopics.includes(topic.id);
              return (
                <TouchableOpacity
                  key={topic.id}
                  onPress={() => toggleTopic(topic.id)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: selected
                      ? subject.color + '15'
                      : isDark
                        ? '#16213E'
                        : '#FFFFFF',
                    borderRadius: 12,
                    padding: 14,
                    gap: 12,
                    borderWidth: selected ? 1.5 : 0,
                    borderColor: selected ? subject.color : 'transparent',
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: selected ? subject.color : isDark ? '#4A5568' : '#CBD5E0',
                      backgroundColor: selected ? subject.color : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '500',
                      color: isDark ? '#FFFFFF' : '#1A1A2E',
                      flex: 1,
                    }}
                  >
                    {topic.name}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <Button
              title="Continue"
              onPress={() => setStep('config')}
              disabled={selectedTopics.length === 0}
              size="lg"
            />
          </>
        )}

        {step === 'config' && (
          <>
            {/* Question Count */}
            <Card>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: isDark ? '#FFFFFF' : '#1A1A2E',
                  marginBottom: 12,
                }}
              >
                Number of Questions
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {QUESTION_COUNTS.map((count) => (
                  <TouchableOpacity
                    key={count}
                    onPress={() => setQuestionCount(count)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor:
                        questionCount === count
                          ? '#6C5CE7'
                          : isDark
                            ? '#2D3A5C'
                            : '#F3F4F6',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: questionCount === count ? '#FFFFFF' : isDark ? '#ADB5BD' : '#6C757D',
                      }}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Question Type */}
            <Card>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: isDark ? '#FFFFFF' : '#1A1A2E',
                  marginBottom: 12,
                }}
              >
                Question Type
              </Text>
              <View style={{ gap: 8 }}>
                {QUESTION_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setQuestionType(type)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor:
                        questionType === type
                          ? '#6C5CE715'
                          : isDark
                            ? '#2D3A5C'
                            : '#F3F4F6',
                      borderWidth: questionType === type ? 1.5 : 0,
                      borderColor: '#6C5CE7',
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: questionType === type ? '#6C5CE7' : isDark ? '#4A5568' : '#CBD5E0',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {questionType === type && (
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: '#6C5CE7',
                          }}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '500',
                        color: isDark ? '#FFFFFF' : '#1A1A2E',
                      }}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Difficulty */}
            <Card>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: isDark ? '#FFFFFF' : '#1A1A2E',
                  marginBottom: 12,
                }}
              >
                Difficulty
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {DIFFICULTY_LEVELS.map((level) => {
                  const colors = {
                    Easy: '#00B894',
                    Medium: '#FDCB6E',
                    Hard: '#FF6B6B',
                  };
                  return (
                    <TouchableOpacity
                      key={level}
                      onPress={() => setDifficulty(level)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor:
                          difficulty === level
                            ? colors[level]
                            : isDark
                              ? '#2D3A5C'
                              : '#F3F4F6',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color:
                            difficulty === level
                              ? '#FFFFFF'
                              : isDark
                                ? '#ADB5BD'
                                : '#6C757D',
                        }}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>

            {/* Timer */}
            <Card>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: isDark ? '#FFFFFF' : '#1A1A2E',
                    }}
                  >
                    Timer
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: isDark ? '#ADB5BD' : '#6C757D',
                    }}
                  >
                    {timerEnabled ? `${timerMinutes} minutes` : 'No time limit'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setTimerEnabled(!timerEnabled)}
                  style={{
                    width: 52,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: timerEnabled ? '#6C5CE7' : isDark ? '#2D3A5C' : '#E5E7EB',
                    justifyContent: 'center',
                    padding: 2,
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: '#FFFFFF',
                      alignSelf: timerEnabled ? 'flex-end' : 'flex-start',
                    }}
                  />
                </TouchableOpacity>
              </View>
            </Card>

            <Button
              title="Review & Generate"
              onPress={() => setStep('review')}
              size="lg"
            />
          </>
        )}

        {step === 'review' && (
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: isDark ? '#FFFFFF' : '#1A1A2E',
              }}
            >
              Review Your Test
            </Text>

            <Card>
              <View style={{ gap: 12 }}>
                <ReviewRow label="Subject" value={subject.name} isDark={isDark} />
                <ReviewRow
                  label="Topics"
                  value={`${selectedTopics.length} selected`}
                  isDark={isDark}
                />
                <ReviewRow
                  label="Questions"
                  value={String(questionCount)}
                  isDark={isDark}
                />
                <ReviewRow label="Type" value={questionType} isDark={isDark} />
                <ReviewRow label="Difficulty" value={difficulty} isDark={isDark} />
                <ReviewRow
                  label="Timer"
                  value={timerEnabled ? `${timerMinutes} min` : 'Off'}
                  isDark={isDark}
                />
              </View>
            </Card>

            {generateTest.isError && (
              <Text style={{ color: '#FF6B6B', textAlign: 'center' }}>
                Failed to generate test. Please try again.
              </Text>
            )}

            <Button
              title="Generate Test"
              onPress={handleGenerate}
              loading={generateTest.isPending}
              size="lg"
              icon={<Ionicons name="sparkles" size={20} color="#FFFFFF" />}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReviewRow({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 15, color: isDark ? '#ADB5BD' : '#6C757D' }}>
        {label}
      </Text>
      <Text
        style={{
          fontSize: 15,
          fontWeight: '600',
          color: isDark ? '#FFFFFF' : '#1A1A2E',
        }}
      >
        {value}
      </Text>
    </View>
  );
}
