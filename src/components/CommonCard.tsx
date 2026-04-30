import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { colors } from '@trackingPortal/themes/colors';

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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
