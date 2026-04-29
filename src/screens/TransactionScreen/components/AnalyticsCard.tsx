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
import Svg, { Path, Defs, Circle, Line, Text as SvgText, LinearGradient, Stop } from 'react-native-svg';
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
    const bottomY = 54;
    const endY = 50 - (cappedSpent / maxVal) * 40; 
    
    // Smooth bezier curve
    const pathD = `M 0 50 C 80 60, 180 ${endY - 15}, 260 ${endY}`;
    // Area path for the fill
    const areaD = `${pathD} L 260 ${bottomY} L 0 ${bottomY} Z`;

    return (
      <View style={styles.graphWrapper}>
        <Svg width="100%" height="100%" viewBox="0 0 300 60">
          <Defs>
            <Path id="linePath" d={pathD} />
            <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={graphColor} stopOpacity="0.15" />
              <Stop offset="100%" stopColor={graphColor} stopOpacity="0.01" />
            </LinearGradient>
          </Defs>

          <Line x1="0" y1="10" x2="260" y2="10" stroke={colors.glassBorder} strokeWidth="1" strokeDasharray="4 4" />
          <Line x1="0" y1="30" x2="260" y2="30" stroke={colors.glassBorder} strokeWidth="1" strokeDasharray="4 4" />
          <Line x1="0" y1="50" x2="260" y2="50" stroke={colors.glassBorder} strokeWidth="1" strokeDasharray="4 4" />
          
          <SvgText x="270" y="14" fill={colors.muted} fontSize="8">{formatCompact(maxVal)}</SvgText>
          <SvgText x="270" y="34" fill={colors.muted} fontSize="8">{formatCompact(midVal)}</SvgText>
          <SvgText x="270" y="54" fill={colors.muted} fontSize="8">0</SvgText>

          {/* Area Fill */}
          <Path d={areaD} fill="url(#fillGrad)" />
          
          {/* Main Line */}
          <Path d={pathD} fill="none" stroke={graphColor} strokeWidth="2.5" />
          
          {/* Active Dot */}
          <Circle cx="260" cy={endY} r="3" fill={graphColor} />
          <Circle cx="260" cy={endY} r="6" stroke={graphColor} strokeWidth="1.5" strokeOpacity="0.2" fill="none" />
        </Svg>
      </View>
    );
  };

  const renderTopCategoryPreview = () => {
    if (!analytics?.topCategory || !showHeavyUI) return null;
    const category = categories[analytics.topCategory.categoryId];
    const catColor = category?.color || colors.primary;

    // Fix: percentage is in breakdown, not topCategory
    const topCatData = analytics.categoryBreakdown.find(
      c => c.categoryId === analytics.topCategory?.categoryId
    );
    const percentage = topCatData?.percentage || 0;

    return (
      <View style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewLabel}>{mode === 'expense' ? 'TOP EXPENSE' : 'TOP INCOME'}</Text>
          <Text style={styles.previewAmount}>{formatAmount(analytics.topCategory.totalAmount)}</Text>
        </View>
        
        <View style={styles.previewMain}>
          <View style={styles.previewValueRow}>
            <Text style={styles.previewValue}>{analytics.topCategory.categoryName}</Text>
            <Text style={styles.percentageText}>{formatNumber(percentage, { maximumFractionDigits: 0 })}%</Text>
          </View>
          <View style={styles.miniBarTrack}>
             <View style={[styles.miniBarFill, { width: `${percentage}%`, backgroundColor: catColor }]} />
          </View>
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

        {analytics && renderGraph()}
        {analytics && renderTopCategoryPreview()}
      </View>

      {analytics && expanded && (
        <View style={styles.expandedContent}>
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)', // Subtle border
  },
  headerArea: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  graphWrapper: {
    height: 60, // Ultra-narrow height
    width: '100%',
    marginTop: 12,
    marginBottom: 8,
  },
  previewContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)', // Subtle separator
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  previewAmount: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  previewMain: {
    gap: 8,
  },
  previewValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  previewValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },
  percentageText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  miniBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  expandedContent: {
    marginTop: 12,
  },
  breakdownHeader: {
    marginTop: 20,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
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
