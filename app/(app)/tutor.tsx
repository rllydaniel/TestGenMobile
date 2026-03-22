import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Shimmer } from '@/components/ui/Shimmer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface TutorScreenProps {
  systemContext?: string;
  subject?: string;
}

// ---------------------------------------------------------------------------
// Typing indicator -- three dots animating opacity in sequence
// ---------------------------------------------------------------------------

const TypingIndicator = React.memo(function TypingIndicator() {
  const { colors } = useTheme();
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 200);
    const a3 = animate(dot3, 400);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 200 }}
    >
      <View style={s.typingRow}>
        <View style={[s.aiBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.aiLabelRow}>
            <Ionicons name="sparkles" size={12} color={colors.primary} />
            <Text style={[s.aiLabel, { color: colors.primary }]}>TestGen AI</Text>
          </View>
          <View style={s.dotsContainer}>
            {[dot1, dot2, dot3].map((dot, i) => (
              <Animated.View
                key={i}
                style={[s.dot, { opacity: dot, backgroundColor: colors.textMuted }]}
              />
            ))}
          </View>
        </View>
      </View>
    </MotiView>
  );
});

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const MessageItem = React.memo(function MessageItem({ item }: { item: Message }) {
  const { colors } = useTheme();
  const isAI = item.role === 'ai';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
    >
      <View style={[s.messageRow, isAI ? s.messageRowLeft : s.messageRowRight]}>
        <View style={isAI
          ? [s.aiBubble, { backgroundColor: colors.surface, borderColor: colors.border }]
          : [s.userBubble, { backgroundColor: colors.primary }]
        }>
          {isAI && (
            <View style={s.aiLabelRow}>
              <Ionicons name="sparkles" size={12} color={colors.primary} />
              <Text style={[s.aiLabel, { color: colors.primary }]}>TestGen AI</Text>
            </View>
          )}
          <Text style={isAI
            ? [s.aiText, { color: colors.textPrimary }]
            : [s.userText, { color: colors.textOnPrimary }]
          }>{item.text}</Text>
          <Text style={[
            s.timestamp,
            isAI
              ? { textAlign: 'left' as const, color: colors.textFaint }
              : { textAlign: 'right' as const, color: 'rgba(255,255,255,0.6)' },
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    </MotiView>
  );
});

// ---------------------------------------------------------------------------
// Quick action chips
// ---------------------------------------------------------------------------

const QUICK_ACTIONS = [
  'Explain this concept',
  'Give me an example',
  'Break it down simply',
  'Quiz me on this',
  'Compare and contrast',
  'Why is this important?',
];

// ---------------------------------------------------------------------------
// Mock AI responses
// ---------------------------------------------------------------------------

const MOCK_RESPONSES = [
  "That's a great question! Let me break it down for you step by step so it's easier to understand.",
  "Here's how I'd think about it: start with the fundamentals, then build up from there. Would you like me to go deeper into any part?",
  "Good thinking! The key concept here is to connect what you already know with this new information. Let me give you an analogy.",
  "I'd recommend focusing on understanding the 'why' behind this topic. Once that clicks, the details become much easier to remember.",
  "Let me walk you through an example that should make this clearer. Feel free to stop me if you have questions along the way!",
];

function getMockResponse(): string {
  return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

function buildWelcomeMessage(subject?: string): Message {
  const greeting = subject
    ? `Hi! I'm your AI tutor for ${subject}. Ask me anything, and I'll help you understand.`
    : "Hi! I'm your AI tutor. Ask me anything about your studies, and I'll help you understand.";
  return {
    id: 'welcome',
    role: 'ai',
    text: greeting,
    timestamp: new Date(),
  };
}

export default function TutorScreen({ systemContext, subject }: TutorScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [messages, setMessages] = useState<Message[]>([buildWelcomeMessage(subject)]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [inputHeight, setInputHeight] = useState(44);

  const flatListRef = useRef<FlatList<Message>>(null);

  // Track whether user has sent any messages yet (empty state)
  const hasUserMessages = messages.some((m) => m.role === 'user');

  // ---- Handlers ----------------------------------------------------------

  const handleSend = useCallback(
    (text?: string) => {
      const content = (text ?? inputText).trim();
      if (!content || isTyping) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: content,
        timestamp: new Date(),
      };

      setMessages((prev) => [userMsg, ...prev]);
      setInputText('');
      setInputHeight(44);
      setIsTyping(true);

      setTimeout(() => {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          text: getMockResponse(),
          timestamp: new Date(),
        };
        setMessages((prev) => [aiMsg, ...prev]);
        setIsTyping(false);
      }, 1500);
    },
    [inputText, isTyping],
  );

  const handleChipPress = useCallback(
    (chip: string) => {
      handleSend(chip);
    },
    [handleSend],
  );

  const handleNewChat = useCallback(() => {
    setMessages([{ ...buildWelcomeMessage(subject), id: 'welcome-' + Date.now(), timestamp: new Date() }]);
    setIsTyping(false);
    setInputText('');
  }, [subject]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleContentSizeChange = useCallback(
    (e: { nativeEvent: { contentSize: { height: number } } }) => {
      const h = Math.min(Math.max(44, e.nativeEvent.contentSize.height), 120);
      setInputHeight(h);
    },
    [],
  );

  // ---- Render helpers ----------------------------------------------------

  const renderMessage = useCallback(
    ({ item }: ListRenderItemInfo<Message>) => <MessageItem item={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const ListHeaderComponent = useCallback(() => {
    if (!isTyping) return null;
    return <TypingIndicator />;
  }, [isTyping]);

  // ---- Empty state (no user messages yet) --------------------------------

  const renderEmptyState = () => (
    <View style={s.emptyStateContainer}>
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <View style={s.emptyStateContent}>
          <Ionicons name="sparkles" size={48} color={colors.primary} style={{ opacity: 0.6 }} />
          <Text
            style={[
              s.emptyStateTitle,
              { color: colors.textPrimary },
            ]}
          >
            AI Tutor
          </Text>
          <Text
            style={[
              s.emptyStateSubtitle,
              { color: colors.textMuted },
            ]}
          >
            Ask me anything about your studies
          </Text>

          {/* 2x2 grid of quick action chips */}
          <View style={s.emptyChipsGrid}>
            {QUICK_ACTIONS.map((chip) => (
              <Pressable
                key={chip}
                style={({ pressed }) => [
                  s.emptyChip,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => handleChipPress(chip)}
                disabled={isTyping}
              >
                <Text
                  style={[s.chipText, { color: colors.textMuted, includeFontPadding: false }]}
                  numberOfLines={1}
                >
                  {chip}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </MotiView>
    </View>
  );

  // ---- UI ----------------------------------------------------------------

  const sendDisabled = inputText.trim().length === 0 || isTyping;

  return (
    <View style={[s.safe, { paddingTop: insets.top, backgroundColor: colors.appBackground }]}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* ---------- Header ---------- */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={({ pressed }) => [
              s.headerSide,
              { minHeight: 44, justifyContent: 'center' },
              pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>

          <View style={s.headerCenter}>
            <View style={s.headerTitleGroup}>
              <View style={s.headerTitleRow}>
                <Ionicons name="sparkles" size={18} color={colors.primary} />
                <Text style={[s.headerTitle, { color: colors.textPrimary, includeFontPadding: false }]}>
                  AI Tutor
                </Text>
              </View>
              {subject ? (
                <Text
                  style={[s.headerSubtitle, { color: colors.textMuted, includeFontPadding: false }]}
                  numberOfLines={1}
                >
                  {subject}
                </Text>
              ) : null}
            </View>
            {systemContext ? (
              <Badge text="Context" size="sm" />
            ) : null}
          </View>

          <View style={s.headerSide}>
            <Button
              label="New Chat"
              variant="ghost"
              size="sm"
              onPress={handleNewChat}
              icon={<Ionicons name="add-circle-outline" size={16} color={colors.textMuted} />}
            />
          </View>
        </View>

        {/* ---------- Chat area / Empty state ---------- */}
        {!hasUserMessages ? (
          renderEmptyState()
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={keyExtractor}
              inverted
              contentContainerStyle={s.chatContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={ListHeaderComponent}
            />

            {/* ---------- Quick action chips (horizontal scroll when chatting) ---------- */}
            <View style={[s.chipsRow, { borderTopColor: colors.border }]}>
              <FlatList
                horizontal
                data={QUICK_ACTIONS}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.chipsContainer}
                renderItem={({ item: chip }) => (
                  <Pressable
                    style={({ pressed }) => [
                      s.chip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={() => handleChipPress(chip)}
                    disabled={isTyping}
                  >
                    <Text style={[s.chipText, { color: colors.textMuted, includeFontPadding: false }]}>
                      {chip}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          </>
        )}

        {/* ---------- Input area ---------- */}
        <View style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, SPACING.sm), borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <TextInput
            style={[s.input, { height: inputHeight, backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary, includeFontPadding: false }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask your tutor..."
            placeholderTextColor={colors.textFaint}
            multiline
            onContentSizeChange={handleContentSizeChange}
            editable={!isTyping}
          />
          <Pressable
            style={({ pressed }) => [
              s.sendButton,
              { backgroundColor: colors.primary },
              sendDisabled && s.sendButtonDisabled,
              pressed && !sendDisabled && { opacity: 0.82, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => handleSend()}
            disabled={sendDisabled}
          >
            <Ionicons name="paper-plane" size={18} color={colors.textOnPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles (color-free — colors applied inline via useTheme)
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenH,
    borderBottomWidth: 1,
    paddingVertical: SPACING.xs,
  },
  headerSide: {
    width: 100,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.sansBold,
    lineHeight: FONT_SIZES.md * 1.5,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.xs * 1.5,
    marginTop: 2,
  },

  // Chat
  chatContent: {
    paddingHorizontal: SPACING.screenH,
    paddingVertical: SPACING.sm,
  },

  // Message rows
  messageRow: {
    marginVertical: SPACING.xs,
    maxWidth: '80%',
  },
  messageRowLeft: {
    alignSelf: 'flex-start',
  },
  messageRowRight: {
    alignSelf: 'flex-end',
  },

  // AI bubble
  aiBubble: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xs,
  },
  aiLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  aiText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.base * 1.6,
  },

  // User bubble
  userBubble: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  userText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.base * 1.6,
  },

  // Timestamp
  timestamp: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    marginTop: SPACING.xs,
    lineHeight: FONT_SIZES.xs * 1.5,
  },

  // Typing indicator
  typingRow: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    marginVertical: SPACING.xs,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Empty state
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenH,
  },
  emptyStateContent: {
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.displaySemiBold,
    lineHeight: FONT_SIZES.xl * 1.4,
    marginTop: SPACING.md,
  },
  emptyStateSubtitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.base * 1.5,
    marginTop: SPACING.xs,
  },
  emptyChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    maxWidth: 320,
  },
  emptyChip: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    justifyContent: 'center',
    width: '47%',
    alignItems: 'center',
  },

  // Chips (horizontal in chat mode)
  chipsRow: {
    flexGrow: 0,
    borderTopWidth: 1,
  },
  chipsContainer: {
    paddingHorizontal: SPACING.screenH,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.sm * 1.5,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.screenH,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
