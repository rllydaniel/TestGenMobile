import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/stores/app-store';
import { theme as t } from '@/lib/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { theme, setTheme, soundEnabled, setSoundEnabled, hapticEnabled, setHapticEnabled } =
    useAppStore();

  const themeOptions = ['system', 'light', 'dark'] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={t.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: '800', color: t.text }}>Settings</Text>
        </View>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: '700', color: t.text, marginBottom: 12 }}>
            Appearance
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => setTheme(opt)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: theme === opt ? t.primary : t.surface,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme === opt ? t.primary : t.cardBorder,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme === opt ? '#FFFFFF' : t.textSecondary,
                    textTransform: 'capitalize',
                  }}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: '700', color: t.text, marginBottom: 12 }}>
            Feedback
          </Text>
          <SettingToggle label="Sound Effects" value={soundEnabled} onToggle={setSoundEnabled} />
          <View style={{ height: 12 }} />
          <SettingToggle label="Haptic Feedback" value={hapticEnabled} onToggle={setHapticEnabled} />
        </Card>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: '700', color: t.text, marginBottom: 12 }}>
            About
          </Text>
          <SettingLink label="Privacy Policy" onPress={() => Linking.openURL('https://testgen.org/privacy')} />
          <SettingLink label="Terms of Service" onPress={() => Linking.openURL('https://testgen.org/terms')} />
          <SettingLink label="Contact Us" onPress={() => Linking.openURL('https://testgen.org/contact')} />
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 13, color: t.textMuted, textAlign: 'center' }}>
              TestGen v1.0.0
            </Text>
          </View>
        </Card>

        <Button title="Sign Out" onPress={() => signOut()} variant="destructive" size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingToggle({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ fontSize: 15, color: t.text }}>{label}</Text>
      <TouchableOpacity
        onPress={() => onToggle(!value)}
        style={{
          width: 52, height: 30, borderRadius: 15,
          backgroundColor: value ? t.primary : t.cardBorder,
          justifyContent: 'center', padding: 2,
        }}
      >
        <View
          style={{
            width: 26, height: 26, borderRadius: 13,
            backgroundColor: '#FFFFFF',
            alignSelf: value ? 'flex-end' : 'flex-start',
          }}
        />
      </TouchableOpacity>
    </View>
  );
}

function SettingLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}
    >
      <Text style={{ fontSize: 15, color: t.text }}>{label}</Text>
      <Ionicons name="open-outline" size={18} color={t.textMuted} />
    </TouchableOpacity>
  );
}
