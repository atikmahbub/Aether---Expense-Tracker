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
import dayjs from 'dayjs';
import {
  TransactionAnalyticsModel,
  ExpenseCategoryModel,
  TransactionModel,
} from '@trackingPortal/api/models';
import Svg, { Path, Defs, Circle, Line, Text as SvgText, LinearGradient, Stop, G } from 'react-native-svg';
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
  transactions?: TransactionModel[];
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
  transactions = [],
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showHeavyUI, setShowHeavyUI] = useState(false);

  // Calculate daily data points for the graph with smoothing
  const { points, dailyTotals, maxDayVal } = useMemo(() => {
    const daysInMonth = 31;
    let totals = new Array(daysInMonth).fill(0);
    
    transactions.forEach(t => {
      const d = dayjs(t.date);
      if (d.isValid()) {
        const day = d.date();
        if (day >= 1 && day <= daysInMonth) {
          totals[day - 1] += Math.abs(t.amount);
        }
      }
    });

    const rawTotals = [...totals];
    // Apply 5-day weighted average for even smoother "Insight" curves
    const smoothedTotals = totals.map((val, i) => {
      const prev2 = totals[Math.max(0, i - 2)];
      const prev1 = totals[Math.max(0, i - 1)];
      const next1 = totals[Math.min(daysInMonth - 1, i + 1)];
      const next2 = totals[Math.min(daysInMonth - 1, i + 2)];
      return (prev2 * 0.5 + prev1 * 0.8 + val + next1 * 0.8 + next2 * 0.5) / 3.6;
    });

    const mVal = Math.max(...smoothedTotals, 10);
    return {
      points: smoothedTotals.map(v => (v / mVal) * 0.7),
      dailyTotals: rawTotals,
      maxDayVal: Math.max(...rawTotals, 10)
    };
  }, [transactions]);

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
    const graphColor = isOverLimit ? 'rgba(248, 113, 113, 0.85)' : colors.primary;
    
    const formatCompact = (val: number) => {
      if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
      return val.toFixed(0);
    };

    const width = 260;
    const height = 50;
    const stepX = width / (points.length - 1);

    const getControlPoints = (p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number]) => {
      const t = 0.4;
      const cp1x = p1[0] + (p2[0] - p0[0]) * t;
      const cp1y = p1[1] + (p2[1] - p0[1]) * t;
      const cp2x = p2[0] - (p3[0] - p1[0]) * t;
      const cp2y = p2[1] - (p3[1] - p1[1]) * t;
      return [cp1x, cp1y, cp2x, cp2y];
    };

    const generateSplinePath = (data: number[]) => {
      const coords: [number, number][] = data.map((p, i) => [i * stepX, height - (p * height)]);
      let d = `M ${coords[0][0]} ${coords[0][1]}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[Math.max(i - 1, 0)];
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const p3 = coords[Math.min(i + 2, coords.length - 1)];
        const [cp1x, cp1y, cp2x, cp2y] = getControlPoints(p0, p1, p2, p3);
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
      }
      return d;
    };

    const mainPath = generateSplinePath(points);
    const mainArea = `${mainPath} L ${width} ${height + 10} L 0 ${height + 10} Z`;

    const maxVal = Math.max(...points);
    const peakIndex = points.indexOf(maxVal);
    const peakX = peakIndex * stepX;
    const peakY = height - (maxVal * height);
    const rawPeakValue = dailyTotals[peakIndex];

    const dateLabels = [1, 10, 20, 31];

    return (
      <View style={styles.graphWrapper}>
        <Svg width="100%" height="100%" viewBox="0 -20 300 85">
          <Defs>
            <LinearGradient id="mainFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={graphColor} stopOpacity="0.25" />
              <Stop offset="100%" stopColor={graphColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          <G y={15}>
            {[10, 30, 50].map(y => (
              <Line key={y} x1="0" y1={y} x2={width} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
            ))}
            
            <SvgText x={width + 10} y="14" fill={colors.muted} fontSize="8">{formatCompact(maxDayVal)}</SvgText>
            <SvgText x={width + 10} y="54" fill={colors.muted} fontSize="8">0</SvgText>

            {dateLabels.map(d => (
              <SvgText key={d} x={(d - 1) * stepX} y={68} fill={colors.muted} fontSize="8" textAnchor="middle">{d}</SvgText>
            ))}

            <Path d={mainArea} fill="url(#mainFill)" />
            <Path d={mainPath} fill="none" stroke={graphColor} strokeWidth="2.5" />
            
            {rawPeakValue > 0 && (
              <>
                <Circle cx={peakX} cy={peakY} r="6" fill={graphColor} opacity={0.15} />
                <Circle cx={peakX} cy={peakY} r="2.5" fill="#fff" />
                <Circle cx={peakX} cy={peakY} r="2.5" stroke={graphColor} strokeWidth="1.5" fill="none" />
                <SvgText x={peakX} y={peakY - 12} fill={graphColor} fontSize="9" fontWeight="900" textAnchor="middle">
                  {formatCompact(rawPeakValue)}
                </SvgText>
              </>
            )}
          </G>
        </Svg>
      </View>
    );
  };

  const renderTopCategoryPreview = () => {
    if (!analytics?.topCategory || !showHeavyUI) return null;
    const category = categories[analytics.topCategory.categoryId];
    const catColor = budgetSummary?.isOver ? 'rgba(248, 113, 113, 0.85)' : (category?.color || colors.primary);

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
            <Text style={styles.percentageText}>{formatNumber(percentage, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%</Text>
          </View>
          <View style={styles.miniBarTrack}>
             <View style={[styles.miniBarFill, { width: `${percentage}%`, backgroundColor: catColor }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <CommonCard style={styles.container} padding={16} onPress={handleToggle}>
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
                    {formatNumber(trend.percent, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%
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
                      {formatNumber(item.percentage, { minimumFractionDigits: 0, maximumFractionDigits: 1, suffix: '%' })}
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
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerArea: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  trendContainer: {
    alignItems: 'flex-end',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendPillText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  graphWrapper: {
    height: 80, // Reduced height for compactness
    width: '100%',
    marginTop: 4,
    marginBottom: 2,
  },
  previewContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  previewAmount: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  previewMain: {
    gap: 6,
  },
  previewValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  previewValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },
  percentageText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  miniBarTrack: {
    height: 4, // Slimmer progress bar
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  expandedContent: {
    marginTop: 8,
  },
  breakdownHeader: {
    marginTop: 12,
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  breakdownTitle: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  listContainer: {
    gap: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  listLabelColumn: {
    flex: 1,
  },
  categoryName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  categorySecondary: {
    color: colors.subText,
    fontSize: 10,
    marginTop: 1,
  },
  categoryAmount: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  loadingRow: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 11,
  },
});

export default React.memo(AnalyticsCard);
