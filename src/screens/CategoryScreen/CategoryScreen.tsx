import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@trackingPortal/contexts/LanguageContext';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCategories, CategoryType } from '@trackingPortal/hooks/useCategories';
import { useStoreContext } from '@trackingPortal/contexts/StoreProvider';
import CategoryItem from '@trackingPortal/screens/CategoryScreen/CategoryItem';
import CategoryModal from '@trackingPortal/screens/CategoryScreen/CategoryModal';
import { ExpenseCategoryModel, IncomeCategoryModel } from '@trackingPortal/api/models';
import { useNavigation } from 'expo-router';
import TransactionSegmentedControl from '@trackingPortal/screens/TransactionScreen/components/TransactionSegmentedControl';
import { useScalarAlert } from '@trackingPortal/components/ScalarAlert';
import { ScreenGradient } from '@trackingPortal/components/scalar';
import { designTokens } from '@trackingPortal/themes/designTokens';

const CategoryScreen = () => {
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const showAlert = useScalarAlert();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const [selectedType, setSelectedType] = useState<CategoryType>('expense');
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories(selectedType);
  const { hiddenCategoryIds, toggleCategoryHidden } = useStoreContext();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategoryModel | IncomeCategoryModel | null>(null);

  const handleAdd = () => {
    setEditingCategory(null);
    setModalVisible(true);
  };

  const handleEdit = (category: ExpenseCategoryModel | IncomeCategoryModel) => {
    if (category.userId === null) {
      showAlert({
        title: t('cat.systemTitle'),
        message: t('cat.systemEdit'),
      });
      return;
    }
    setEditingCategory(category);
    setModalVisible(true);
  };

  const handleDelete = (item: ExpenseCategoryModel | IncomeCategoryModel) => {
    if (item.userId === null) {
      showAlert({
        title: t('cat.systemTitle'),
        message: t('cat.systemDelete'),
      });
      return;
    }

    showAlert({
      title: t('cat.deleteTitle'),
      message: t('cat.deleteMessage', { name: item.name }),
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteCategory(item.id)
        },
      ],
    });
  };

  const renderItem = (item: ExpenseCategoryModel | IncomeCategoryModel, index: number) => (
    <CategoryItem
      key={item.id}
      item={item}
      showDivider={index < categories.length - 1}
      onEdit={() => handleEdit(item)}
      onDelete={() => handleDelete(item)}
      hidden={hiddenCategoryIds.includes(item.id)}
      onToggleHidden={() => toggleCategoryHidden(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      {!isDark && <ScreenGradient />}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('cat.title')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <TransactionSegmentedControl
        options={['expense', 'income']}
        labels={{ expense: t('wallet.expense'), income: t('wallet.income') }}
        selectedOption={selectedType}
        onOptionPress={(option) => setSelectedType(option as CategoryType)}
        containerStyle={styles.segmentedControl}
      />

      {loading && categories.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {categories.length ? (
            // One grouped card, like the wallet / loan / invest lists.
            <View style={styles.card}>{categories.map(renderItem)}</View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t('cat.empty')}</Text>
            </View>
          )}
          <Text style={styles.hint}>
            {t('cat.hint')}
          </Text>
        </ScrollView>
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAdd}
        color={colors.primaryButtonInk}
      />

      <CategoryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={async (data) => {
          if (editingCategory) {
            await updateCategory(editingCategory.id, data);
          } else {
            await createCategory(data);
          }
          setModalVisible(false);
        }}
        initialData={editingCategory}
        existingNames={categories.map(c => c.name.toLowerCase())}
      />
    </View>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Screen titles use the wide display face, as on Settings.
    title: {
      fontSize: 20,
      color: colors.text,
      fontFamily: designTokens.font.display,
      letterSpacing: -0.4,
    },
    card: {
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.listCardBorder,
      borderRadius: designTokens.radius.group,
      backgroundColor: colors.listCardBg,
    },
    emptyCard: {
      padding: 18,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.dashedBorder,
      borderRadius: designTokens.radius.group,
    },
    hint: {
      marginTop: 12,
      paddingHorizontal: 4,
      color: colors.textMuted,
      fontFamily: designTokens.font.regular,
      fontSize: 13,
      lineHeight: 18,
    },
    segmentedControl: {
      marginHorizontal: 20,
      marginBottom: 20,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 100,
    },
    emptyText: {
      color: colors.textMuted,
      fontFamily: designTokens.font.medium,
      textAlign: 'center',
      ...designTokens.typography.body,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 16,
      bottom: 32,
      backgroundColor: colors.primaryButtonBg,
      borderRadius: 28,
    },
  });
}

export default CategoryScreen;
