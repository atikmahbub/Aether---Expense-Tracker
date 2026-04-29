import {View, StyleSheet, TouchableOpacity, InteractionManager} from 'react-native';
import React, {useState, useMemo, useEffect, useCallback} from 'react';
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
import { CommonCard, StatCard } from '@trackingPortal/components';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const {currency} = useStoreContext();
  const [loading, setLoading] = useState<boolean>(false);

  const limitValue = monthLimit?.limit ?? 0;
  const hasLimit = type === 'expense' && limitValue > 0;





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
      <CommonCard style={styles.heroCard}>
        <View style={styles.headingRow}>
          <MaterialCommunityIcons 
            name={type === 'expense' ? "wallet-outline" : "bank-outline"} 
            size={14} 
            color={colors.primary} 
          />
          <Text style={styles.headingLabel}>
            {type === 'expense' ? 'MONTHLY SPENDING' : 'MONTHLY INCOME'}
          </Text>
        </View>

        <View style={styles.heroRow}>
          <View style={styles.totalValueColumn}>
              <Text
                style={styles.totalValueText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}>
                {isLoading ? "…" : formatCurrency(totalValue, currency)}
              </Text>
              <Text style={[styles.earnedText, { color: type === 'expense' ? colors.success : colors.error, opacity: 1 }]}>
                {formatCurrency(monthlyIncome, currency, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{' '}
                {type === 'expense' ? 'earned this month' : 'spent this month'}
              </Text>

          </View>
          {hasLimit ? (
            <View style={styles.progressWrapper}>
              <CircularProgress
                progress={clampedProgress}
                progressColor={progressColor}
                size={80}
                strokeWidth={6}
                trackColor="rgba(255,255,255,0.08)"
                label={progressLabel}
              />
            </View>
          ) : null}
        </View>
      </CommonCard>

      {type === 'expense' && (
        <View style={styles.metricsRow}>
          <StatCard 
            icon="target" 
            label="Target Limit" 
            onPress={openLimitModal}
            value={limitValue
              ? formatCurrency(limitValue, currency, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              : 'No Limit'}
          />

          <StatCard 
            icon="chart-line" 
            label="Daily Avg" 
            value={formatCurrency(
              totalValue / Math.max(dayjs().date(), 1),
              currency,
              {minimumFractionDigits: 0, maximumFractionDigits: 0},
            )}
          />
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
    paddingTop: 20,
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 20,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  headingLabel: {
    color: colors.subText,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '600',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
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
    gap: 12,
  },
  metricSquareCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  metricIconWrapper: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 10,
  },
  metricLabelCard: {
    color: colors.subText,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  targetValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricLabelValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Manrope',
    flex: 1,
    minWidth: 0,
  },
  editLink: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.2)',
  },
  editLinkText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  limitForm: {
    gap: 12,
  },
});

export default React.memo(TransactionSummary);
