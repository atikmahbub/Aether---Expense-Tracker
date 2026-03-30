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
};

const fontConfig = configureFonts({
  config: {
    displayLarge: {fontFamily: baseFonts.bold, fontWeight: '700'},
    displayMedium: {fontFamily: baseFonts.semiBold, fontWeight: '600'},
    displaySmall: {fontFamily: baseFonts.semiBold, fontWeight: '600'},
    headlineLarge: {fontFamily: baseFonts.semiBold, fontWeight: '600'},
    headlineMedium: {fontFamily: baseFonts.medium, fontWeight: '500'},
    headlineSmall: {fontFamily: baseFonts.medium, fontWeight: '500'},
    titleLarge: {fontFamily: baseFonts.bold, fontWeight: '700'},
    titleMedium: {fontFamily: baseFonts.semiBold, fontWeight: '600'},
    titleSmall: {fontFamily: baseFonts.medium, fontWeight: '500'},
    labelLarge: {fontFamily: baseFonts.semiBold, fontWeight: '600'},
    labelMedium: {fontFamily: baseFonts.medium, fontWeight: '500'},
    labelSmall: {fontFamily: baseFonts.medium, fontWeight: '500'},
    bodyLarge: {fontFamily: baseFonts.regular, fontWeight: '400'},
    bodyMedium: {fontFamily: baseFonts.regular, fontWeight: '400'},
    bodySmall: {fontFamily: baseFonts.regular, fontWeight: '400'},
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
    card: colors.surfaceAlt,
    surface: colors.surface,
    surfaceVariant: colors.surfaceAlt,
    elevation: PaperDarkTheme.colors?.elevation ?? PaperDarkTheme.elevation,
    text: colors.text,
    onSurface: colors.text,
    onSurfaceVariant: colors.subText,
    outline: colors.glassBorder,
    outlineVariant: colors.glassBorder,
    disabled: colors.disabled,
    placeholder: colors.placeholder,
    error: colors.error,
    success: colors.success,
    warning: colors.warning,
    backdrop: colors.overlay,
    border: colors.glassBorder,
  },
};
