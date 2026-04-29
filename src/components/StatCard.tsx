import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@trackingPortal/themes/colors';
import { CommonCard } from './CommonCard';

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  subtitle?: string;
  style?: any;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  label, 
  value, 
  subtitle,
  style, 
  onPress 
}) => {
  return (
    <CommonCard style={[styles.container, style]} padding={20} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name={icon as any} size={18} color={colors.primary} />
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {label.toUpperCase()}
        </Text>
      </View>
      
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      
      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}

      {onPress && (
        <Text style={styles.actionHint}>
          {label.toLowerCase().includes('limit') ? 'Adjust limit →' : 'Set goal →'}
        </Text>
      )}
    </CommonCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  iconWrapper: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    flex: 1,
  },
  value: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Manrope',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.subText,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  actionHint: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 12,
    opacity: 0.9,
  },
});
