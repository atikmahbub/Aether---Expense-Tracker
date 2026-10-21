import React, { useMemo } from 'react';
import { useTranslation } from '@trackingPortal/contexts/LanguageContext';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import { ExpenseCategoryModel, IncomeCategoryModel } from '@trackingPortal/api/models';
import { designTokens } from '@trackingPortal/themes/designTokens';
import { normalizeCategoryIcon } from '../TransactionScreen/TransactionScreen.constants';

interface CategoryItemProps {
  item: ExpenseCategoryModel | IncomeCategoryModel;
  onEdit: () => void;
  onDelete: () => void;
  hidden: boolean;
  onToggleHidden: () => void;
  showDivider: boolean;
}

/** A grouped list row matching the wallet / loan / invest rows (ScalarListRow). */
const CategoryItem = ({
  item,
  onEdit,
  onDelete,
  hidden,
  onToggleHidden,
  showDivider,
}: CategoryItemProps) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isSystem = item.userId === null;
  const meta = [t(isSystem ? 'cat.default' : 'cat.custom'), hidden && t('cat.hiddenWhenAdding')]
    .filter(Boolean)
    .join(' · ');

  const renderRightActions = () => {
    if (isSystem) return null;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('cat.deleteA11y', { name: item.name })}
        style={styles.deleteAction}
        onPress={onDelete}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.onNegative} />
      </Pressable>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable
        accessibilityRole="button"
        onPress={onEdit}
        style={({ pressed }) => [
          styles.row,
          showDivider && styles.divider,
          pressed && styles.pressed,
        ]}
      >
        <View
          style={[
            styles.tile,
            { backgroundColor: item.color || colors.brand },
            hidden && styles.dimmed,
          ]}
        >
          <MaterialCommunityIcons
            name={normalizeCategoryIcon(item.icon) as any}
            size={20}
            color={colors.onBrand}
          />
        </View>
        <View style={[styles.middle, hidden && styles.dimmed]}>
          <Text numberOfLines={1} style={styles.title}>{item.name}</Text>
          <Text numberOfLines={1} style={styles.meta}>{meta}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            hidden
              ? t('cat.showA11y', { name: item.name })
              : t('cat.hideA11y', { name: item.name })
          }
          hitSlop={10}
          onPress={onToggleHidden}
          style={styles.eyeButton}
        >
          <MaterialCommunityIcons
            name={hidden ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.textMuted}
          />
        </Pressable>
        {!isSystem && (
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        )}
      </Pressable>
    </Swipeable>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    row: {
      minHeight: 66,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 11,
      paddingHorizontal: 14,
      backgroundColor: colors.listCardBg,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.rowDivider,
    },
    pressed: { opacity: 0.7 },
    dimmed: { opacity: 0.45 },
    tile: {
      width: 44,
      height: 44,
      borderRadius: designTokens.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    middle: { flex: 1, minWidth: 0, gap: 2 },
    title: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.semibold,
      ...designTokens.typography.rowTitle,
    },
    meta: {
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      ...designTokens.typography.caption,
    },
    eyeButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteAction: {
      width: 76,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.negative,
    },
  });
}

export default CategoryItem;
