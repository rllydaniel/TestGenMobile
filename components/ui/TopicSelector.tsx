import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, RADIUS, SPACING } from '@/constants/theme';

interface TopicSelectorProps {
  availableTopics: string[];
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
  maxTopics?: number;
  placeholder?: string;
}

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function TopicSelector({
  availableTopics,
  selectedTopics,
  onTopicsChange,
  maxTopics = 5,
  placeholder = 'Search topics...',
}: TopicSelectorProps) {
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState('');

  const filteredTopics = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return availableTopics;
    return availableTopics.filter((topic) =>
      topic.toLowerCase().includes(query),
    );
  }, [availableTopics, searchText]);

  const handleSelectTopic = useCallback(
    (topic: string) => {
      if (selectedTopics.includes(topic)) return;
      if (selectedTopics.length >= maxTopics) return;
      triggerHaptic();
      onTopicsChange([...selectedTopics, topic]);
      setSearchText('');
    },
    [selectedTopics, maxTopics, onTopicsChange],
  );

  const handleRemoveTopic = useCallback(
    (topic: string) => {
      triggerHaptic();
      onTopicsChange(selectedTopics.filter((t) => t !== topic));
    },
    [selectedTopics, onTopicsChange],
  );

  const atLimit = selectedTopics.length >= maxTopics;

  return (
    <View>
      {/* Selected topic chips */}
      {selectedTopics.length > 0 && (
        <View style={styles.chipsContainer}>
          {selectedTopics.map((topic) => (
            <View
              key={topic}
              style={[
                styles.chip,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: colors.primary },
                ]}
                numberOfLines={1}
              >
                {topic}
              </Text>
              <Pressable
                onPress={() => handleRemoveTopic(topic)}
                hitSlop={4}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.primary}
                />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Limit message */}
      {atLimit && (
        <Text
          style={[
            styles.limitMessage,
            { color: colors.textMuted },
          ]}
        >
          Maximum {maxTopics} topics selected
        </Text>
      )}

      {/* Search input */}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={18}
          color={colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.input,
            {
              color: colors.textPrimary,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Dropdown */}
      {searchText.trim().length > 0 && filteredTopics.length > 0 && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {filteredTopics.map((topic) => {
              const isSelected = selectedTopics.includes(topic);
              return (
                <Pressable
                  key={topic}
                  style={styles.dropdownItem}
                  onPress={() => handleSelectTopic(topic)}
                  disabled={isSelected}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      {
                        color: colors.textPrimary,
                        opacity: isSelected ? 0.4 : 1,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {topic}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  chipText: {
    fontFamily: FONTS.sansMedium,
    fontSize: FONT_SIZES.sm,
    includeFontPadding: false,
  },
  limitMessage: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.sm,
    includeFontPadding: false,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    includeFontPadding: false,
    height: '100%',
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    maxHeight: 200,
    marginTop: 4,
  },
  dropdownItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  dropdownItemText: {
    fontFamily: FONTS.sansRegular,
    fontSize: FONT_SIZES.base,
    includeFontPadding: false,
  },
});
