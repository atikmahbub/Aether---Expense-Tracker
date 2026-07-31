import React, {useMemo} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAppTheme} from '@trackingPortal/contexts/ThemeContext';
import {designTokens} from '@trackingPortal/themes/designTokens';

// ─── Variant tokens ───────────────────────────────────────────────────────────
const TOKEN = {
  success: {
    icon: 'check-circle' as const,
    tone: 'positive' as const,
  },
  error: {
    icon: 'alert-circle' as const,
    tone: 'negative' as const,
  },
  info: {
    icon: 'information' as const,
    tone: 'brand' as const,
  },
  offline: {
    icon: 'cloud-off-outline' as const,
    tone: 'warning' as const,
  },
} as const;

type Variant = keyof typeof TOKEN;

// ─── Card ─────────────────────────────────────────────────────────────────────
const ToastCard = ({
  variant,
  text1,
  text2,
}: {
  variant: Variant;
  text1?: string;
  text2?: string;
}) => {
  const t = TOKEN[variant];
  const {colors} = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const accent = colors[t.tone];
  const wash =
    t.tone === 'negative'
      ? colors.errorSoft
      : t.tone === 'brand'
        ? colors.brandWash
        : colors.surfaceSunken;
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={[styles.accentBar, {backgroundColor: accent}]} />

        {/* Icon */}
        <View style={[styles.iconBadge, {backgroundColor: wash}]}>
          <MaterialCommunityIcons name={t.icon} size={20} color={accent} />
        </View>

        {/* Text */}
        <View style={styles.textBox}>
          {!!text1 && (
            <Text style={styles.title} numberOfLines={2}>
              {text1}
            </Text>
          )}
          {!!text2 && (
            <Text style={styles.subtitle} numberOfLines={3}>
              {text2}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

// ─── Factory ──────────────────────────────────────────────────────────────────
const make = (variant: Variant) => {
  const ToastRenderer = ({
    text1,
    text2,
  }: {
    text1?: string;
    text2?: string;
  }) => <ToastCard variant={variant} text1={text1} text2={text2} />;
  ToastRenderer.displayName = `ScalarToast(${variant})`;
  return ToastRenderer;
};

// ─── Config ───────────────────────────────────────────────────────────────────
export const toastConfig = {
  success: make('success'),
  error: make('error'),
  info: make('info'),
  offline: make('offline'),
};

export default toastConfig;

// ─── Styles ───────────────────────────────────────────────────────────────────
function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: designTokens.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingRight: 16,
    paddingVertical: 14,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.backdrop,
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 5},
      },
      android: {
        elevation: 10,
      },
    }),
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginLeft: 4,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: designTokens.font.bold,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: designTokens.font.regular,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  });
}
