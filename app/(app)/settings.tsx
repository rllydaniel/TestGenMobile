import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { SectionLabel } from '@/components/ui/Label';
import { useAppStore } from '@/stores/app-store';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';
import { useHaptic } from '@/hooks/useHaptic';

const THEME_OPTIONS = [
  {
    key: 'system' as const,
    label: 'System',
    description: 'Follows your device setting',
    icon: 'phone-portrait-outline' as const,
  },
  {
    key: 'light' as const,
    label: 'Light',
    description: 'Always use light mode',
    icon: 'sunny-outline' as const,
  },
  {
    key: 'dark' as const,
    label: 'Dark',
    description: 'Always use dark mode',
    icon: 'moon-outline' as const,
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { colors, preference, setPreference } = useTheme();
  const { impact } = useHaptic();
  const { soundEnabled, setSoundEnabled, hapticEnabled, setHapticEnabled } =
    useAppStore();

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBackground }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SPACING.screenH,
          paddingTop: insets.top + SPACING.md,
          gap: SPACING.lg,
          paddingBottom: 120,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            onPressIn={() => impact()}
            style={({ pressed }) => ({
              minHeight: 44,
              justifyContent: 'center',
              opacity: pressed ? 0.82 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text
            style={{
              fontSize: FONT_SIZES.xl,
              fontFamily: FONTS.displaySemiBold,
              color: colors.textPrimary,
              lineHeight: FONT_SIZES.xl * 1.2,
              flex: 1,
            }}
            numberOfLines={1}
          >
            Settings
          </Text>
        </View>

        {/* COLOR SCHEME */}
        <View>
          <SectionLabel>COLOR SCHEME</SectionLabel>
          <View style={{ gap: SPACING.sm }}>
            {THEME_OPTIONS.map((opt) => {
              const selected = preference === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setPreference(opt.key)}
                  onPressIn={() => impact()}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: SPACING.md,
                    padding: SPACING.md,
                    borderRadius: RADIUS.md,
                    backgroundColor: colors.surface,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? colors.primary : colors.border,
                    minHeight: 44,
                    opacity: pressed ? 0.82 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: RADIUS.md,
                      backgroundColor: selected ? colors.primaryLight : colors.surfaceSecondary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={22}
                      color={selected ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: FONT_SIZES.base,
                        fontFamily: FONTS.sansSemiBold,
                        color: colors.textPrimary,
                        lineHeight: FONT_SIZES.base * 1.5,
                      }}
                      numberOfLines={1}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: FONT_SIZES.sm,
                        fontFamily: FONTS.sansRegular,
                        color: colors.textMuted,
                        lineHeight: FONT_SIZES.sm * 1.5,
                      }}
                      numberOfLines={1}
                    >
                      {opt.description}
                    </Text>
                  </View>
                  {selected && (
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* FEEDBACK */}
        <View>
          <SectionLabel>FEEDBACK</SectionLabel>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              gap: 12,
            }}
          >
            <SettingToggle label="Sound Effects" value={soundEnabled} onToggle={setSoundEnabled} colors={colors} />
            <SettingToggle label="Haptic Feedback" value={hapticEnabled} onToggle={setHapticEnabled} colors={colors} />
          </View>
        </View>

        {/* ABOUT */}
        <View>
          <SectionLabel>ABOUT</SectionLabel>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
            }}
          >
            <SettingLink
              label="Privacy Policy"
              onPress={() => Linking.openURL('https://testgen.org/privacy')}
              colors={colors}
            />
            <SettingLink
              label="Terms of Service"
              onPress={() => Linking.openURL('https://testgen.org/terms')}
              colors={colors}
            />
            <SettingLink
              label="Contact Us"
              onPress={() => Linking.openURL('https://testgen.org/contact')}
              colors={colors}
            />
            <View style={{ marginTop: SPACING.sm }}>
              <Text
                style={{
                  fontSize: FONT_SIZES.sm,
                  fontFamily: FONTS.sansRegular,
                  color: colors.textFaint,
                  textAlign: 'center',
                  lineHeight: FONT_SIZES.sm * 1.5,
                }}
              >
                TestGen v1.0.0
              </Text>
            </View>
          </View>
        </View>

        <Button label="Sign Out" onPress={() => signOut()} variant="destructive" size="lg" />
      </ScrollView>
    </View>
  );
}

function SettingToggle({
  label,
  value,
  onToggle,
  colors,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  colors: any;
}) {
  const { impact } = useHaptic();
  return (
    <Pressable
      onPress={() => { impact(); onToggle(!value); }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        minHeight: 44,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <Text
        style={{
          fontSize: FONT_SIZES.base,
          fontFamily: FONTS.sansMedium,
          color: colors.textPrimary,
          lineHeight: FONT_SIZES.base * 1.5,
          flexShrink: 1,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View
        style={{
          width: 51,
          height: 31,
          borderRadius: 16,
          backgroundColor: value ? colors.primary : colors.surfaceSecondary,
          borderWidth: value ? 0 : 1.5,
          borderColor: colors.border,
          justifyContent: 'center',
          paddingHorizontal: 2,
        }}
      >
        <View
          style={{
            width: 27,
            height: 27,
            borderRadius: 14,
            backgroundColor: '#FFFFFF',
            alignSelf: value ? 'flex-end' : 'flex-start',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
            elevation: 3,
          }}
        />
      </View>
    </Pressable>
  );
}

function SettingLink({
  label,
  onPress,
  colors,
}: {
  label: string;
  onPress: () => void;
  colors: any;
}) {
  const { impact } = useHaptic();
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => impact()}
      style={({ pressed }) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        minHeight: 44,
        opacity: pressed ? 0.82 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <Text
        style={{
          fontSize: FONT_SIZES.base,
          fontFamily: FONTS.sansRegular,
          color: colors.textPrimary,
          lineHeight: FONT_SIZES.base * 1.5,
          flex: 1,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Ionicons name="open-outline" size={18} color={colors.textFaint} />
    </Pressable>
  );
}
