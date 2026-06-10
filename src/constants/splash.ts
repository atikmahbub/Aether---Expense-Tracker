import { colors as darkColors } from '@trackingPortal/themes/colors';
import { lightColors } from '@trackingPortal/themes/lightColors';

/** Shared splash layout — identical on iOS and Android */
export const SPLASH_LAYOUT = {
  logoBadgeSize: 96,
  logoIconSize: 52,
  logoBorderRadius: 28,
  appNameSize: 28,
  appNameLetterSpacing: 6,
  subtitleSize: 11,
  subtitleLetterSpacing: 3,
  glowSize: 320,
  progressBarWidth: 120,
  progressBarHeight: 3,
  contentGap: 20,
} as const;

export const SPLASH_THEME = {
  dark: {
    background: darkColors.background,
    surfaceAlt: darkColors.surfaceAlt,
    glassBorder: darkColors.glassBorder,
    text: darkColors.text,
    muted: darkColors.muted,
    primary: darkColors.primary,
    glow: 'rgba(34, 197, 94, 0.08)',
    progressTrack: darkColors.surface,
  },
  light: {
    background: lightColors.background,
    surfaceAlt: lightColors.surfaceAlt,
    glassBorder: lightColors.glassBorder,
    text: lightColors.text,
    muted: lightColors.muted,
    primary: lightColors.primaryText,
    glow: 'rgba(34, 197, 94, 0.12)',
    progressTrack: lightColors.surface,
  },
} as const;

export type SplashPalette = (typeof SPLASH_THEME)[keyof typeof SPLASH_THEME];
