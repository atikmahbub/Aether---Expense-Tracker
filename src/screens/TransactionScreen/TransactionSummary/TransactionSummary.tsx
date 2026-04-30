import {View, StyleSheet, InteractionManager, Animated} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import React, {useState, useMemo, useCallback, useEffect, useRef} from 'react';
import {Text} from 'react-native-paper';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
import {FormikTextInput} from '@trackingPortal/components';
import FormModal from '@trackingPortal/components/FormModal';
import dayjs, {Dayjs} from 'dayjs';
import {MonthlyLimitModel} from '@trackingPortal/api/models';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {formatCurrency, formatNumber} from '@trackingPortal/utils/utils';
import {Formik, FormikHelpers} from 'formik';
import {EMonthlyLimitFields} from '@trackingPortal/screens/TransactionScreen/TransactionCreation/TransactionCreation.constants';
import Toast from 'react-native-toast-message';
import {Month, Year} from '@trackingPortal/api/primitives';
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
  
  const progressLabel = hasLimit
    ? formatNumber(Math.min(progressRatio * 100, 999), {
        minimumFractionDigits: 0,
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

  const progressColor = useMemo(() => {
    return progressRatio > 1 ? colors.error : colors.primary;
  }, [progressRatio]);

  const statusBgColor = useMemo(() => {
    return progressRatio > 1 ? colors.errorSoft : colors.primarySoft;
  }, [progressRatio]);



  return (
    <View style={styles.mainContainer}>
      <CommonCard 
        style={styles.heroCard} 
        padding={20}
      >
        <View style={styles.topSection}>
          <View style={styles.headerRow}>
            <View style={styles.headingRow}>
              <MaterialCommunityIcons 
                name={type === 'expense' ? "wallet-outline" : "bank-outline"} 
                size={16} 
                color={colors.primary} 
              />
              <Text style={styles.headingLabel}>
                {type === 'expense' ? 'MONTHLY SPENDING' : 'MONTHLY INCOME'}
              </Text>
            </View>

            {hasLimit && (
              <View style={[styles.percentageContainer, { backgroundColor: statusBgColor }]}>
                <Text style={styles.percentageSub}>
                  {progressRatio > 1 ? 'Over limit' : 'Within limit'}
                  {'  •  '}
                  <Text style={[styles.percentageInline, { color: progressColor }]}>
                    {progressLabel}
                  </Text>
                </Text>
              </View>
            )}
          </View>
  
          <View style={styles.amountRow}>
            <View style={styles.amountContainer}>
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
                {type === 'expense' ? 'earned this month' : 'spent this month'}
              </Text>
            </View>
          </View>
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
                  autoFocus={true}
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
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headingLabel: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
  },
  topSection: {
    // No margin bottom needed as bottom section is removed
  },
  amountRow: {
    marginTop: 8, // Reduced gap from header
  },
  amountContainer: {
    width: '100%',
  },
  totalValueText: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '800',
    fontFamily: 'Manrope',
    letterSpacing: -2.5,
    includeFontPadding: false,
    flexShrink: 1,
  },
  earnedText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  percentageContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageInline: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Manrope',
  },
  percentageSub: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  limitForm: {
    gap: 12,
  },
});

export default React.memo(TransactionSummary);
