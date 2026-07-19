// Design tokens — a calm, trustworthy palette rather than the generic
// "green/red trading app" default. Deep ink base, one confident blue
// accent, and separate semantic colors for gains/losses.
export const colors = {
  background: '#0B1120',
  surface: '#131B2E',
  surfaceAlt: '#1B2740',
  border: '#233150',
  textPrimary: '#F5F7FA',
  textSecondary: '#8B96AC',
  accent: '#3E7BFA',
  accentMuted: '#1E3A6D',
  gain: '#2FBF71',
  loss: '#E5484D',
  warning: '#F2A93B',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const type = {
  display: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  title: { fontSize: 20, fontWeight: '600', color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400', color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '400', color: colors.textSecondary },
  mono: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, fontVariant: ['tabular-nums'] },
};

export const radius = { sm: 8, md: 14, lg: 20 };
