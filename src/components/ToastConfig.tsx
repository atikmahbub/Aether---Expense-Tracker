import React from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// ─── Variant tokens ───────────────────────────────────────────────────────────
const TOKEN = {
  success: {
    icon: 'check-circle' as const,
    accent: '#b6f700',
    bg: 'rgba(182,247,0,0.10)',
    border: 'rgba(182,247,0,0.22)',
  },
  error: {
    icon: 'alert-circle' as const,
    accent: '#FF6B6B',
    bg: 'rgba(255,107,107,0.10)',
    border: 'rgba(255,107,107,0.22)',
  },
  info: {
    icon: 'information' as const,
    accent: '#c47fff',
    bg: 'rgba(196,127,255,0.10)',
    border: 'rgba(196,127,255,0.22)',
  },
  offline: {
    icon: 'cloud-off-outline' as const,
    accent: '#FFB347',
    bg: 'rgba(255,179,71,0.10)',
    border: 'rgba(255,179,71,0.22)',
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
  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, {borderColor: t.border}]}>
        {/* Left neon accent bar */}
        <View style={[styles.accentBar, {backgroundColor: t.accent}]} />

        {/* Icon */}
        <View style={[styles.iconBadge, {backgroundColor: t.bg}]}>
          <MaterialCommunityIcons name={t.icon} size={20} color={t.accent} />
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
const make =
  (variant: Variant) =>
  ({text1, text2}: {text1?: string; text2?: string}) =>
    <ToastCard variant={variant} text1={text1} text2={text2} />;

// ─── Config ───────────────────────────────────────────────────────────────────
export const toastConfig = {
  success: make('success'),
  error: make('error'),
  info: make('info'),
  offline: make('offline'),
};

export default toastConfig;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1418',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingRight: 16,
    paddingVertical: 14,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 18,
        shadowOffset: {width: 0, height: 10},
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
    color: '#f1f4fa',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  subtitle: {
    color: 'rgba(241,244,250,0.65)',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
});
