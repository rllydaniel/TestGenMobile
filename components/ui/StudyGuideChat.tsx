import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { MathRenderer } from '@/components/ui/MathRenderer';
import { callEdgeFunction } from '@/lib/api/edgeFunctions';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = SCREEN_WIDTH * 0.85;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface StudyGuideChatProps {
  visible: boolean;
  onClose: () => void;
  subject: string;
  unit?: string;
}

function TypingDots({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, paddingVertical: 8, paddingLeft: 4 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
            opacity: 0.5,
          }}
        />
      ))}
    </View>
  );
}

export function StudyGuideChat({ visible, onClose, subject, unit }: StudyGuideChatProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const slideX = useSharedValue(PANEL_WIDTH);
  const backdropOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      slideX.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(0.4, { duration: 280 });
    } else {
      slideX.value = withTiming(PANEL_WIDTH, { duration: 250, easing: Easing.in(Easing.cubic) });
      backdropOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const data = await callEdgeFunction<{ response: string }>({
        functionName: 'ai-tutor',
        body: { message: text, history, subject, unit },
      });

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I couldn\'t process that. Please try again.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [input, loading, messages, subject, unit]);

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
      {/* Backdrop */}
      <Pressable onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Animated.View style={[{ flex: 1, backgroundColor: '#000000' }, backdropStyle]} />
      </Pressable>

      {/* Panel */}
      <Animated.View
        style={[
          panelStyle,
          {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: PANEL_WIDTH,
            backgroundColor: colors.appBackground,
            borderLeftWidth: 1,
            borderLeftColor: colors.border,
            ...SHADOWS.lg,
          },
        ]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: insets.top + 8,
              paddingHorizontal: SPACING.md,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="sparkles" size={14} color="#FFFFFF" />
              </View>
              <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: FONT_SIZES.base, color: colors.textPrimary }} numberOfLines={1}>
                AI Tutor
              </Text>
            </View>
            <Pressable onPress={onClose} style={{ minHeight: 44, justifyContent: 'center', paddingLeft: 12 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Messages */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: SPACING.md, gap: 16, flexGrow: 1 }}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                <Ionicons name="chatbubbles-outline" size={36} color={colors.textFaint} />
                <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.sm, color: colors.textMuted, marginTop: 12, textAlign: 'center' }}>
                  Ask me anything about{'\n'}{subject}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isUser = item.role === 'user';
              return (
                <View style={{ alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  {!isUser && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Ionicons name="sparkles" size={10} color={colors.primary} />
                      <Text style={{ fontFamily: FONTS.sansMedium, fontSize: FONT_SIZES.xs, color: colors.textMuted }}>
                        Tutor
                      </Text>
                    </View>
                  )}
                  {isUser ? (
                    <View style={{
                      backgroundColor: colors.primaryLight,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: RADIUS.md,
                      maxWidth: '90%',
                    }}>
                      <Text style={{ fontFamily: FONTS.sansRegular, fontSize: FONT_SIZES.sm, color: colors.textPrimary, lineHeight: FONT_SIZES.sm * 1.5 }}>
                        {item.content}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ maxWidth: '95%' }}>
                      <MathRenderer
                        content={item.content}
                        fontSize={FONT_SIZES.sm}
                        style={{ color: colors.textPrimary, lineHeight: FONT_SIZES.sm * 1.6 }}
                      />
                    </View>
                  )}
                </View>
              );
            }}
            ListFooterComponent={loading ? <TypingDots color={colors.textMuted} /> : null}
          />

          {/* Input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 8,
              paddingHorizontal: SPACING.md,
              paddingTop: 10,
              paddingBottom: insets.bottom + 10,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.appBackground,
            }}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask a question..."
              placeholderTextColor={colors.textFaint}
              multiline
              style={{
                flex: 1,
                fontFamily: FONTS.sansRegular,
                fontSize: FONT_SIZES.sm,
                color: colors.textPrimary,
                backgroundColor: colors.surface,
                borderRadius: RADIUS.md,
                paddingHorizontal: 12,
                paddingVertical: 10,
                maxHeight: 100,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              onSubmitEditing={handleSend}
            />
            <Pressable
              onPress={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: input.trim() ? colors.primary : colors.surfaceSecondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-up" size={18} color={input.trim() ? '#FFFFFF' : colors.textFaint} />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}
