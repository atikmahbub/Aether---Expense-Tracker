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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  TransactionAnalyticsModel,
  ExpenseCategoryModel,
} from '@trackingPortal/api/models';
import Svg, { Path, Defs, Circle, Line, Text as SvgText } from 'react-native-svg';
import {colors} from '@trackingPortal/themes/colors';
import {formatCurrency, formatNumber} from '@trackingPortal/utils/utils';
import {CurrencyPreference} from '@trackingPortal/constants/currency';
import { CommonCard } from '@trackingPortal/components/CommonCard';

interface AnalyticsCardProps {
  analytics: TransactionAnalyticsModel | null;
  categories: Record<string, ExpenseCategoryModel>;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  currency?: CurrencyPreference;
  monthlyLimit?: number;
  mode?: 'expense' | 'income';
  trend?: {
    label: string;
    color: string;
    icon: any;
    percent: number;
    isLower: boolean | null;
  } | null;
  trendLoading?: boolean;
  totalSpent?: number;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  analytics,
  categories,
  loading,
  error,
  onRetry,
  currency,
  monthlyLimit,
  mode = 'expense',
  trend,
  trendLoading,
  totalSpent,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showHeavyUI, setShowHeavyUI] = useState(false);

  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    
    const rafId = requestAnimationFrame(() => {
      setShowHeavyUI(true);
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  const formatAmount = useCallback(
    (value: number) => formatCurrency(value, currency),
    [currency],
  );

  const budgetSummary = useMemo(() => {
    if (typeof monthlyLimit !== 'number' || monthlyLimit <= 0) {
      return null;
    }
    const spent = Math.abs(totalSpent ?? analytics?.totalTransaction ?? 0);
    return {
      isOver: spent > monthlyLimit,
    };
  }, [analytics, monthlyLimit, totalSpent]);

  const sortedCategories = useMemo(() => {
    if (!analytics?.categoryBreakdown?.length) {
      return [];
    }
    return [...analytics.categoryBreakdown].sort(
      (a, b) => b.percentage - a.percentage,
    );
  }, [analytics?.categoryBreakdown]);

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  }, []);

  const renderGraph = () => {
    const isOverLimit = budgetSummary?.isOver ?? false;
    const graphColor = isOverLimit ? colors.error : colors.primary;
    
    const spentVal = Math.abs(totalSpent ?? analytics?.totalTransaction ?? 0);
    const baseMax = monthlyLimit && monthlyLimit > 0 ? monthlyLimit : spentVal * 1.5;
    const maxVal = Math.max(spentVal, baseMax) || 100;
    const midVal = maxVal / 2;

    const formatCompact = (val: number) => {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
      return val.toFixed(0);
    };

    const cappedSpent = Math.min(spentVal, maxVal);
    const endY = 90 - (cappedSpent / maxVal) * 80;
    const pathD = `M 0 90 C 80 110, 180 ${endY - 30}, 260 ${endY}`;

    return (
      <View style={{ height: 140, width: '100%', marginTop: 16 }}>
        <Svg width="100%" height="100%" viewBox="0 0 300 100">
          <Line x1="0" y1="10" x2="260" y2="10" stroke={colors.glassBorder} strokeWidth="1" strokeDasharray="4 4" />
          <Line x1="0" y1="50" x2="260" y2="50" stroke={colors.glassBorder} strokeWidth="1" strokeDasharray="4 4" />
          <Line x1="0" y1="90" x2="260" y2="90" stroke={colors.glassBorder} strokeWidth="1" strokeDasharray="4 4" />
          
          <SvgText x="270" y="14" fill={colors.muted} fontSize="10">{formatCompact(maxVal)}</SvgText>
          <SvgText x="270" y="54" fill={colors.muted} fontSize="10">{formatCompact(midVal)}</SvgText>
          <SvgText x="270" y="94" fill={colors.muted} fontSize="10">0</SvgText>

          <Path d={pathD} fill="none" stroke={graphColor} strokeWidth="2.5" />
          <Circle cx="260" cy={endY} r="3" fill={graphColor} />
        </Svg>
      </View>
    );
  };

  const renderTopCategoryPreview = () => {
    if (!analytics?.topCategory || !showHeavyUI) return null;
    const category = categories[analytics.topCategory.categoryId];
    const catColor = category?.color || colors.primary;

    return (
      <View style={styles.previewRow}>
        <View style={styles.previewLeft}>
          <Text style={styles.previewLabel}>{mode === 'expense' ? 'TOP EXPENSE' : 'TOP INCOME'}</Text>
          <Text style={styles.previewValue}>{analytics.topCategory.categoryName}</Text>
          
          {/* Subtle category bar hint */}
          <View style={styles.miniBarTrack}>
             <View style={[styles.miniBarFill, { width: `${analytics.topCategory.percentage}%`, backgroundColor: catColor }]} />
          </View>
        </View>
        <View style={styles.previewRight}>
          <Text style={styles.previewAmount}>{formatAmount(analytics.topCategory.totalAmount)}</Text>
        </View>
      </View>
    );
  };

  return (
    <CommonCard style={styles.container} padding={20} onPress={handleToggle}>
      <View style={styles.headerArea}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>
              {mode === 'expense' ? 'SPENDING ANALYTICS' : 'INCOME ANALYTICS'}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.trendContainer}>
              {trend && !trendLoading && (
                <View style={[styles.trendPill, {backgroundColor: 'rgba(255,255,255,0.03)'}]}>
                  <MaterialCommunityIcons name={trend.icon} size={12} color={trend.color} />
                  <Text style={[styles.trendPillText, {color: colors.text}]}>
                    {formatNumber(trend.percent, { maximumFractionDigits: 0 })}%
                  </Text>
                </View>
              )}
            </View>
            <MaterialCommunityIcons 
              name={expanded ? "chevron-up" : "chevron-down"} 
              size={18} 
              color={colors.muted} 
              style={{ marginLeft: 4 }} 
            />
          </View>
        </View>

        {!expanded && renderTopCategoryPreview()}
      </View>

      {analytics && expanded && (
        <View style={styles.expandedContent}>
          {renderGraph()}
          
          <View style={styles.breakdownHeader}>
             <Text style={styles.breakdownTitle}>CATEGORY BREAKDOWN</Text>
          </View>

          <View style={styles.listContainer}>
            {sortedCategories.map(item => {
              const palette = categories[item.categoryId];
              if (!palette) return null;
              
              return (
                <View key={item.categoryId} style={styles.listRow}>
                  <View style={[styles.bullet, {backgroundColor: palette.color || colors.primary}]} />
                  <View style={styles.listLabelColumn}>
                    <Text style={styles.categoryName}>{item.categoryName}</Text>
                    <Text style={styles.categorySecondary}>
                      {formatNumber(item.percentage, { maximumFractionDigits: 1, suffix: '%' })}
                    </Text>
                  </View>
                  <Text style={styles.categoryAmount}>{formatAmount(item.totalAmount)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      )}

      {!analytics && !loading && (
        <Text style={styles.emptyText}>No data for this period</Text>
      )}
    </CommonCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  headerArea: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  trendContainer: {
    alignItems: 'flex-end',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendPillText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  previewLeft: {
    flex: 1,
  },
  previewRight: {
    alignItems: 'flex-end',
  },
  previewLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  previewValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },
  miniBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 2,
    marginTop: 10,
    width: '80%',
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  previewAmount: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },
  expandedContent: {
    marginTop: 8,
  },
  breakdownHeader: {
    marginTop: 24,
    marginBottom: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  breakdownTitle: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  listContainer: {
    gap: 16,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  listLabelColumn: {
    flex: 1,
  },
  categoryName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  categorySecondary: {
    color: colors.subText,
    fontSize: 11,
    marginTop: 2,
  },
  categoryAmount: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  loadingRow: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
  },
});

export default React.memo(AnalyticsCard);
