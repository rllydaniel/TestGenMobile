import React, { useCallback, useRef } from 'react';
import { View, Text, Pressable, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONTS, FONT_SIZES, RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptic } from '@/hooks/useHaptic';

const TABS = [
  { name: 'index',    label: 'Home',    icon: 'home'         as const, iconOutline: 'home-outline'         as const },
  { name: 'plan',     label: 'Plan',    icon: 'locate'       as const, iconOutline: 'locate-outline'       as const },
  { name: 'generate', label: 'Create',  icon: 'add-circle'   as const, iconOutline: 'add-circle-outline'   as const },
  { name: 'library',  label: 'Library', icon: 'book'         as const, iconOutline: 'book-outline'         as const },
  { name: 'profile',  label: 'Profile', icon: 'person'       as const, iconOutline: 'person-outline'       as const },
];

const TAB_BAR_HEIGHT = 56;

function RegularTabItem({
  tab,
  isFocused,
  onPress,
  colors,
}: {
  tab: (typeof TABS)[number];
  isFocused: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { impact } = useHaptic();

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.88,
      duration: 100,
      useNativeDriver: true,
    }).start();
    impact();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 3,
    }).start();
  };

  const activeColor = colors.primary;
  const inactiveColor = colors.textFaint;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
      }}
    >
      {/* Active top-border indicator */}
      {isFocused && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            width: 24,
            height: 2,
            borderRadius: 1,
            backgroundColor: activeColor,
          }}
        />
      )}

      <Animated.View
        style={{
          alignItems: 'center',
          gap: 3,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Ionicons
          name={isFocused ? tab.icon : tab.iconOutline}
          size={22}
          color={isFocused ? activeColor : inactiveColor}
        />
        <Text
          style={{
            fontSize: FONT_SIZES.xs - 1,
            fontFamily: isFocused ? FONTS.sansSemiBold : FONTS.sansRegular,
            color: isFocused ? activeColor : inactiveColor,
            lineHeight: (FONT_SIZES.xs - 1) * 1.4,
          }}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function CreateTabItem({
  isFocused,
  onPress,
  colors,
}: {
  isFocused: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { impact } = useHaptic();

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.93,
      duration: 100,
      useNativeDriver: true,
    }).start();
    impact(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 3,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -28,
      }}
    >
      <Animated.View
        style={{
          alignItems: 'center',
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* Outer glow ring */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: RADIUS.full,
            backgroundColor: `${colors.primary}20`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Main button */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: RADIUS.full,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              ...SHADOWS.primary,
            }}
          >
            <Ionicons name="add" size={28} color={colors.textOnPrimary} />
          </View>
        </View>
        <Text
          style={{
            fontFamily: FONTS.sansMedium,
            fontSize: 10,
            color: isFocused ? colors.primary : colors.textMuted,
            marginTop: 2,
            lineHeight: 10 * 1.4,
          }}
          numberOfLines={1}
        >
          Create
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const handlePress = useCallback(
    (route: any, isFocused: boolean) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    },
    [navigation],
  );

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: insets.bottom || 0,
        height: TAB_BAR_HEIGHT + (insets.bottom || 0),
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'stretch',
          height: TAB_BAR_HEIGHT,
        }}
      >
        {state.routes.map((route: any, index: number) => {
          const tabConfig = TABS.find((t) => t.name === route.name);
          if (!tabConfig) return null;
          const isFocused = state.index === index;
          const isCreate = tabConfig.name === 'generate';

          if (isCreate) {
            return (
              <CreateTabItem
                key={route.key}
                isFocused={isFocused}
                onPress={() => handlePress(route, isFocused)}
                colors={colors}
              />
            );
          }

          return (
            <RegularTabItem
              key={route.key}
              tab={tabConfig}
              isFocused={isFocused}
              onPress={() => handlePress(route, isFocused)}
              colors={colors}
            />
          );
        })}
      </View>
    </View>
  );
}
