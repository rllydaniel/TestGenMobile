import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
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
import { Badge } from '@/components/ui/Badge';
import {
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
  SHADOWS,
} from '@/constants/theme';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  subscription_tier: string;
  is_premium_override: boolean;
  role: string;
  total_tests: number;
  created_at: string;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, username, subscription_tier, is_premium_override, role, total_tests, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as AdminUser[];
    },
  });

  const togglePremium = useMutation({
    mutationFn: async ({ userId, current }: { userId: string; current: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_premium_override: !current,
          subscription_tier: !current ? 'premium' : 'free',
        })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.username?.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  const handleToggle = useCallback(
    (user: AdminUser) => {
      Alert.alert(
        user.is_premium_override ? 'Remove Premium' : 'Grant Premium',
        `${user.is_premium_override ? 'Remove premium from' : 'Grant premium to'} ${user.email}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => togglePremium.mutate({ userId: user.id, current: user.is_premium_override }),
          },
        ],
      );
    },
    [togglePremium],
  );

  const renderUser = useCallback(
    ({ item }: { item: AdminUser }) => (
      <View style={[styles.userRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.username || 'No username'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>
            {item.email}
          </Text>
          <View style={{ flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.xs }}>
            <Badge
              text={item.subscription_tier}
              color={item.subscription_tier === 'premium' ? colors.success : colors.textMuted}
              size="sm"
            />
            {item.role === 'admin' && <Badge text="admin" color={colors.error} size="sm" />}
            <Text style={[styles.userStat, { color: colors.textFaint }]}>
              {item.total_tests ?? 0} tests
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => handleToggle(item)}
          style={[
            styles.toggleBtn,
            {
              backgroundColor: item.is_premium_override ? colors.successLight : colors.surfaceSecondary,
            },
          ]}
        >
          <Ionicons
            name={item.is_premium_override ? 'diamond' : 'diamond-outline'}
            size={18}
            color={item.is_premium_override ? colors.success : colors.textMuted}
          />
        </Pressable>
      </View>
    ),
    [colors, handleToggle],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Users</Text>
        <Text style={[styles.headerCount, { color: colors.textMuted }]}>{filtered.length}</Text>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: SPACING.screenH, paddingBottom: SPACING.sm }}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by email or username..."
            placeholderTextColor={colors.textFaint}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            autoCapitalize="none"
          />
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: SPACING.xl }} color={colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={{
            paddingHorizontal: SPACING.screenH,
            paddingBottom: insets.bottom + SPACING.xl,
            gap: SPACING.xs,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenH,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  headerTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    flex: 1,
  },
  headerCount: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    height: 44,
    gap: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    height: 44,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  userName: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: FONT_SIZES.base,
  },
  userEmail: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  userStat: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.xs,
    alignSelf: 'center',
  },
  toggleBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
