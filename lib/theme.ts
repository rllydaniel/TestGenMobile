// Design system matching testgen.org web app
export const theme = {
  bg: '#0B0F1A',
  card: '#141B2D',
  cardBorder: '#1E293B',
  cardHover: '#1A2235',
  surface: '#0F1420',

  primary: '#4F6BF6',
  primaryDim: '#4F6BF620',

  text: '#FFFFFF',
  textSecondary: '#8B95A5',
  textMuted: '#555E6E',

  success: '#22C55E',
  warning: '#EAB308',
  danger: '#EF4444',
  orange: '#FF6B35',

  tabBar: '#0D1117',
  tabBorder: '#1E293B',
};

export function getScoreColor(pct: number) {
  if (pct >= 80) return theme.success;
  if (pct >= 60) return theme.warning;
  if (pct >= 40) return '#F97316'; // orange
  return theme.danger;
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

export function formatShortDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
