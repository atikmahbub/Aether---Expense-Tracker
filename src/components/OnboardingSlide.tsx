import React, { useMemo } from 'react';
import {View, StyleSheet, Text, Dimensions} from 'react-native';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';

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
      <View style={styles.copyBlock}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
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
      paddingHorizontal: 32,
    },
    copyBlock: {
      gap: 16,
      alignItems: 'center',
    },
    title: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 38,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    subtitle: {
      color: colors.subText,
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      maxWidth: 320,
    },
    iconContainer: {
      marginBottom: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

export default OnboardingSlide;
