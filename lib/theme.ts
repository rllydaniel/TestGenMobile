// Re-export everything from the canonical theme location
// All new code should import from @/constants/theme directly
export {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
  SHADOWS,
  getScoreColor,
  getScoreBgColor,
  formatDuration,
  formatTimer,
  formatRelativeDate,
} from '@/constants/theme';

// Backward-compatible alias
import { COLORS } from '@/constants/theme';
export const theme = {
  ...COLORS,
  // Legacy aliases
  bg: COLORS.appBackground,
  text: COLORS.textPrimary,
  textSecondary: COLORS.textMuted,
  textMuted: COLORS.textFaint,
  card: COLORS.surface,
  cardBorder: COLORS.border,
  danger: COLORS.error,
  orange: COLORS.warning,
  tabBar: COLORS.surface,
  tabBorder: COLORS.border,
} as const;
