export const designTokens = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    section: 28,
    xxxl: 32,
    jumbo: 40,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    full: 999,
    // Compatibility aliases while untouched screens migrate.
    xl: 20,
    pill: 999,
  },
  typography: {
    heroAmount: { fontSize: 38, lineHeight: 42, letterSpacing: -1.14 },
    title: { fontSize: 20, lineHeight: 26, letterSpacing: -0.4 },
    section: { fontSize: 17, lineHeight: 22, letterSpacing: -0.17 },
    rowTitle: { fontSize: 16, lineHeight: 21 },
    rowAmount: { fontSize: 16, lineHeight: 21 },
    metric: { fontSize: 20, lineHeight: 25, letterSpacing: -0.4 },
    body: { fontSize: 15, lineHeight: 22 },
    caption: { fontSize: 13, lineHeight: 18 },
    caps: { fontSize: 12, lineHeight: 16, letterSpacing: 1.44 },
    micro: { fontSize: 11, lineHeight: 14, letterSpacing: 0.88 },
  },
  font: {
    regular: "PlusJakartaSans_400Regular",
    medium: "PlusJakartaSans_500Medium",
    semibold: "PlusJakartaSans_600SemiBold",
    bold: "PlusJakartaSans_700Bold",
    extraBold: "PlusJakartaSans_800ExtraBold",
    bengali: "NotoSansBengali_600SemiBold",
  },
  controlHeight: 48,
  motion: {
    quick: 180,
    standard: 250,
  },
  elevation: {
    lightRaised: {
      shadowOpacity: 0.12,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    darkRaised: {
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
  },
  chart: {
    plotHeight: 112,
    axisWidth: 32,
    gridlineWidth: 1,
    baselineWidth: 1.5,
    barWidth: 13,
    barGap: 3,
  },
} as const;

export const categoryTokens = {
  light: {
    Personal: { fill: "#B45309", glyph: "#FFFFFF" },
    Housing: { fill: "#0F766E", glyph: "#FFFFFF" },
    Bills: { fill: "#1D5FC4", glyph: "#FFFFFF" },
    Groceries: { fill: "#15803D", glyph: "#FFFFFF" },
    Kids: { fill: "#A81F5B", glyph: "#FFFFFF" },
    Health: { fill: "#8E44AD", glyph: "#FFFFFF" },
  },
  dark: {
    Personal: { fill: "#F5B155", glyph: "#3A2405" },
    Housing: { fill: "#4FD1C5", glyph: "#04302C" },
    Bills: { fill: "#7FB0FF", glyph: "#062347" },
    Groceries: { fill: "#6EDA96", glyph: "#05301A" },
    Kids: { fill: "#FF8FB4", glyph: "#40071F" },
    Health: { fill: "#C99BE0", glyph: "#2E0F3B" },
  },
} as const;

export type ScalarCategoryName = keyof typeof categoryTokens.light;
