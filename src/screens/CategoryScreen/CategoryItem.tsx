import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import { ExpenseCategoryModel, IncomeCategoryModel } from '@trackingPortal/api/models';
import { normalizeCategoryIcon } from '../TransactionScreen/TransactionScreen.constants';

interface CategoryItemProps {
  item: ExpenseCategoryModel | IncomeCategoryModel;
  onEdit: () => void;
  onDelete: () => void;
  hidden: boolean;
  onToggleHidden: () => void;
}

const CategoryItem = ({ item, onEdit, onDelete, hidden, onToggleHidden }: CategoryItemProps) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isSystem = item.userId === null;

  const renderRightActions = () => {
    if (isSystem) return null;

    return (
      <TouchableOpacity style={styles.deleteAction} onPress={onDelete}>
        <MaterialCommunityIcons name="trash-can-outline" size={24} color={colors.error} />
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity
        style={[
          styles.container,
          !isDark && { backgroundColor: colors.sheet, borderColor: colors.sheetBorder, borderWidth: 1.5 },
        ]}
        onPress={onEdit}
        activeOpacity={0.7}
      >
        <View style={[styles.leftContent, hidden && styles.hiddenContent]}>
          <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
            <MaterialCommunityIcons
              name={normalizeCategoryIcon(item.icon)}
              size={24}
              color={item.color}
            />
          </View>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            {(isSystem || hidden) && (
              <Text style={styles.systemBadge}>
                {[isSystem && 'Default', hidden && 'Hidden'].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.rightContent}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={hidden ? `Show ${item.name} when adding entries` : `Hide ${item.name} when adding entries`}
            hitSlop={10}
            onPress={onToggleHidden}
            style={styles.eyeButton}
          >
            <MaterialCommunityIcons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.inactiveIcon}
            />
          </TouchableOpacity>
          <View style={[styles.colorIndicator, { backgroundColor: item.color }, hidden && styles.hiddenContent]} />
          {!isSystem && (
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.inactiveIcon} />
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
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
      fontWeight: '800',
      color: colors.text,
      fontFamily: 'Outfit_400Regular',
    },
    systemBadge: {
      fontSize: 10,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: '700',
      marginTop: 2,
    },
    rightContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    hiddenContent: {
      opacity: 0.45,
    },
    eyeButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    deleteAction: {
      backgroundColor: colors.errorSoft,
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
      borderRadius: 20,
      marginBottom: 12,
      marginLeft: 12,
      borderWidth: 1,
      borderColor: colors.negativeTile,
    },
  });
}

export default CategoryItem;
