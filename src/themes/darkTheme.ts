import {
  MD3DarkTheme as PaperDarkTheme,
  configureFonts,
  type MD3Theme,
} from 'react-native-paper';
import {colors} from '@trackingPortal/themes/colors';

const baseFonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
};

const fontConfig = configureFonts({
  config: {
    displayLarge: {fontFamily: baseFonts.extraBold, fontWeight: '800', letterSpacing: -1.8, fontSize: 57, lineHeight: 64},
    displayMedium: {fontFamily: baseFonts.extraBold, fontWeight: '800', letterSpacing: -1.2, fontSize: 45, lineHeight: 52},
    displaySmall: {fontFamily: baseFonts.bold, fontWeight: '700', letterSpacing: -0.8, fontSize: 36, lineHeight: 44},
    headlineLarge: {fontFamily: baseFonts.bold, fontWeight: '700', letterSpacing: -0.6, fontSize: 32, lineHeight: 40},
    headlineMedium: {fontFamily: baseFonts.semiBold, fontWeight: '600', letterSpacing: -0.35, fontSize: 28, lineHeight: 36},
    headlineSmall: {fontFamily: baseFonts.medium, fontWeight: '500', letterSpacing: 0, fontSize: 24, lineHeight: 32},
    titleLarge: {fontFamily: baseFonts.bold, fontWeight: '700', letterSpacing: -0.35, fontSize: 22, lineHeight: 28},
    titleMedium: {fontFamily: baseFonts.semiBold, fontWeight: '600', letterSpacing: -0.1, fontSize: 16, lineHeight: 24},
    titleSmall: {fontFamily: baseFonts.medium, fontWeight: '500', letterSpacing: 0, fontSize: 14, lineHeight: 20},
    labelLarge: {fontFamily: baseFonts.semiBold, fontWeight: '600', letterSpacing: 0.1, fontSize: 14, lineHeight: 20},
    labelMedium: {fontFamily: baseFonts.semiBold, fontWeight: '600', letterSpacing: 0.35, fontSize: 12, lineHeight: 16},
    labelSmall: {fontFamily: baseFonts.semiBold, fontWeight: '600', letterSpacing: 0.45, fontSize: 11, lineHeight: 16},
    bodyLarge: {fontFamily: baseFonts.regular, fontWeight: '400', letterSpacing: 0.15, fontSize: 16, lineHeight: 24},
    bodyMedium: {fontFamily: baseFonts.regular, fontWeight: '400', letterSpacing: 0.25, fontSize: 14, lineHeight: 20},
    bodySmall: {fontFamily: baseFonts.regular, fontWeight: '400', letterSpacing: 0.4, fontSize: 12, lineHeight: 16},
  },
});

export const darkTheme: MD3Theme = {
  ...PaperDarkTheme,
  roundness: 22,
  isV3: true,
  fonts: fontConfig,
  colors: {
    ...PaperDarkTheme.colors,
    primary: colors.primary,
    secondary: colors.accent,
    tertiary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceAlt,
    onSurface: colors.text,
    onSurfaceVariant: colors.subText,
    outline: colors.glassBorder,
    outlineVariant: colors.glassBorder,
    error: colors.error,
    backdrop: colors.overlay,
  },
};
