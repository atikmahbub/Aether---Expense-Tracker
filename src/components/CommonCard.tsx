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
      {isDark && <View pointerEvents="none" style={styles.topHighlight} />}
      {children}
    </CardContainer>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors'], isDark: boolean) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: isDark ? designTokens.radius.lg : 16,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: isDark ? 4 : 1 },
      shadowOpacity: isDark ? 0.32 : 0.04,
      shadowRadius: isDark ? 16 : 2,
      elevation: isDark ? 5 : 0,
      overflow: 'hidden',
    },
    topHighlight: {
      position: 'absolute',
      top: 0,
      left: 18,
      right: 18,
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
  });
}
