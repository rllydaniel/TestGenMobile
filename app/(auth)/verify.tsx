import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

export default function VerifyScreen() {
  const router = useRouter();
  const [error, setError] = useState('');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 24 }}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: '#4F6BF620', alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="mail-open-outline" size={36} color={theme.primary} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>Check your email</Text>
          <Text style={{
            fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 22,
          }}>
            We sent a confirmation link to your email. Click the link to verify your account, then return here.
          </Text>
        </View>

        <Button
          title="I've Verified My Email"
          onPress={async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              // Verified
            } else {
              setError('Email not yet verified. Check your inbox and click the link.');
            }
          }}
          size="lg"
        />

        <Button
          title="Resend Email"
          onPress={() => {
            setError('');
            router.replace('/(auth)/sign-up');
          }}
          variant="outline"
          size="lg"
        />

        {error ? (
          <Text style={{ color: theme.danger, fontSize: 14, textAlign: 'center' }}>{error}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
