import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface CategoryChipProps {
  label: string;
  color: string;
  icon: string;
  active?: boolean;
  onPress?: () => void;
}

const toRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  color,
  icon,
  active = false,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, active && styles.activeContainer, active && {
        backgroundColor: toRgba(color, 0.16),
        shadowColor: color,
      }]}
      accessibilityRole="button"
      accessibilityState={{selected: active}}
    >
      <View style={[styles.iconWrapper, {backgroundColor: toRgba(color, active ? 0.25 : 0.12)}]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.label, active && styles.activeLabel]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  activeContainer: {
    borderColor: 'transparent',
    shadowOpacity: 0.45,
    shadowOffset: {width: 0, height: 10},
    shadowRadius: 18,
    elevation: 6,
  },
  iconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: '#fff',
  },
});

export default CategoryChip;
