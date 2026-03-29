import React from 'react';
import {View, StyleSheet, Text, Dimensions} from 'react-native';
import {colors} from '@trackingPortal/themes/colors';

interface OnboardingSlideProps {
  title: string;
  subtitle: string;
}

const {width} = Dimensions.get('window');

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({title, subtitle}) => {
  return (
    <View style={[styles.container, {width}]}>
      <View style={styles.copyBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default OnboardingSlide;
