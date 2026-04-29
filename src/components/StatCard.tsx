import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@trackingPortal/themes/colors';
import { CommonCard } from './CommonCard';

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  style?: any;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, style, onPress }) => {
  return (
    <CommonCard style={[styles.container, style]} padding={16} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons name={icon as any} size={18} color={colors.primary} />
          </View>
          <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
            {label.toUpperCase()}
          </Text>
        </View>
        {onPress && (
          <MaterialCommunityIcons 
            name="pencil-outline" 
            size={14} 
            color={colors.subText} 
            style={{ opacity: 0.6 }}
          />
        )}
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {onPress && (
        <Text style={styles.actionHint}>
          {value.toLowerCase().includes('no limit') ? 'Tap to set' : 'Tap to adjust'}
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  iconWrapper: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 8,
    borderRadius: 8,
  },
  label: {
    color: colors.subText,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    flex: 1,
  },
  value: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  actionHint: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.8,
    letterSpacing: 0.3,
  },
});
