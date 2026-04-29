const palette = {
  obsidianDim: '#0B0F14',
  obsidianLow: '#0B0F14',
  obsidianContainer: '#11161C',
  obsidianHigh: '#0F141A',
  tealAccent: '#5EEAD4',
  greenSuccess: '#4ADE80',
  redDanger: '#F87171',
  onSurface: '#E6EDF3',
  subText: '#6B7280',
  outlineVariant: 'rgba(255,255,255,0.04)',
} as const;

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return {r, g, b};
};

const withOpacity = (hex: string, alpha: number) => {
  const {r, g, b} = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const colors = {
  palette,
  background: palette.obsidianDim,
  surface: palette.obsidianContainer,
  surfaceAlt: palette.obsidianLow,
  glassBorder: palette.outlineVariant,
  text: palette.onSurface,
  subText: palette.subText,
  primary: palette.tealAccent,
  primaryContainer: palette.tealAccent,
  accent: palette.tealAccent,
  secondary: palette.tealAccent,
  tertiary: palette.tealAccent,
  disabled: withOpacity(palette.onSurface, 0.35),
  placeholder: withOpacity(palette.onSurface, 0.65),
  success: palette.greenSuccess,
  warning: '#FBBF24',
  error: palette.redDanger,
  overlay: withOpacity(palette.obsidianDim, 0.88),
  softOverlay: withOpacity(palette.obsidianDim, 0.28),
  glassTint: withOpacity(palette.tealAccent, 0.08),
  badgePositiveBg: withOpacity(palette.greenSuccess, 0.1),
  badgePositiveBorder: withOpacity(palette.greenSuccess, 0.2),
  badgeNegativeBg: withOpacity(palette.redDanger, 0.12),
  badgeNegativeBorder: withOpacity(palette.redDanger, 0.22),
};
