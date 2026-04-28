import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@trackingPortal/themes/colors';
import { ExpenseCategoryModel, IncomeCategoryModel } from '@trackingPortal/api/models';
import { normalizeCategoryIcon } from '../TransactionScreen/TransactionScreen.constants';

interface CategoryItemProps {
  item: ExpenseCategoryModel | IncomeCategoryModel;
  onEdit: () => void;
  onDelete: () => void;
}

const CategoryItem = ({ item, onEdit, onDelete }: CategoryItemProps) => {
  const isSystem = item.userId === null;
  const isOther = item.name === 'Other';

  const renderRightActions = () => {
    if (isSystem || isOther) return null;
    
    return (
      <TouchableOpacity style={styles.deleteAction} onPress={onDelete}>
        <MaterialCommunityIcons name="trash-can-outline" size={24} color="#ff4d4d" />
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity 
        style={styles.container} 
        onPress={onEdit}
        activeOpacity={0.7}
      >
        <View style={styles.leftContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
            <MaterialCommunityIcons 
              name={normalizeCategoryIcon(item.icon)} 
              size={24} 
              color={item.color} 
            />
          </View>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            {isSystem && <Text style={styles.systemBadge}>Default</Text>}
          </View>
        </View>
        
        <View style={styles.rightContent}>
          <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
          {!isSystem && !isOther && (
            <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.2)" />
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16191d',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  systemBadge: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deleteAction: {
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 24,
    marginBottom: 12,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.2)',
  },
});

export default CategoryItem;
