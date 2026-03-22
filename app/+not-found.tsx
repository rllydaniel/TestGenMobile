import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, SPACING } from '@/constants/theme';

export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING.screenH,
          backgroundColor: colors.appBackground,
          gap: SPACING.md,
        }}
      >
        <Ionicons name="alert-circle-outline" size={64} color={colors.textFaint} />
        <Text style={{ fontSize: FONT_SIZES.lg, fontFamily: FONTS.sansBold, color: colors.textPrimary, lineHeight: FONT_SIZES.lg * 1.2 }}>
          Page Not Found
        </Text>
        <Link href="/(tabs)" style={{ marginTop: SPACING.md, paddingVertical: SPACING.md }}>
          <Text style={{ fontSize: FONT_SIZES.base, color: colors.primary, fontFamily: FONTS.sansSemiBold, lineHeight: FONT_SIZES.base * 1.5 }}>
            Go to Home
          </Text>
        </Link>
      </View>
    </>
  );
}
