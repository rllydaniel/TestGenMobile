import React, { useCallback } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONTS, FONT_SIZES, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const TAB_CONFIG = [
  { name: 'index', label: 'Home', icon: 'home' as const, iconOutline: 'home-outline' as const },
  { name: 'generate', label: 'Create', icon: 'add-circle' as const, iconOutline: 'add-circle-outline' as const },
  { name: 'study', label: 'Study', icon: 'flash' as const, iconOutline: 'flash-outline' as const },
  { name: 'history', label: 'History', icon: 'time' as const, iconOutline: 'time-outline' as const },
  { name: 'profile', label: 'Profile', icon: 'person' as const, iconOutline: 'person-outline' as const },
];

export function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.tabBar,
        borderTopWidth: 1,
        borderTopColor: colors.tabBarBorder,
        paddingBottom: insets.bottom || 8,
        paddingTop: 8,
        height: 56 + (insets.bottom || 8),
        ...SHADOWS.sm,
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tab = TAB_CONFIG[index];
        if (!tab) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              minHeight: 44,
            }}
          >
            <Ionicons
              name={isFocused ? tab.icon : tab.iconOutline}
              size={tab.name === 'generate' ? 28 : 22}
              color={isFocused ? colors.primary : colors.textFaint}
            />
            <Text
              style={{
                fontSize: FONT_SIZES.xs,
                fontFamily: isFocused ? FONTS.sansMedium : FONTS.sansRegular,
                color: isFocused ? colors.primary : colors.textFaint,
                lineHeight: FONT_SIZES.xs * 1.5,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
