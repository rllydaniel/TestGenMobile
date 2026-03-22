import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONTS, FONT_SIZES, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

type ThemePreference = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

const LIGHT_COLORS = {
  appBackground: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceSecondary: '#F4F4F5',
  primaryLight: '#EEF3FD',
  primary: '#2360E8',
  primaryHover: '#1D4EC7',
  primaryGlow: 'rgba(35,96,232,0.15)',
  textPrimary: '#1A1A2E',
  textMuted: 'rgba(26,26,46,0.5)',
  textFaint: 'rgba(26,26,46,0.3)',
  textOnPrimary: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
  borderFocus: '#2360E8',
  borderStrong: 'rgba(0,0,0,0.15)',
  success: '#22C55E',
  successLight: 'rgba(34,197,94,0.12)',
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.12)',
  error: '#EF4444',
  errorLight: 'rgba(239,68,68,0.12)',
  answerDefault: '#FFFFFF',
  answerSelected: '#EEF3FD',
  answerCorrect: 'rgba(34,197,94,0.08)',
  answerIncorrect: 'rgba(239,68,68,0.08)',
  answerCorrectBorder: '#22C55E',
  answerIncorrectBorder: '#EF4444',
  answerSelectedBorder: '#2360E8',
  tabBar: '#FFFFFF',
  tabBarBorder: 'rgba(0,0,0,0.08)',
  shimmer: ['#F0EDE9', '#E8E4DF', '#F0EDE9'],

  // Diagnostic levels
  levelBeginner: '#F59E0B',
  levelBeginnerLight: 'rgba(245,158,11,0.12)',
  levelIntermediate: '#2360E8',
  levelIntermediateLight: '#EEF3FD',
  levelAdvanced: '#22C55E',
  levelAdvancedLight: 'rgba(34,197,94,0.12)',

  // Plan session types
  sessionStudyGuide: '#2360E8',
  sessionTopicReview: '#D97706',
  sessionFlashcards: '#7C3AED',
  sessionPracticeTest: '#16A34A',
  sessionRest: '#6B7280',

  // Category colors
  categoryStandardized: '#2360E8',
  categoryAP: '#7C3AED',
  categoryMath: '#059669',
  categoryScience: '#DC2626',
  categoryHumanities: '#D97706',
  categoryLanguages: '#0891B2',
  categoryCustom: '#6B7280',
};

const DARK_COLORS: typeof LIGHT_COLORS = {
  appBackground: '#0F0E0C',
  surface: '#1C1A17',
  surfaceSecondary: '#252220',
  primaryLight: 'rgba(35,96,232,0.15)',
  primary: '#4A7AF4',
  primaryHover: '#2360E8',
  primaryGlow: 'rgba(74,122,244,0.2)',
  textPrimary: '#F0EDE9',
  textMuted: 'rgba(240,237,233,0.5)',
  textFaint: 'rgba(240,237,233,0.25)',
  textOnPrimary: '#FFFFFF',
  border: 'rgba(255,255,255,0.08)',
  borderFocus: '#4A7AF4',
  borderStrong: 'rgba(255,255,255,0.15)',
  success: '#34D399',
  successLight: 'rgba(52,211,153,0.12)',
  warning: '#FBBF24',
  warningLight: 'rgba(251,191,36,0.12)',
  error: '#F87171',
  errorLight: 'rgba(248,113,113,0.12)',
  answerDefault: '#1C1A17',
  answerSelected: 'rgba(74,122,244,0.15)',
  answerCorrect: 'rgba(52,211,153,0.12)',
  answerIncorrect: 'rgba(248,113,113,0.12)',
  answerCorrectBorder: '#34D399',
  answerIncorrectBorder: '#F87171',
  answerSelectedBorder: '#4A7AF4',
  tabBar: '#1C1A17',
  tabBarBorder: 'rgba(255,255,255,0.08)',
  shimmer: ['#1C1A17', '#252220', '#1C1A17'],

  // Diagnostic levels
  levelBeginner: '#FBBF24',
  levelBeginnerLight: 'rgba(251,191,36,0.12)',
  levelIntermediate: '#4A7AF4',
  levelIntermediateLight: 'rgba(74,122,244,0.15)',
  levelAdvanced: '#34D399',
  levelAdvancedLight: 'rgba(52,211,153,0.12)',

  // Plan session types
  sessionStudyGuide: '#4A7AF4',
  sessionTopicReview: '#F59E0B',
  sessionFlashcards: '#A78BFA',
  sessionPracticeTest: '#34D399',
  sessionRest: '#9CA3AF',

  // Category colors
  categoryStandardized: '#4A7AF4',
  categoryAP: '#A78BFA',
  categoryMath: '#34D399',
  categoryScience: '#F87171',
  categoryHumanities: '#FBBF24',
  categoryLanguages: '#38BDF8',
  categoryCustom: '#9CA3AF',
};

export type ThemeColors = typeof LIGHT_COLORS;

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (pref: ThemePreference) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('theme_preference').then(val => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setPreferenceState(val);
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      // Force re-render when system theme changes
    });
    return () => sub.remove();
  }, []);

  const setPreference = async (pref: ThemePreference) => {
    setPreferenceState(pref);
    await AsyncStorage.setItem('theme_preference', pref);
  };

  const resolved: ResolvedTheme = preference === 'system'
    ? (systemScheme ?? 'light')
    : preference;

  const colors = useMemo(
    () => resolved === 'dark' ? DARK_COLORS : LIGHT_COLORS,
    [resolved],
  );

  const value = useMemo(
    () => ({ preference, resolved, setPreference, colors }),
    [preference, resolved, colors],
  );

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export { LIGHT_COLORS, DARK_COLORS };
