import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useProfile } from '@/hooks/useProfile';
import { useDashboardStats } from '@/hooks/useStats';
import { theme } from '@/lib/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const { data: stats } = useDashboardStats();

  const menuItems = [
    {
      icon: 'trophy' as const,
      title: 'Achievements',
      color: theme.warning,
      onPress: () => router.push('/(app)/achievements'),
    },
    {
      icon: 'podium' as const,
      title: 'Leaderboard',
      color: theme.primary,
      onPress: () => router.push('/(app)/leaderboard'),
    },
    {
      icon: 'card' as const,
      title: 'Subscription',
      color: theme.success,
      onPress: () => router.push('/(app)/subscription'),
    },
    {
      icon: 'settings' as const,
      title: 'Settings',
      color: theme.textMuted,
      onPress: () => router.push('/(app)/settings'),
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
          {user?.user_metadata?.avatar_url ? (
            <Image
              source={{ uri: user.user_metadata.avatar_url }}
              style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: theme.primary }}
            />
          ) : (
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 32, fontWeight: '700', color: '#FFFFFF' }}>
                {(profile?.username ?? user?.user_metadata?.username ?? 'U')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text }}>
              {profile?.username ?? user?.user_metadata?.username ?? 'Student'}
            </Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary }}>
              {user?.email ?? ''}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text }}>
                {stats?.testsCompleted ?? 0}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>Tests</Text>
            </View>
            <View style={{ width: 1, backgroundColor: theme.cardBorder }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text }}>
                {stats?.averageScore ?? 0}%
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>Avg Score</Text>
            </View>
            <View style={{ width: 1, backgroundColor: theme.cardBorder }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: theme.primary }}>
                {profile?.subscriptionTier === 'premium'
                  ? 'PRO'
                  : profile?.subscriptionTier === 'basic'
                    ? 'Basic'
                    : 'Free'}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>Plan</Text>
            </View>
          </View>
        </Card>

        {/* Menu Items */}
        <View style={{ gap: 8 }}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              onPress={item.onPress}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.card,
                borderRadius: 14,
                padding: 14,
                gap: 14,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: item.color + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: theme.text }}>
                {item.title}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          onPress={() => signOut()}
          variant="outline"
          size="lg"
          icon={<Ionicons name="log-out-outline" size={20} color={theme.textSecondary} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
