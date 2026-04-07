import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/Badge';
import * as Clipboard from 'expo-clipboard';
import {
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
  SHADOWS,
} from '@/constants/theme';

interface PremiumKey {
  id: string;
  key: string;
  created_by: string;
  redeemed_by: string | null;
  redeemed_at: string | null;
  duration_days: number;
  created_at: string;
}

function generateKeyString(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let key = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) key += '-';
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

const DURATION_OPTIONS = [
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '365 days', value: 365 },
];

export default function AdminKeysScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDuration, setSelectedDuration] = useState(30);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['admin-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('premium_keys')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as PremiumKey[];
    },
  });

  const createKey = useMutation({
    mutationFn: async () => {
      const key = generateKeyString();
      const { error } = await supabase.from('premium_keys').insert({
        key,
        created_by: user!.id,
        duration_days: selectedDuration,
      });
      if (error) throw error;
      return key;
    },
    onSuccess: (key) => {
      queryClient.invalidateQueries({ queryKey: ['admin-keys'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      Alert.alert('Key Generated', key, [
        { text: 'Copy', onPress: () => Clipboard.setStringAsync(key) },
        { text: 'OK' },
      ]);
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message);
    },
  });

  const handleCopy = useCallback(async (key: string) => {
    await Clipboard.setStringAsync(key);
    Alert.alert('Copied', 'Key copied to clipboard');
  }, []);

  const renderKey = useCallback(
    ({ item }: { item: PremiumKey }) => {
      const isRedeemed = !!item.redeemed_by;
      return (
        <Pressable
          onPress={() => handleCopy(item.key)}
          style={[styles.keyRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.keyText, { color: isRedeemed ? colors.textFaint : colors.textPrimary }]}>
              {item.key}
            </Text>
            <View style={{ flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.xs }}>
              <Badge
                text={isRedeemed ? 'Redeemed' : 'Active'}
                color={isRedeemed ? colors.textMuted : colors.success}
                size="sm"
              />
              <Text style={[styles.keyMeta, { color: colors.textFaint }]}>
                {item.duration_days}d
              </Text>
              <Text style={[styles.keyMeta, { color: colors.textFaint }]}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <Ionicons name="copy-outline" size={18} color={colors.textMuted} />
        </Pressable>
      );
    },
    [colors, handleCopy],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Premium Keys</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Duration selector + Generate */}
      <View style={styles.generateSection}>
        <View style={styles.durationRow}>
          {DURATION_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setSelectedDuration(opt.value)}
              style={[
                styles.durationChip,
                {
                  backgroundColor: selectedDuration === opt.value ? colors.primary : colors.surface,
                  borderColor: selectedDuration === opt.value ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.durationText,
                  { color: selectedDuration === opt.value ? '#FFFFFF' : colors.textPrimary },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => createKey.mutate()}
          disabled={createKey.isPending}
          style={[styles.generateBtn, { backgroundColor: colors.primary, opacity: createKey.isPending ? 0.6 : 1 }]}
        >
          {createKey.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.generateBtnText}>Generate Key</Text>
        </Pressable>
      </View>

      {/* Keys list */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: SPACING.xl }} color={colors.primary} />
      ) : (
        <FlatList
          data={keys}
          keyExtractor={(item) => item.id}
          renderItem={renderKey}
          contentContainerStyle={{
            paddingHorizontal: SPACING.screenH,
            paddingBottom: insets.bottom + SPACING.xl,
            gap: SPACING.xs,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No keys generated yet
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenH,
    paddingBottom: SPACING.sm,
    minHeight: 44,
  },
  headerTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
  },
  generateSection: {
    paddingHorizontal: SPACING.screenH,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  durationRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  durationChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  durationText: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.sm,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
    ...SHADOWS.primary,
  },
  generateBtnText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.base,
    color: '#FFFFFF',
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  keyText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.base,
    letterSpacing: 1,
  },
  keyMeta: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.xs,
    alignSelf: 'center',
  },
  emptyText: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});
