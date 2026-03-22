export const COLORS = {
  // Backgrounds
  appBackground: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceSecondary: '#F4F4F5',
  surfaceElevated: '#FFFFFF',
  primaryLight: '#EEF3FD',

  // Brand
  primary: '#2360E8',
  primaryHover: '#1D4EC7',
  primaryGlow: 'rgba(35,96,232,0.15)',

  // Text
  textPrimary: '#1A1A2E',
  textMuted: 'rgba(26,26,46,0.5)',
  textFaint: 'rgba(26,26,46,0.3)',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: 'rgba(0,0,0,0.08)',
  borderFocus: '#2360E8',
  borderStrong: 'rgba(0,0,0,0.15)',

  // Semantic
  success: '#22C55E',
  successLight: 'rgba(34,197,94,0.12)',
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.12)',
  error: '#EF4444',
  errorLight: 'rgba(239,68,68,0.12)',

  // Answer states (test taking)
  answerDefault: '#FFFFFF',
  answerHover: '#EEF3FD',
  answerSelected: '#EEF3FD',
  answerCorrect: 'rgba(34,197,94,0.08)',
  answerIncorrect: 'rgba(239,68,68,0.08)',
  answerCorrectBorder: '#22C55E',
  answerIncorrectBorder: '#EF4444',
  answerSelectedBorder: '#2360E8',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarBorder: 'rgba(0,0,0,0.08)',
};

export const FONTS = {
  // Playfair Display — all headings, score numbers, hero text
  displayBold: 'PlayfairDisplay_700Bold',
  displaySemiBold: 'PlayfairDisplay_600SemiBold',
  displayRegular: 'PlayfairDisplay_400Regular',

  // DM Sans — all body text, labels, buttons, UI
  sansBold: 'DMSans_700Bold',
  sansSemiBold: 'DMSans_600SemiBold',
  sansMedium: 'DMSans_500Medium',
  sansRegular: 'DMSans_400Regular',
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 28,
  display: 34,
  hero: 42,
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screenH: 20,  // horizontal screen padding — applied to every screen
  screenV: 24,  // vertical top padding — applied to every screen
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 5,
  },
  primary: {
    shadowColor: '#2360E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// Utility functions
export function getScoreColor(pct: number) {
  if (pct >= 80) return COLORS.success;
  if (pct >= 60) return COLORS.warning;
  return COLORS.error;
}

export function getScoreBgColor(pct: number) {
  if (pct >= 80) return COLORS.successLight;
  if (pct >= 60) return COLORS.warningLight;
  return COLORS.errorLight;
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHrs < 1) return 'just now';
  if (diffHrs < 24) return `about ${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
