import React, {useMemo} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, View} from 'react-native';
import CategoryChip from '@trackingPortal/screens/TransactionScreen/components/CategoryChip';
import {ExpenseCategoryModel} from '@trackingPortal/api/models';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import { useTranslation } from '@trackingPortal/contexts/LanguageContext';

interface CategorySelectorProps {
  categories: ExpenseCategoryModel[];
  selectedCategoryId?: string;
  onSelect: (categoryId: string) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  recentCategoryIds?: string[];
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryId,
  onSelect,
  loading,
  error,
  onRetry,
  recentCategoryIds,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const prioritizedCategories = useMemo(() => {
    if (!recentCategoryIds?.length) {
      return categories;
    }
    const recentMatches = recentCategoryIds
      .map(id => categories.find(category => category.id === id))
      .filter(
        (category): category is ExpenseCategoryModel => Boolean(category),
      )
      .slice(0, 3);
    const recentIds = new Set(recentMatches.map(category => category.id));
    const remaining = categories.filter(
      category => !recentIds.has(category.id),
    );
    return [...recentMatches, ...remaining];
  }, [categories, recentCategoryIds]);

  if (loading && !categories.length) {
    return (
      <View style={styles.fallbackContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!loading && !categories.length) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.placeholder}>{t('form.noCategories')}</Text>
        {error ? (
          <Text style={styles.helper}>{t('form.pullToRefresh')}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
          {prioritizedCategories.map(item => (
            <CategoryChip
              key={item.id}
              label={item.name}
              color={item.color}
              icon={item.icon}
              active={item.id === selectedCategoryId}
              onPress={() => onSelect(item.id)}
            />
          ))}
      </ScrollView>
      {error ? (
        <Text style={styles.errorText} onPress={onRetry}>
          {onRetry ? t('form.categoriesRetry') : error}
        </Text>
      ) : null}
    </View>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    listContent: {
      paddingVertical: 4,
      flexDirection: 'row',
      gap: 8,
      paddingRight: 20,
    },
    fallbackContainer: {
      minHeight: 48,
      borderRadius: 18,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.dashedBorder,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
    },
    placeholder: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    helper: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 4,
    },
    errorText: {
      color: colors.warning,
      fontSize: 12,
      marginTop: 6,
      fontFamily: 'Outfit_600SemiBold',
    },
  });
}

export default CategorySelector;
