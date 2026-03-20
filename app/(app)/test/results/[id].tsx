import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Question, TestConfig } from '@/types/test';
import { subjects } from '@/lib/subjects';

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    config: string;
    questions: string;
    answers: string;
    score: string;
  }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const config: TestConfig = params.config ? JSON.parse(params.config) : {};
  const questions: Question[] = params.questions
    ? JSON.parse(params.questions)
    : [];
  const userAnswers: Record<string, string> = params.answers
    ? JSON.parse(params.answers)
    : {};
  const score = parseInt(params.score ?? '0', 10);
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const subject = subjects.find((s) => s.id === config.subjectId);

  const getScoreColor = () => {
    if (percentage >= 80) return '#00B894';
    if (percentage >= 60) return '#FDCB6E';
    return '#FF6B6B';
  };

  const getGrade = () => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? '#1A1A2E' : '#F8F9FA' }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Banner */}
        <Card
          style={{
            alignItems: 'center',
            paddingVertical: 32,
            backgroundColor: isDark ? '#16213E' : '#FFFFFF',
          }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 5,
              borderColor: getScoreColor(),
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: '800',
                color: getScoreColor(),
              }}
            >
              {percentage}%
            </Text>
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: isDark ? '#FFFFFF' : '#1A1A2E',
            }}
          >
            Grade: {getGrade()}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: isDark ? '#ADB5BD' : '#6C757D',
              marginTop: 4,
            }}
          >
            {score} out of {questions.length} correct
          </Text>
          {subject && (
            <Badge
              text={subject.name}
              color={subject.color}
              size="md"
            />
          )}
        </Card>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={24} color="#00B894" />
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: '#00B894',
                marginTop: 4,
              }}
            >
              {score}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#ADB5BD' : '#6C757D',
              }}
            >
              Correct
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Ionicons name="close-circle" size={24} color="#FF6B6B" />
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: '#FF6B6B',
                marginTop: 4,
              }}
            >
              {questions.length - score}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#ADB5BD' : '#6C757D',
              }}
            >
              Incorrect
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Ionicons name="remove-circle" size={24} color="#ADB5BD" />
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: isDark ? '#ADB5BD' : '#6C757D',
                marginTop: 4,
              }}
            >
              {questions.filter((q) => !userAnswers[q.id]).length}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#ADB5BD' : '#6C757D',
              }}
            >
              Skipped
            </Text>
          </Card>
        </View>

        {/* Question Review */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#1A1A2E',
          }}
        >
          Question Review
        </Text>

        {questions.map((question, index) => {
          const userAnswer = userAnswers[question.id];
          const isCorrect =
            question.type === 'short_response'
              ? false // Short response needs AI grading
              : userAnswer === question.correctAnswer;
          const wasAnswered = !!userAnswer;

          return (
            <Card key={question.id}>
              <View style={{ gap: 10 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: !wasAnswered
                        ? '#ADB5BD20'
                        : isCorrect
                          ? '#00B89420'
                          : '#FF6B6B20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={
                        !wasAnswered
                          ? 'remove'
                          : isCorrect
                            ? 'checkmark'
                            : 'close'
                      }
                      size={18}
                      color={
                        !wasAnswered
                          ? '#ADB5BD'
                          : isCorrect
                            ? '#00B894'
                            : '#FF6B6B'
                      }
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: isDark ? '#ADB5BD' : '#6C757D',
                    }}
                  >
                    Question {index + 1}
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 15,
                    color: isDark ? '#FFFFFF' : '#1A1A2E',
                    lineHeight: 22,
                  }}
                >
                  {question.text}
                </Text>

                {wasAnswered && !isCorrect && (
                  <View
                    style={{
                      backgroundColor: '#FF6B6B10',
                      borderRadius: 8,
                      padding: 10,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: '#FF6B6B' }}>
                      Your answer:{' '}
                      {question.type === 'mcq'
                        ? question.options?.find((o) => o.id === userAnswer)
                            ?.text ?? userAnswer
                        : userAnswer}
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    backgroundColor: '#00B89410',
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <Text style={{ fontSize: 13, color: '#00B894' }}>
                    Correct answer:{' '}
                    {question.type === 'mcq'
                      ? question.options?.find(
                          (o) => o.id === question.correctAnswer
                        )?.text ?? question.correctAnswer
                      : question.correctAnswer}
                  </Text>
                </View>

                {question.explanation && (
                  <View
                    style={{
                      backgroundColor: isDark ? '#2D3A5C' : '#F3F4F6',
                      borderRadius: 8,
                      padding: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: isDark ? '#ADB5BD' : '#6C757D',
                        lineHeight: 20,
                      }}
                    >
                      {question.explanation}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          );
        })}

        {/* Actions */}
        <View style={{ gap: 12, marginTop: 8 }}>
          <Button
            title="Generate New Test"
            onPress={() => router.replace('/(tabs)/generate')}
            size="lg"
            icon={<Ionicons name="add-circle" size={20} color="#FFFFFF" />}
          />
          <Button
            title="Back to Home"
            onPress={() => router.replace('/(tabs)')}
            variant="outline"
            size="lg"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
