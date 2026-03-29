import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ToastConfig} from 'react-native-toast-message';
import {colors} from '@trackingPortal/themes/colors';

type Variant = 'success' | 'error' | 'info';

type ToastCardProps = {
  variant: Variant;
  text1?: string;
  text2?: string;
};

const variantTokens: Record<
  Variant,
  {icon: string; accent: string; bg: string}
> = {
  success: {
    icon: 'check',
    accent: colors.accent,
    bg: 'rgba(182, 247, 0, 0.16)',
  },
  error: {
    icon: 'alert-circle',
    accent: colors.error,
    bg: 'rgba(255, 64, 85, 0.16)',
  },
  info: {
    icon: 'information',
    accent: colors.tertiary,
    bg: 'rgba(196, 127, 255, 0.16)',
  },
};

const DarkToastCard: React.FC<ToastCardProps> = ({variant, text1, text2}) => {
  const token = variantTokens[variant];

  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, {borderColor: token.bg}]}>
        <View style={[styles.iconBadge, {backgroundColor: token.bg}]}>
          <MaterialCommunityIcons
            name={token.icon}
            size={18}
            color={token.accent}
          />
        </View>
        <View style={styles.textContainer}>
          {text1 ? (
            <Text style={styles.title} numberOfLines={2}>
              {text1}
            </Text>
          ) : null}
          {text2 ? (
            <Text style={styles.description} numberOfLines={3}>
              {text2}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const makeRenderer =
  (variant: Variant) =>
  ({text1, text2}: {text1?: string; text2?: string}) =>
    <DarkToastCard variant={variant} text1={text1} text2={text2} />;

export const toastConfig: ToastConfig = {
  success: makeRenderer('success'),
  error: makeRenderer('error'),
  info: makeRenderer('info'),
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    shadowColor: colors.overlay,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 12},
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  description: {
    color: colors.subText,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default toastConfig;
