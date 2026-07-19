import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import { designTokens } from '@trackingPortal/themes/designTokens';

interface CommonCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: number;
}

export const CommonCard: React.FC<CommonCardProps> = ({
  children,
  style,
  onPress,
  padding = 20,
}) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const CardContainer = onPress ? (TouchableOpacity as any) : View;

  return (
    <CardContainer
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, { padding }, style]}
    >
      {children}
    </CardContainer>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors'], isDark: boolean) {
  return StyleSheet.create({
    // No overflow:'hidden' here — it clips the iOS shadow. Content is padded, so
    // nothing bleeds past the rounded corners.
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: designTokens.radius.xl,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.055)' : 'rgba(15,17,23,0.04)',
      borderTopColor: isDark ? 'rgba(255,255,255,0.11)' : 'rgba(15,17,23,0.04)',
      shadowColor: isDark ? '#000' : '#1B2437',
      shadowOffset: { width: 0, height: isDark ? 12 : 10 },
      shadowOpacity: isDark ? 0.45 : 0.08,
      shadowRadius: isDark ? 24 : 20,
      elevation: isDark ? 7 : 3,
    },
  });
}
