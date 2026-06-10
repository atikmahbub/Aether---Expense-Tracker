import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';

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
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: isDark ? 4 : 1 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: isDark ? 8 : 2,
      elevation: isDark ? 4 : 0,
    },
  });
}
