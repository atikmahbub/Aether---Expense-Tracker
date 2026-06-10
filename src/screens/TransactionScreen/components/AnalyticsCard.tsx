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
import Svg, { Path, Defs, Circle, Line, Text as SvgText, LinearGradient, Stop, G, Rect } from 'react-native-svg';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import {formatCurrency, formatNumber} from '@trackingPortal/utils/utils';
import {parseDate} from '@trackingPortal/utils/date';
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
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);
  const [showHeavyUI, setShowHeavyUI] = useState(false);

  const { points, dailyTotals, maxDayVal } = useMemo(() => {
    const daysInMonth = 31;
    let totals = new Array(daysInMonth).fill(0);

    transactions.forEach(t => {
      const d = dayjs(parseDate(t.date));
      if (d.isValid()) {
        const day = d.date();
        if (day >= 1 && day <= daysInMonth) {
          totals[day - 1] += Math.abs(t.amount);
        }
      }
    });

    const rawTotals = [...totals];
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
    const graphColor = isOverLimit ? colors.error : colors.primary;

    const formatCompact = (val: number) => {
      if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
      return val.toFixed(0);
    };

    const width = 300;
    const height = 90;
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
    const mainArea = `${mainPath} L ${width} ${height + 20} L 0 ${height + 20} Z`;

    const maxVal = Math.max(...points);
    const peakIndex = points.indexOf(maxVal);
    const peakX = peakIndex * stepX;
    const peakY = height - (maxVal * height);
    const rawPeakValue = dailyTotals[peakIndex];
    const dateLabels = [1, 10, 20, 31];
    const paddingLeft = 12;
    const paddingRight = 45;

    return (
      <View style={styles.graphWrapper}>
        <Svg width="100%" height="100%" viewBox={`-${paddingLeft} -15 ${width + paddingLeft + paddingRight} ${height + 40}`}>
          <Defs>
            <LinearGradient id="mainFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={graphColor} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={graphColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          <G y={5}>
            {[0, 0.5, 1].map(v => (
              <Line key={v} x1="0" y1={height * (1-v)} x2={width} y2={height * (1-v)} stroke={colors.glassBorder} strokeWidth="1" />
            ))}

            <SvgText x={width + 10} y="5" fill={colors.muted} fontSize="8" fontWeight="700">{formatCompact(maxDayVal)}</SvgText>
            <SvgText x={width + 10} y={height} fill={colors.muted} fontSize="8" fontWeight="700">0</SvgText>

            {dateLabels.map(d => (
              <SvgText key={d} x={(d - 1) * stepX} y={height + 18} fill={colors.muted} fontSize="8" textAnchor="middle" fontWeight="600">{d}</SvgText>
            ))}

            <Path d={mainArea} fill="url(#mainFill)" />
            <Path d={mainPath} fill="none" stroke={graphColor} strokeWidth="2.5" />

            {rawPeakValue > 0 && (
              <G>
                <Circle cx={peakX} cy={peakY} r="6" fill={graphColor} opacity={0.15} />
                <Circle cx={peakX} cy={peakY} r="2.5" fill="#fff" />
                <Circle cx={peakX} cy={peakY} r="2.5" stroke={graphColor} strokeWidth="1.5" fill="none" />
                <SvgText x={peakX} y={peakY - 12} fill={graphColor} fontSize="9" fontWeight="900" textAnchor="middle">
                  {formatCompact(rawPeakValue)}
                </SvgText>
              </G>
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
            {trend && !trendLoading && (
              <View style={[styles.trendPill, { backgroundColor: trend.color + '18', borderColor: trend.color + '30' }]}>
                <MaterialCommunityIcons name={trend.icon} size={11} color={trend.color} />
                <Text style={[styles.trendPillText, { color: trend.color }]}>
                  {formatNumber(trend.percent, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%
                </Text>
              </View>
            )}
            <View style={[styles.chevronWrap, expanded && styles.chevronWrapActive]}>
              <MaterialCommunityIcons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={14}
                color={expanded ? colors.primary : colors.muted}
              />
            </View>
          </View>
        </View>

        {analytics && renderGraph()}
        {analytics && renderTopCategoryPreview()}
      </View>

      {analytics && expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.breakdownTitle}>CATEGORY BREAKDOWN</Text>
            <Text style={styles.breakdownCount}>{sortedCategories.length} categories</Text>
          </View>

          <View style={styles.listContainer}>
            {sortedCategories.map((item) => {
              const palette = categories[item.categoryId];
              if (!palette) return null;
              const barColor = palette.color || colors.primary;

              return (
                <View key={item.categoryId} style={styles.listRow}>
                  <View style={[styles.bullet, { backgroundColor: barColor }]} />
                  <View style={styles.listLabelColumn}>
                    <View style={styles.categoryTopRow}>
                      <Text style={styles.categoryName}>{item.categoryName}</Text>
                      <Text style={styles.categoryAmount}>{formatAmount(item.totalAmount)}</Text>
                    </View>
                    <View style={styles.categoryBarRow}>
                      <View style={styles.categoryBarTrack}>
                        <View style={[styles.categoryBarFill, {
                          width: `${item.percentage}%`,
                          backgroundColor: barColor,
                        }]} />
                      </View>
                      <Text style={styles.categorySecondary}>
                        {formatNumber(item.percentage, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%
                      </Text>
                    </View>
                  </View>
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

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.glassBorder,
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
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.2,
      fontFamily: 'Manrope',
    },
    trendContainer: {
      alignItems: 'flex-end',
    },
    trendPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
    },
    trendPillText: {
      fontSize: 10,
      fontWeight: '700',
      fontFamily: 'Manrope',
    },
    graphWrapper: {
      height: 120,
      width: '100%',
      marginTop: 12,
      marginBottom: 4,
    },
    previewContainer: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.glassBorder,
    },
    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    previewLabel: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.2,
      fontFamily: 'Manrope',
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
      height: 4,
      backgroundColor: colors.surface,
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
      marginBottom: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.glassBorder,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    breakdownTitle: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.2,
      fontFamily: 'Manrope',
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
      width: 8,
      height: 8,
      borderRadius: 4,
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
    chevronWrap: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
    chevronWrapActive: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primaryMid,
    },
    breakdownCount: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '500',
      fontFamily: 'Manrope',
    },
    categoryTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 5,
    },
    categoryBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    categoryBarTrack: {
      flex: 1,
      height: 4,
      backgroundColor: colors.surface,
      borderRadius: 2,
      overflow: 'hidden',
    },
    categoryBarFill: {
      height: '100%',
      borderRadius: 2,
      opacity: 0.85,
    },
  });
}

export default React.memo(AnalyticsCard);
