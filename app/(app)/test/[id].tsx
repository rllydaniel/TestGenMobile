import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Question, TestConfig } from '@/types/test';

export default function TestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    config: string;
    questions: string;
  }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const config: TestConfig = params.config ? JSON.parse(params.config) : {};
  const questions: Question[] = params.questions
    ? JSON.parse(params.questions)
    : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(
    config.timerEnabled ? config.timerMinutes * 60 : 0
  );

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;

  // Timer
  useEffect(() => {
    if (!config.timerEnabled || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [config.timerEnabled, timeRemaining]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const setAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = useCallback(() => {
    const correctCount = questions.reduce((count, q) => {
      const userAnswer = answers[q.id];
      if (!userAnswer) return count;
      if (q.type === 'mcq' || q.type === 'true_false') {
        return userAnswer === q.correctAnswer ? count + 1 : count;
      }
      return count;
    }, 0);

    router.replace({
      pathname: '/(app)/test/results/[id]',
      params: {
        id: 'latest',
        config: params.config,
        questions: params.questions,
        answers: JSON.stringify(answers),
        score: String(correctCount),
      },
    });
  }, [answers, questions, params]);

  const confirmSubmit = () => {
    const unanswered = questions.filter((q) => !answers[q.id]).length;
    if (unanswered > 0) {
      Alert.alert(
        'Submit Test?',
        `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', style: 'destructive', onPress: handleSubmit },
        ]
      );
    } else {
      handleSubmit();
    }
  };

  if (!currentQuestion) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>No questions available</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="ghost" />
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
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#1A1A2E',
            flex: 1,
          }}
        >
          Question {currentIndex + 1}/{questions.length}
        </Text>
        {config.timerEnabled && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: timeRemaining < 60 ? '#FF6B6B20' : '#6C5CE720',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Ionicons
              name="timer-outline"
              size={18}
              color={timeRemaining < 60 ? '#FF6B6B' : '#6C5CE7'}
            />
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: timeRemaining < 60 ? '#FF6B6B' : '#6C5CE7',
              }}
            >
              {formatTime(timeRemaining)}
            </Text>
          </View>
        )}
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        <ProgressBar progress={progress} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Question */}
        <Card>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '600',
              color: isDark ? '#FFFFFF' : '#1A1A2E',
              lineHeight: 26,
            }}
          >
            {currentQuestion.text}
          </Text>
        </Card>

        {/* Answer Options */}
        {currentQuestion.type === 'mcq' && currentQuestion.options && (
          <View style={{ gap: 10 }}>
            {currentQuestion.options.map((option) => {
              const selected = answers[currentQuestion.id] === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setAnswer(currentQuestion.id, option.id)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: selected
                      ? '#6C5CE715'
                      : isDark
                        ? '#16213E'
                        : '#FFFFFF',
                    borderRadius: 14,
                    padding: 16,
                    gap: 12,
                    borderWidth: selected ? 1.5 : 1,
                    borderColor: selected
                      ? '#6C5CE7'
                      : isDark
                        ? '#2D3A5C'
                        : '#E5E7EB',
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      borderWidth: 2,
                      borderColor: selected ? '#6C5CE7' : isDark ? '#4A5568' : '#CBD5E0',
                      backgroundColor: selected ? '#6C5CE7' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selected && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: isDark ? '#FFFFFF' : '#1A1A2E',
                      lineHeight: 22,
                    }}
                  >
                    {option.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {currentQuestion.type === 'true_false' && (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {['True', 'False'].map((option) => {
              const selected = answers[currentQuestion.id] === option;
              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => setAnswer(currentQuestion.id, option)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 18,
                    borderRadius: 14,
                    backgroundColor: selected
                      ? option === 'True'
                        ? '#00B894'
                        : '#FF6B6B'
                      : isDark
                        ? '#16213E'
                        : '#FFFFFF',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: selected
                      ? 'transparent'
                      : isDark
                        ? '#2D3A5C'
                        : '#E5E7EB',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: '700',
                      color: selected
                        ? '#FFFFFF'
                        : isDark
                          ? '#FFFFFF'
                          : '#1A1A2E',
                    }}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {currentQuestion.type === 'short_response' && (
          <Card>
            <TextInput
              placeholder="Type your answer..."
              placeholderTextColor={isDark ? '#6C757D' : '#9CA3AF'}
              value={answers[currentQuestion.id] ?? ''}
              onChangeText={(text) => setAnswer(currentQuestion.id, text)}
              multiline
              numberOfLines={4}
              style={{
                fontSize: 16,
                color: isDark ? '#FFFFFF' : '#1A1A2E',
                minHeight: 120,
                textAlignVertical: 'top',
              }}
            />
          </Card>
        )}
      </ScrollView>

      {/* Navigation Footer */}
      <View
        style={{
          flexDirection: 'row',
          padding: 16,
          gap: 12,
          borderTopWidth: 1,
          borderTopColor: isDark ? '#2D3A5C' : '#E5E7EB',
          backgroundColor: isDark ? '#16213E' : '#FFFFFF',
        }}
      >
        <Button
          title="Previous"
          onPress={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          variant="outline"
          disabled={currentIndex === 0}
          style={{ flex: 1 }}
        />
        {currentIndex === questions.length - 1 ? (
          <Button
            title="Submit"
            onPress={confirmSubmit}
            variant="primary"
            style={{ flex: 1 }}
            icon={<Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
          />
        ) : (
          <Button
            title="Next"
            onPress={() =>
              setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))
            }
            variant="primary"
            style={{ flex: 1 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
