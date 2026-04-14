import {View, StyleSheet} from 'react-native';
import React from 'react';
import {Text} from 'react-native-paper';
import {GlassCard} from '@trackingPortal/components';
import {formatCurrency, formatNumber} from '@trackingPortal/utils/utils';
import {InvestModel} from '@trackingPortal/api/models';
import {EInvestStatus} from '@trackingPortal/api/enums';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {colors} from '@trackingPortal/themes/colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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

  const totalActiveItem = isActive ? totalItems : 0;
  const totalActiveAmount = isActive ? totalAmountInvested : 0;

  const totalCompletedItem = !isActive ? totalItems : 0;
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

  const profitPercentLabel = formatNumber(
    !isActive ? totalProfit : 0,
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      suffix: '%',
    },
  );

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
      <Text style={styles.headingLabel}>INVESTMENT SNAPSHOT</Text>

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



      <View style={styles.metricsRow}>
        <GlassCard style={styles.metricSquareCard} padding={16}>
          <View style={styles.metricIconWrapChart}>
            <MaterialCommunityIcons
              name="chart-line-variant"
              size={18}
              color="#8cafff"
            />
          </View>
          <Text style={styles.metricLabelCard}>Annualized Return</Text>
          <Text style={styles.metricLabelValue}>{averageReturnLabel}</Text>
        </GlassCard>

        <GlassCard style={styles.metricSquareCard} padding={16}>
          <View style={styles.metricIconWrapWallet}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={18}
              color="#fca311"
            />
          </View>
          <Text style={styles.metricLabelCard}>Asset Classes</Text>
          <Text style={styles.metricLabelValue}>{assetClassCountLabel}</Text>
        </GlassCard>
      </View>
    </View>
  );
};

export default InvestSummary;

const styles = StyleSheet.create({
  mainContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  headingLabel: {
    color: '#8cafff',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  totalValueColumn: {
    flex: 1,
    minWidth: 0,
  },
  verticalBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 2,
    paddingVertical: 10,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  verticalBadgeText: {
    color: '#000',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    transform: [{rotate: '-90deg'}],
    width: 60,
    textAlign: 'center',
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
    gap: 16,
  },
  metricSquareCard: {
    flex: 1,
  },
  metricIconWrapChart: {
    marginBottom: 12,
  },
  metricIconWrapWallet: {
    marginBottom: 12,
  },
  metricLabelCard: {
    color: '#4f555c',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricLabelValue: {
    color: '#bdc1c6',
    fontSize: 22,
    fontWeight: '400',
    fontFamily: 'Manrope',
  },
});
