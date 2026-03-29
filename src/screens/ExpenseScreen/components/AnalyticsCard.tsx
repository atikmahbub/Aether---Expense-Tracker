import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import {
  ExpenseAnalyticsModel,
  ExpenseCategoryModel,
} from '@trackingPortal/api/models';
import SegmentedProgressBar from '@trackingPortal/screens/ExpenseScreen/components/SegmentedProgressBar';
import {colors} from '@trackingPortal/themes/colors';
import {formatCurrency, formatNumber} from '@trackingPortal/utils/utils';
import {CurrencyPreference} from '@trackingPortal/constants/currency';

interface AnalyticsCardProps {
  analytics: ExpenseAnalyticsModel | null;
  categories: Record<string, ExpenseCategoryModel>;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  currency?: CurrencyPreference;
  monthlyLimit?: number;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  analytics,
  categories,
  loading,
  error,
  onRetry,
  currency,
  monthlyLimit,
}) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    setExpanded(false);
  }, [analytics?.categoryBreakdown]);

  const formatAmount = useCallback(
    (value: number) => formatCurrency(value, currency),
    [currency],
  );

  const budgetSummary = useMemo(() => {
    if (!analytics || typeof monthlyLimit !== 'number') {
      return null;
    }
    const delta = monthlyLimit - (analytics.totalExpense || 0);
    const formatted = formatAmount(Math.abs(delta));
    return {
      text:
        delta >= 0
          ? `${formatted} left for this month`
          : `You exceeded by ${formatted}`,
      isOver: delta < 0,
    };
  }, [analytics, monthlyLimit, formatAmount]);

  const segments = useMemo(() => {
    if (!analytics?.categoryBreakdown?.length) {
      return [];
    }
    return analytics.categoryBreakdown.map(item => {
      const fallback = categories[item.categoryId];
      return {
        id: item.categoryId,
        percentage: item.percentage,
        color: fallback?.color || colors.primary,
      };
    });
  }, [analytics?.categoryBreakdown, categories]);

  const sortedCategories = useMemo(() => {
    if (!analytics?.categoryBreakdown?.length) {
      return [];
    }
    return [...analytics.categoryBreakdown].sort(
      (a, b) => b.percentage - a.percentage,
    );
  }, [analytics?.categoryBreakdown]);

  const visibleCategories = useMemo(() => {
    if (!sortedCategories.length) {
      return [];
    }
    return expanded ? sortedCategories : sortedCategories.slice(0, 3);
  }, [expanded, sortedCategories]);

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  }, []);

  const renderTopCategory = () => {
    if (!analytics?.topCategory) {
      return null;
    }
    const palette = categories[analytics.topCategory.categoryId];
    return (
      <View
        style={[
          styles.topCategoryCard,
          palette && {borderColor: palette.color},
        ]}>
        <View>
          <Text style={styles.topCategoryLabel}>Top category</Text>
          <Text style={styles.topCategoryName}>
            {analytics.topCategory.categoryName}
          </Text>
        </View>
        <View>
          <Text style={styles.topCategoryAmount}>
            {formatAmount(analytics.topCategory.totalAmount)}
          </Text>
          <Text style={styles.topCategorySub}>so far</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = (label: string) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Spending Analytics</Text>
        {error && onRetry ? (
          <TouchableOpacity onPress={onRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {budgetSummary ? (
        <View
          style={[
            styles.budgetPill,
            budgetSummary.isOver && styles.budgetPillOver,
          ]}>
          <Text
            style={[
              styles.budgetText,
              budgetSummary.isOver && styles.budgetTextOver,
            ]}>
            {budgetSummary.text}
          </Text>
        </View>
      ) : null}

      {loading && !analytics ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {!loading && !analytics && !error ? renderEmpty('No data yet') : null}

      {analytics ? (
        <View>
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          )}
          {!loading && (
            <View>
              {segments.length ? (
                <View style={styles.progressBlock}>
                  <SegmentedProgressBar segments={segments} height={14} />
                  <Text style={styles.progressHint}>
                    Share of spend by category
                  </Text>
                </View>
              ) : (
                renderEmpty('No breakdown yet')
              )}
            </View>
          )}

          {renderTopCategory()}

          {visibleCategories.length ? (
            <View style={styles.listContainer}>
              {visibleCategories.map(item => {
                const palette = categories[item.categoryId];
                const color = palette?.color || colors.primary;
                return (
                  <View key={item.categoryId} style={styles.listRow}>
                    <View style={[styles.bullet, {backgroundColor: color}]} />
                    <View style={styles.listLabelColumn}>
                      <Text style={styles.categoryName}>
                        {item.categoryName}
                      </Text>
                      <Text style={styles.categorySecondary}>
                        {formatNumber(item.percentage, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                          suffix: '%',
                        })}
                      </Text>
                    </View>
                    <Text style={styles.categoryAmount}>
                      {formatAmount(item.totalAmount)}
                    </Text>
                  </View>
                );
              })}
              {sortedCategories.length > 3 ? (
                <TouchableOpacity
                  onPress={handleToggle}
                  style={styles.toggleButton}>
                  <Text style={styles.toggleText}>
                    {expanded ? 'Show Less' : 'Show All \u2192'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 22,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  budgetPill: {
    marginBottom: 16,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  budgetPillOver: {
    borderColor: colors.warning,
    backgroundColor: 'rgba(255, 170, 0, 0.08)',
  },
  budgetText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  budgetTextOver: {
    color: colors.warning,
  },
  retryText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  loadingRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBlock: {
    marginBottom: 20,
    gap: 6,
  },
  progressHint: {
    color: colors.subText,
    fontSize: 12,
  },
  topCategoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.surfaceAlt,
    marginBottom: 20,
  },
  topCategoryLabel: {
    color: colors.subText,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  topCategoryName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  topCategoryAmount: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
  },
  topCategorySub: {
    color: colors.subText,
    fontSize: 12,
    textAlign: 'right',
  },
  listContainer: {
    gap: 16,
  },
  toggleButton: {
    paddingVertical: 4,
    alignSelf: 'flex-end',
  },
  toggleText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  listLabelColumn: {
    flex: 1,
  },
  categoryName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  categorySecondary: {
    color: colors.subText,
    fontSize: 12,
    marginTop: 2,
  },
  categoryAmount: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  emptyText: {
    color: colors.subText,
    textAlign: 'center',
  },
});

export default AnalyticsCard;
