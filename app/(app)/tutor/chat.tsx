import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptic } from '@/hooks/useHaptic';
import { callEdgeFunction } from '@/lib/api/edgeFunctions';
import { useTutorMessages, useSendTutorMessage } from '@/hooks/useTutor';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';
import type { TutorMessage } from '@/types/tutor';

const QUICK_ACTIONS = [
  { label: 'Explain this', icon: 'bulb-outline' },
  { label: 'Give an example', icon: 'flask-outline' },
  { label: 'Quiz me', icon: 'help-circle-outline' },
  { label: 'Simplify', icon: 'layers-outline' },
];

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, colors }: { message: TutorMessage; colors: any }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.bubbleWrapperUser : styles.bubbleWrapperAssistant]}>
      {!isUser && (
        <View style={[styles.avatarDot, { backgroundColor: colors.primary }]}>
          <Ionicons name="sparkles" size={11} color="#FFF" />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: colors.primary }]
            : [styles.bubbleAssistant, { backgroundColor: colors.surface, ...SHADOWS.sm }],
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isUser ? '#FFFFFF' : colors.textPrimary },
          ]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ colors }: { colors: any }) {
  return (
    <View style={[styles.bubbleWrapper, styles.bubbleWrapperAssistant]}>
      <View style={[styles.avatarDot, { backgroundColor: colors.primary }]}>
        <Ionicons name="sparkles" size={11} color="#FFF" />
      </View>
      <View style={[styles.bubble, styles.bubbleAssistant, { backgroundColor: colors.surface, ...SHADOWS.sm }]}>
        <View style={styles.typingDots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.typingDot, { backgroundColor: colors.textFaint }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TutorChatScreen() {
  const { colors } = useTheme();
  const { impact } = useHaptic();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();

  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<TutorMessage[]>([]);

  const flatListRef = useRef<FlatList>(null);
  const sendMessage = useSendTutorMessage();

  const { data: dbMessages = [], isLoading } = useTutorMessages(params.sessionId);

  // Merge db messages with optimistic ones, deduplicating by id
  const allMessages = React.useMemo(() => {
    const dbIds = new Set(dbMessages.map((m) => m.id));
    const extras = optimisticMessages.filter((m) => !dbIds.has(m.id));
    return [...dbMessages, ...extras].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [dbMessages, optimisticMessages]);

  // Clear optimistic messages when db catches up
  useEffect(() => {
    if (dbMessages.length > 0) {
      setOptimisticMessages([]);
    }
  }, [dbMessages]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    if (allMessages.length > 0) scrollToBottom();
  }, [allMessages.length]);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking || !params.sessionId) return;

      setInputText('');
      impact();

      // Optimistic user message
      const tempUserMsg: TutorMessage = {
        id: `temp-user-${Date.now()}`,
        sessionId: params.sessionId,
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      setOptimisticMessages((prev) => [...prev, tempUserMsg]);
      setIsThinking(true);
      scrollToBottom();

      try {
        // Save user message to DB
        await sendMessage.mutateAsync({
          sessionId: params.sessionId,
          role: 'user',
          content: trimmed,
        });

        // Call AI tutor edge function
        const aiData = await callEdgeFunction<{ reply?: string }>({
          functionName: 'ai-tutor',
          body: {
            sessionId: params.sessionId,
            message: trimmed,
          },
        });

        const reply = aiData?.reply ?? "I'm not sure about that. Could you rephrase your question?";

        // Save assistant message to DB
        await sendMessage.mutateAsync({
          sessionId: params.sessionId,
          role: 'assistant',
          content: reply,
        });
      } catch (e: any) {
        // Add error message as optimistic
        const errMsg: TutorMessage = {
          id: `temp-err-${Date.now()}`,
          sessionId: params.sessionId,
          role: 'assistant',
          content: "Sorry, I couldn't process that. Please try again.",
          createdAt: new Date().toISOString(),
        };
        setOptimisticMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsThinking(false);
        scrollToBottom();
      }
    },
    [isThinking, params.sessionId, sendMessage, scrollToBottom],
  );

  const handleQuickAction = (label: string) => {
    const lastAssistant = [...allMessages].reverse().find((m) => m.role === 'assistant');
    const context = lastAssistant ? `Regarding your last response: ${label}` : label;
    handleSend(context);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.container, { backgroundColor: colors.appBackground, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>AI Tutor</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: '#22C55E' }]} />
              <Text style={[styles.onlineText, { color: colors.textMuted }]}>Online</Text>
            </View>
          </View>
          <View style={{ width: 38 }} />
        </View>

        {/* Messages */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={allMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.messageList,
              allMessages.length === 0 && styles.messageListEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <MessageBubble message={item} colors={colors} />}
            ListEmptyComponent={() => (
              <View style={styles.welcomeContainer}>
                <View style={[styles.welcomeIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="sparkles" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
                  Ask me anything
                </Text>
                <Text style={[styles.welcomeDesc, { color: colors.textMuted }]}>
                  I can explain concepts, give examples, quiz you, and help you prepare for any exam.
                </Text>
              </View>
            )}
            ListFooterComponent={() =>
              isThinking ? <TypingIndicator colors={colors} /> : null
            }
            onContentSizeChange={scrollToBottom}
          />
        )}

        {/* Quick actions */}
        {allMessages.length > 0 && !isThinking && (
          <View style={[styles.quickActions, { borderTopColor: colors.border }]}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [
                  styles.quickBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => handleQuickAction(action.label)}
              >
                <Ionicons name={action.icon as any} size={14} color={colors.primary} />
                <Text style={[styles.quickBtnText, { color: colors.textPrimary }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              paddingBottom: Math.max(insets.bottom, SPACING.md),
              backgroundColor: colors.appBackground,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Ask a question…"
              placeholderTextColor={colors.textFaint}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              returnKeyType="default"
            />
            <Pressable
              style={[
                styles.sendBtn,
                {
                  backgroundColor: inputText.trim() ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleSend(inputText)}
              disabled={!inputText.trim() || isThinking}
              hitSlop={4}
            >
              <Ionicons name="arrow-up" size={18} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenH,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 38, height: 38, justifyContent: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.4,
  },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: {
    paddingHorizontal: SPACING.screenH,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  messageListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  welcomeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.displaySemiBold,
    includeFontPadding: false,
    textAlign: 'center',
  },
  welcomeDesc: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.base * 1.5,
    textAlign: 'center',
  },

  // Bubbles
  bubbleWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 2 },
  bubbleWrapperUser: { justifyContent: 'flex-end' },
  bubbleWrapperAssistant: { justifyContent: 'flex-start' },
  avatarDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.base * 1.55,
  },

  // Typing dots
  typingDots: { flexDirection: 'row', gap: 4, paddingVertical: 2 },
  typingDot: { width: 7, height: 7, borderRadius: 4 },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.screenH,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexWrap: 'wrap',
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  quickBtnText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.xs * 1.5,
  },

  // Input
  inputBar: {
    paddingHorizontal: SPACING.screenH,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingLeft: SPACING.md,
    paddingRight: 8,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.base * 1.5,
    maxHeight: 120,
    paddingVertical: 0,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
