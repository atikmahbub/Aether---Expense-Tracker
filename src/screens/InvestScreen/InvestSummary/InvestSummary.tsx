import {View, StyleSheet} from 'react-native';
import React from 'react';
import {Text} from 'react-native-paper';
import {formatCurrency, formatNumber} from '@trackingPortal/utils/utils';
import {InvestModel} from '@trackingPortal/api/models';
import {EInvestStatus} from '@trackingPortal/api/enums';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {colors} from '@trackingPortal/themes/colors';
import { CommonCard, StatCard } from '@trackingPortal/components';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ISummary {
  investList: InvestModel[];
  status: EInvestStatus;
}

const InvestSummary: React.FC<ISummary> = ({investList, status}) => {
  const isActive = status === EInvestStatus.Active;
  const {currency} = useStoreContext();

  const totalItems = investList.length;
  const totalAmountInvested = investList.reduce(
    (acc, crr) => acc + crr.amount,
    0,
  );

  const totalActiveAmount = isActive ? totalAmountInvested : 0;
  const totalCompletedAmount = !isActive ? totalAmountInvested : 0;

  const totalProfit = !isActive
    ? investList.reduce((acc, crr) => {
        if (!crr.earned) {
          return acc;
        }
        return acc + ((crr.earned - crr.amount) / crr.amount) * 100;
      }, 0)
    : 0;

  const averageReturn =
    !isActive && totalItems > 0 ? totalProfit / totalItems : 0;

  const averageReturnLabel = formatNumber(
    !isActive ? averageReturn : 0,
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      suffix: '%',
    },
  );

  const assetClassCountLabel = formatNumber(
    Math.max(1, Math.min(investList.length, 9)),
    {
      minimumIntegerDigits: 2,
      maximumFractionDigits: 0,
      useGrouping: false,
    },
  );

  return (
    <View style={styles.mainContainer}>
      <CommonCard style={styles.heroCard} padding={24}>
        <View style={styles.headingRow}>
          <MaterialCommunityIcons name="chart-pie" size={14} color={colors.primary} />
          <Text style={styles.headingLabel}>INVESTMENT SNAPSHOT</Text>
        </View>
        <View style={styles.heroRow}>
          <View style={styles.totalValueColumn}>
            <Text
              style={styles.totalValueText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}>
              {formatCurrency(
                isActive ? totalActiveAmount : totalCompletedAmount,
                currency,
              )}
            </Text>
          </View>
        </View>
      </CommonCard>

      <View style={styles.metricsRow}>
        <StatCard 
          icon="chart-line-variant" 
          label="Annualized Return" 
          value={averageReturnLabel} 
        />

        <StatCard 
          icon="wallet-outline" 
          label="Asset Classes" 
          value={assetClassCountLabel} 
        />
      </View>
    </View>
  );
};

export default InvestSummary;

const styles = StyleSheet.create({
  mainContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  heroCard: {
    marginBottom: 20,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  headingLabel: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
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
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
