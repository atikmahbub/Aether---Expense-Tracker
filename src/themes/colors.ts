const palette = {
  obsidianDim: '#0a0f13',
  obsidianLow: '#0f1418',
  obsidianContainer: '#151a1f',
  obsidianHigh: '#1b2026',
  cyanHover: '#00f4fe',
  cyanNeon: '#a1faff',
  limeNeon: '#b6f700',
  uvNeon: '#c47fff',
  onSurface: '#f1f4fa',
  outlineVariant: '#44484d',
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
  glassBorder: withOpacity(palette.outlineVariant, 0.15),
  text: palette.onSurface,
  subText: withOpacity(palette.onSurface, 0.74),
  primary: palette.cyanNeon,
  primaryContainer: palette.cyanHover,
  accent: palette.limeNeon,
  secondary: palette.limeNeon,
  tertiary: palette.uvNeon,
  disabled: withOpacity(palette.onSurface, 0.35),
  placeholder: withOpacity(palette.onSurface, 0.65),
  success: palette.limeNeon,
  warning: '#FFB347',
  error: '#FF6B6B',
  overlay: withOpacity(palette.obsidianDim, 0.88),
  softOverlay: withOpacity(palette.obsidianDim, 0.28),
  glassTint: withOpacity(palette.cyanNeon, 0.08),
  badgePositiveBg: withOpacity(palette.limeNeon, 0.1),
  badgePositiveBorder: withOpacity(palette.limeNeon, 0.2),
  badgeNegativeBg: withOpacity('#FF6B6B', 0.12),
  badgeNegativeBorder: withOpacity('#FF6B6B', 0.22),
};
