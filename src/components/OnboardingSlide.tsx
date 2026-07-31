import React, { useMemo } from 'react';
import {View, StyleSheet, Text, Dimensions} from 'react-native';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import { designTokens } from '@trackingPortal/themes/designTokens';

interface OnboardingSlideProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}

const {width} = Dimensions.get('window');

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({title, subtitle, icon}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.container, {width}]}>
      <View style={styles.card}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={styles.eyebrow}>BUILT FOR EVERYDAY MONEY</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    card: {
      width: '100%',
      minHeight: 390,
      padding: 24,
      justifyContent: 'center',
      gap: 16,
      alignItems: 'center',
      borderRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    eyebrow: {
      color: colors.textTertiary,
      fontFamily: designTokens.font.bold,
      fontWeight: '700',
      ...designTokens.typography.caps,
      textAlign: 'center',
    },
    title: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 37,
      textAlign: 'center',
      letterSpacing: -0.6,
    },
    subtitle: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.regular,
      fontSize: 15,
      lineHeight: 24,
      textAlign: 'center',
      maxWidth: 320,
    },
    iconContainer: {
      width: 72,
      height: 72,
      marginBottom: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: designTokens.radius.lg,
      backgroundColor: colors.brand,
    },
  });
}

export default OnboardingSlide;
