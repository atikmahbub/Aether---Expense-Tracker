import {View, StyleSheet, TouchableOpacity, InteractionManager} from 'react-native';
import React, {useState, useMemo, useEffect, useCallback} from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Text} from 'react-native-paper';
import {FormikTextInput, CircularProgress} from '@trackingPortal/components';
import FormModal from '@trackingPortal/components/FormModal';
import dayjs, {Dayjs} from 'dayjs';
import {MonthlyLimitModel} from '@trackingPortal/api/models';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {formatCurrency, formatNumber} from '@trackingPortal/utils/utils';
import {Formik, FormikHelpers} from 'formik';
import {EMonthlyLimitFields} from '@trackingPortal/screens/ExpenseScreen/ExpenseCreation/ExpenseCreation.constants';
import Toast from 'react-native-toast-message';
import {Month, Year, UnixTimeStampString} from '@trackingPortal/api/primitives';
import {withHaptic} from '@trackingPortal/utils/haptic';
import {colors} from '@trackingPortal/themes/colors';

interface ISummary {
  totalExpense: number;
  filterMonth: Dayjs;
  monthLimit: MonthlyLimitModel;
  getMonthlyLimit: () => void;
}

const ExpenseSummary: React.FC<ISummary> = ({
  totalExpense,
  filterMonth,
  monthLimit,
  getMonthlyLimit,
}) => {
  const [isLimitModalVisible, setIsLimitModalVisible] =
    useState<boolean>(false);
  const {apiGateway, currentUser: user} = useStoreContext();
  const [loading, setLoading] = useState<boolean>(false);
  const {currency} = useStoreContext();
  const [previousMonthTotal, setPreviousMonthTotal] = useState<number | null>(
    null,
  );
  const [previousMonthLoading, setPreviousMonthLoading] =
    useState<boolean>(false);

  const limitValue = monthLimit?.limit ?? 0;
  const hasLimit = limitValue > 0;
  const previousMonthDate = useMemo(
    () => dayjs(filterMonth).subtract(1, 'month'),
    [filterMonth],
  );
  const previousMonthKey = previousMonthDate.format('YYYY-MM');
  const previousMonthLabel = previousMonthDate.format('MMM');
  const previousMonthLabelFull = previousMonthDate.format('MMMM');

  useEffect(() => {
    let isMounted = true;
    const fetchPreviousMonth = async () => {
      if (!user?.userId) {
        return;
      }
      try {
        setPreviousMonthLoading(true);
        const response = await apiGateway.expenseService.getExpenseByUser({
          userId: user.userId,
          date: previousMonthDate.unix() as unknown as UnixTimeStampString,
        });
        const total = response.reduce(
          (sum, expense) => sum + expense.amount,
          0,
        );
        if (isMounted) {
          setPreviousMonthTotal(total);
        }
      } catch (error) {
        console.log('Failed to fetch previous month summary', error);
        if (isMounted) {
          setPreviousMonthTotal(null);
        }
      } finally {
        if (isMounted) {
          setPreviousMonthLoading(false);
        }
      }
    };

    fetchPreviousMonth();

    return () => {
      isMounted = false;
    };
  }, [apiGateway, user.userId, previousMonthKey, previousMonthDate]);

  const trendSnapshot = useMemo(() => {
    if (previousMonthLoading) {
      return {
        icon: 'progress-clock',
        color: colors.subText,
        label: 'Measuring…',
        isLower: null as boolean | null,
        deltaAmount: 0,
      };
    }

    if (previousMonthTotal === null) {
      return {
        icon: 'minus',
        color: colors.subText,
        label: 'No comparison',
        isLower: null as boolean | null,
        deltaAmount: 0,
      };
    }

    if (previousMonthTotal === 0) {
      if (totalExpense === 0) {
        return {
          icon: 'minus',
          color: colors.subText,
          label: 'Even with last month',
          isLower: null as boolean | null,
          deltaAmount: 0,
        };
      }
      return {
        icon: 'arrow-top-right',
        color: colors.error,
        label: `Higher vs ${previousMonthLabel}`,
        isLower: false,
        deltaAmount: totalExpense,
      };
    }

    const delta = totalExpense - previousMonthTotal;
    const isLower = delta <= 0;
    const percent = (Math.abs(delta) / previousMonthTotal) * 100;
    const percentLabel = formatNumber(percent, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      suffix: '%',
    });

    return {
      icon: isLower ? 'arrow-bottom-right' : 'arrow-top-right',
      color: isLower ? colors.accent : colors.error,
      label: `${percentLabel} ${isLower ? 'lower' : 'higher'} vs ${previousMonthLabel}`,
      isLower,
      deltaAmount: Math.abs(delta),
    };
  }, [
    previousMonthLoading,
    previousMonthTotal,
    totalExpense,
    previousMonthLabel,
  ]);

  const comparisonSentence = useMemo(() => {
    if (previousMonthLoading || previousMonthTotal === null) {
      return '';
    }

    if (previousMonthTotal === 0) {
      if (totalExpense === 0) {
        return 'Exactly aligned with last month.';
      }
      return `Spending resumed after a quiet ${previousMonthLabelFull}.`;
    }

    if (trendSnapshot.deltaAmount === 0) {
      return 'Exactly aligned with last month.';
    }

    const direction = trendSnapshot.isLower ? 'less' : 'more';
    return `${formatCurrency(
      trendSnapshot.deltaAmount,
      currency,
    )} ${direction} than ${previousMonthLabelFull}.`;
  }, [
    previousMonthLoading,
    previousMonthTotal,
    totalExpense,
    trendSnapshot.deltaAmount,
    trendSnapshot.isLower,
    currency,
    previousMonthLabelFull,
  ]);

  const progressRatio = hasLimit ? totalExpense / limitValue : 0;
  const clampedProgress = hasLimit
    ? Math.max(0, Math.min(progressRatio, 1))
    : 0;
  const progressColor =
    !hasLimit || progressRatio <= 1 ? colors.accent : colors.error;
  const progressLabel = hasLimit
    ? formatNumber(Math.min(progressRatio * 100, 999), {
        maximumFractionDigits: 0,
        suffix: '%',
      })
    : '--';
  const remainingBudget = hasLimit ? limitValue - totalExpense : 0;
  const isBudgetOnTrack = remainingBudget >= 0;
  const budgetDeltaText = hasLimit
    ? isBudgetOnTrack
      ? `${formatCurrency(remainingBudget, currency)} left`
      : `${formatCurrency(Math.abs(remainingBudget), currency)} over`
    : '';
  const statusBackgroundColor = hasLimit
    ? isBudgetOnTrack
      ? 'rgba(161, 250, 255, 0.15)'
      : 'rgba(255, 107, 107, 0.14)'
    : 'rgba(255, 255, 255, 0.08)';
  const statusColor = hasLimit
    ? isBudgetOnTrack
      ? colors.accent
      : colors.error
    : colors.subText;
  const statusLabel = hasLimit
    ? isBudgetOnTrack
      ? 'Safe Velocity'
      : 'Over Velocity'
    : 'Set Limit';

  const insightCopy = useMemo(() => {
    const comparison =
      comparisonSentence.length > 0 ? ` ${comparisonSentence}` : '';
    if (!hasLimit) {
      return `Set a monthly limit to unlock pacing insights.${comparison}`;
    }
    if (isBudgetOnTrack) {
      return `You're pacing safely with ${formatCurrency(
        remainingBudget,
        currency,
      )} remaining.${comparison}`;
    }
    return `You've exceeded the budget by ${formatCurrency(
      Math.abs(remainingBudget),
      currency,
    )}.${comparison}`;
  }, [
    comparisonSentence,
    hasLimit,
    isBudgetOnTrack,
    remainingBudget,
    currency,
  ]);

  const closeLimitModal = () => {
    setIsLimitModalVisible(false);
  };

  const openLimitModal = useCallback(() => {
    withHaptic(() => {
      setIsLimitModalVisible(true);
    });
  }, []);

  const handleSaveMonthlyLimit = async (
    values: any,
    {resetForm}: FormikHelpers<any>,
  ) => {
    try {
      setLoading(true);
      const numericLimit = Number(values.limit);

      if (!numericLimit || Number.isNaN(numericLimit) || numericLimit <= 0) {
        Toast.show({
          type: 'error',
          text1: 'Enter a valid monthly limit',
        });
        setLoading(false);
        return;
      }

      if (monthLimit?.id) {
        await apiGateway.monthlyLimitService.updateMonthlyLimit({
          id: monthLimit.id,
          limit: numericLimit,
        });
        Toast.show({
          type: 'success',
          text1: 'Limit updated successfully',
        });
      } else {
        await apiGateway.monthlyLimitService.addMonthlyLimit({
          userId: user.userId,
          limit: numericLimit,
          month: (filterMonth.month() + 1) as Month,
          year: filterMonth.year() as Year,
        });
        Toast.show({
          type: 'success',
          text1: 'Limit added successfully',
        });
      }
      await getMonthlyLimit();
      closeLimitModal();
      resetForm();
    } catch (error) {
      console.log(error);
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <Text style={styles.headingLabel}>MONTHLY SPENDING</Text>

      <View style={styles.heroRow}>
        <View style={styles.totalValueColumn}>
          <Text
            style={styles.totalValueText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}>
            {formatCurrency(totalExpense, currency)}
          </Text>
        </View>
        {hasLimit ? (
          <View style={styles.progressWrapper}>
            <CircularProgress
              progress={clampedProgress}
              progressColor={progressColor}
              size={60}
              strokeWidth={5}
              trackColor="rgba(255,255,255,0.08)"
              label={progressLabel}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.subHeroRow}>
        <View style={styles.trendBadge}>
          <MaterialCommunityIcons
            name={trendSnapshot.icon}
            size={14}
            color={trendSnapshot.color}
          />
          <Text
            style={[styles.trendBadgeText, {color: trendSnapshot.color}]}
            numberOfLines={1}>
            {trendSnapshot.label}
          </Text>
        </View>
        <View
          style={[styles.statusPill, {backgroundColor: statusBackgroundColor}]}>
          <View style={[styles.statusDot, {backgroundColor: statusColor}]} />
          <Text style={[styles.statusText, {color: statusColor}]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.helperText}>{insightCopy}</Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricSquareCard}>
          <MaterialCommunityIcons
            name="target"
            size={18}
            color={colors.primary}
            style={styles.metricIcon}
          />
          <Text style={styles.metricLabelCard}>Target Limit</Text>
          <View style={styles.targetValueRow}>
            <Text
              style={styles.metricLabelValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}>
              {limitValue
                ? formatCurrency(limitValue, currency, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                : 'Set Limit'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editLink}
            onPress={openLimitModal}>
            <Text style={styles.editLinkText}>
              {limitValue ? 'Tap to edit limit' : 'Tap to set limit'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricSquareCard}>
          <MaterialCommunityIcons
            name="chart-bell-curve-cumulative"
            size={18}
            color={colors.accent}
            style={styles.metricIcon}
          />
          <Text style={styles.metricLabelCard}>Daily Avg</Text>
          <Text style={styles.metricLabelValue}>
            {formatCurrency(
              totalExpense / Math.max(dayjs().date(), 1),
              currency,
              {minimumFractionDigits: 0, maximumFractionDigits: 0},
            )}
          </Text>
        </View>
      </View>

      <Formik
        enableReinitialize={true}
        initialValues={{
          [EMonthlyLimitFields.LIMIT]: limitValue
            ? formatNumber(limitValue, {
                maximumFractionDigits: 2,
                useGrouping: false,
              })
            : '',
        }}
        onSubmit={handleSaveMonthlyLimit}>
        {({handleSubmit, values, resetForm}) => {
          return (
            <FormModal
              isVisible={isLimitModalVisible}
              title={limitValue ? 'Adjust Monthly Limit' : 'Set Monthly Limit'}
              onClose={() => {
                closeLimitModal();
                resetForm();
              }}
              onSave={handleSubmit}
              loading={loading}>
              <View style={styles.limitForm}>
                <FormikTextInput
                  name={EMonthlyLimitFields.LIMIT}
                  mode="outlined"
                  label="Monthly limit"
                  keyboardType="numeric"
                  value={values[EMonthlyLimitFields.LIMIT] || ''}
                />
              </View>
            </FormModal>
          );
        }}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    marginBottom: 16,
  },
  headingLabel: {
    color: colors.primary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 8,
  },
  totalValueColumn: {
    flex: 1,
    minWidth: 0,
  },
  totalValueText: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '800',
    fontFamily: 'Manrope',
    letterSpacing: -2,
    lineHeight: 60,
    flexShrink: 1,
    includeFontPadding: false,
  },
  progressWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  progressCaption: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressSubLabel: {
    color: colors.subText,
    fontSize: 11,
  },
  subHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendBadgeText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: '#e0e0e0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  insightCard: {
    borderRadius: 24,
    marginBottom: 16,
    backgroundColor: '#16191d',
    padding: 20,
  },
  helperText: {
    color: '#656b73',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metricSquareCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#16191d',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  metricIcon: {
    marginBottom: 12,
  },
  metricLabelCard: {
    color: '#4f555c',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  targetValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricLabelValue: {
    color: '#bdc1c6',
    fontSize: 22,
    fontWeight: '400',
    fontFamily: 'Manrope',
    flex: 1,
    minWidth: 0,
  },
  editLink: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  editLinkText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  limitForm: {
    gap: 12,
  },
});

export default React.memo(ExpenseSummary);
