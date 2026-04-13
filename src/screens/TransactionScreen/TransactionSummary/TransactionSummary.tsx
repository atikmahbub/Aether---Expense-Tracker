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
import {EMonthlyLimitFields} from '@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.constants';
import Toast from 'react-native-toast-message';
import {Month, Year, UnixTimeStampString} from '@trackingPortal/api/primitives';
import {withHaptic} from '@trackingPortal/utils/haptic';
import {colors} from '@trackingPortal/themes/colors';

interface ISummary {
  totalValue: number;
  type: 'expense' | 'income';
  monthlyIncome: number;
  filterMonth: Dayjs;
  monthLimit: MonthlyLimitModel;
  getMonthlyLimit: () => void;
  isLoading?: boolean;
}

const TransactionSummary: React.FC<ISummary> = ({
  totalValue,
  type,
  monthlyIncome,
  filterMonth,
  monthLimit,
  getMonthlyLimit,
  isLoading,
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
  const hasLimit = type === 'expense' && limitValue > 0;
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
        const response = await apiGateway.transactionService.getTransactionsByUser({
          userId: user.userId,
          date: previousMonthDate.unix() as unknown as UnixTimeStampString,
          type,
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
  }, [apiGateway, user.userId, previousMonthKey, previousMonthDate, type]);




  const progressRatio = hasLimit ? totalValue / limitValue : 0;
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
      <Text style={styles.headingLabel}>
        {type === 'expense' ? 'MONTHLY SPENDING' : 'MONTHLY INCOME'}
      </Text>

      <View style={styles.heroRow}>
        <View style={styles.totalValueColumn}>
            <Text
              style={styles.totalValueText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}>
              {isLoading ? "…" : formatCurrency(totalValue, currency)}
            </Text>
            <Text style={styles.earnedText}>
              {formatCurrency(monthlyIncome, currency, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}{' '}
              {type === 'expense' ? 'earned this month' : 'expensed this month'}
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



      {type === 'expense' && (
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
                  : 'No Limit'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editLink}
              onPress={() => setIsLimitModalVisible(true)}>
              <Text style={styles.editLinkText}>
                {limitValue ? 'Adjust' : 'Set Limit'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metricSquareCard}>
            <MaterialCommunityIcons
              name="chart-line"
              size={18}
              color="#4ADE80"
              style={styles.metricIcon}
            />
            <Text style={styles.metricLabelCard}>Daily Avg</Text>
            <Text style={styles.metricLabelValue}>
              {formatCurrency(
                totalValue / Math.max(dayjs().date(), 1),
                currency,
                {minimumFractionDigits: 0, maximumFractionDigits: 0},
              )}
            </Text>
          </View>
        </View>
      )}

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
    marginBottom: 2,
  },
  earnedText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
    marginTop: 2,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
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
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(161, 250, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(161, 250, 255, 0.15)',
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

export default React.memo(TransactionSummary);
