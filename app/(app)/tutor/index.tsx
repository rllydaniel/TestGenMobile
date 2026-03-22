import React from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useTutorSessions, useCreateTutorSession } from '@/hooks/useTutor';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS, formatRelativeDate } from '@/constants/theme';
import type { TutorSession } from '@/types/tutor';

function SessionCard({
  session,
  colors,
  onPress,
}: {
  session: TutorSession;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.sessionCard,
        { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1, ...SHADOWS.sm },
      ]}
      onPress={onPress}
    >
      <View style={[styles.sessionIcon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
      </View>
      <View style={styles.sessionInfo}>
        <Text style={[styles.sessionSubject, { color: colors.textPrimary }]} numberOfLines={1}>
          {session.subject ?? 'General'}
          {session.topic ? ` · ${session.topic}` : ''}
        </Text>
        <Text style={[styles.sessionMeta, { color: colors.textMuted }]}>
          {session.messageCount != null ? `${session.messageCount} messages` : 'New session'}
          {' · '}
          {formatRelativeDate(session.createdAt)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

export default function TutorIndexScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: sessions = [], isLoading } = useTutorSessions();
  const createSession = useCreateTutorSession();

  const handleNewChat = async () => {
    const session = await createSession.mutateAsync({});
    router.push({
      pathname: '/(app)/tutor/chat',
      params: { sessionId: session.id },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.appBackground, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>AI Tutor</Text>
        <Pressable
          onPress={handleNewChat}
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
          disabled={createSession.isPending}
          hitSlop={4}
        >
          {createSession.isPending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="add" size={20} color="#FFF" />
          )}
        </Pressable>
      </View>

      {/* Intro card */}
      <View style={[styles.introCard, { backgroundColor: colors.primaryLight }]}>
        <View style={[styles.introIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="sparkles" size={20} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.introTitle, { color: colors.textPrimary }]}>
            Your personal tutor
          </Text>
          <Text style={[styles.introDesc, { color: colors.textMuted }]}>
            Ask questions, get explanations, and be quizzed on any topic.
          </Text>
        </View>
      </View>

      {/* Sessions list */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-outline" size={52} color={colors.textFaint} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No sessions yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
            Start a new chat to ask your tutor anything.
          </Text>
          <Pressable
            style={[styles.startBtn, { backgroundColor: colors.primary, ...SHADOWS.primary }]}
            onPress={handleNewChat}
            disabled={createSession.isPending}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" />
            <Text style={[styles.startBtnText, { color: '#FFF' }]}>Start New Chat</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom, SPACING.xl) },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              colors={colors}
              onPress={() =>
                router.push({
                  pathname: '/(app)/tutor/chat',
                  params: { sessionId: item.id },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
          ListHeaderComponent={() => (
            <Text style={[styles.listHeader, { color: colors.textMuted }]}>
              Recent conversations
            </Text>
          )}
        />
      )}
    </View>
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
  },
  backBtn: { width: 38, height: 38, justifyContent: 'center' },
  title: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.displaySemiBold,
    includeFontPadding: false,
  },
  newBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introCard: {
    marginHorizontal: SPACING.screenH,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  introIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  introTitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.4,
  },
  introDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
    marginTop: 2,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.screenH,
    gap: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.displaySemiBold,
    includeFontPadding: false,
  },
  emptyDesc: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansRegular,
    textAlign: 'center',
    lineHeight: FONT_SIZES.base * 1.5,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    minHeight: 52,
    marginTop: SPACING.sm,
  },
  startBtnText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  list: {
    paddingHorizontal: SPACING.screenH,
    paddingTop: SPACING.xs,
  },
  listHeader: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.sansSemiBold,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  sessionCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sessionInfo: { flex: 1 },
  sessionSubject: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.sansSemiBold,
    lineHeight: FONT_SIZES.base * 1.4,
  },
  sessionMeta: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.sansRegular,
    lineHeight: FONT_SIZES.sm * 1.5,
    marginTop: 2,
  },
});
