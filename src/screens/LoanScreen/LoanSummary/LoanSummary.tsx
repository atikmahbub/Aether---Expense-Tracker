import {View, StyleSheet} from 'react-native';
import React from 'react';
import {Text} from 'react-native-paper';
import {GlassCard} from '@trackingPortal/components';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {formatCurrency} from '@trackingPortal/utils/utils';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {colors} from '@trackingPortal/themes/colors';

interface ISummary {
  totalGiven: number;
  totalBorrowed: number;
}

const LoanSummary: React.FC<ISummary> = ({
  totalGiven = 0,
  totalBorrowed = 0,
}) => {
  const {currency} = useStoreContext();
  const netPosition = totalGiven - totalBorrowed;
  return (
    <View style={styles.mainContainer}>
      <Text style={styles.headingLabel}>NET POSITION</Text>
      
      <View style={styles.heroRow}>
        <View style={styles.totalValueColumn}>
          <Text
            style={styles.totalValueText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}>
            {formatCurrency(Math.abs(netPosition), currency)}
          </Text>
        </View>
      </View>
      
      <View style={styles.subHeroRow}>
        <View style={styles.statusPillBox}>
          <View
            style={[
              styles.netPill,
              netPosition >= 0 ? styles.netPositive : styles.netNegative,
            ]}>
            <View style={[styles.statusDot, {backgroundColor: netPosition >= 0 ? '#b6f700' : '#ff4d4f'}]} />
            <Text style={[styles.netPillText, netPosition >= 0 ? {color: '#b6f700'} : {color: '#ff4d4f'}]}>
              {netPosition >= 0 ? 'IN CREDIT STATUS' : 'OWED STATUS'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.helperText}>
          Track your lent assets vs active borrowing. Keep your net position in the green.
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricSquareCard}>
          <View style={styles.iconBoxGiven}>
            <MaterialCommunityIcons name="arrow-top-right" size={16} color="#a1faff" />
          </View>
          <Text style={styles.metricLabelCard}>Total Given</Text>
          <Text style={styles.metricLabelValue}>
            {formatCurrency(totalGiven, currency)}
          </Text>
        </View>
        
        <View style={styles.metricSquareCard}>
          <View style={styles.iconBoxTaken}>
            <MaterialCommunityIcons name="arrow-bottom-left" size={16} color="#ff8e8b" />
          </View>
          <Text style={styles.metricLabelCard}>Total Borrowed</Text>
          <Text style={styles.metricLabelValue}>
            {formatCurrency(totalBorrowed, currency)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default LoanSummary;

const styles = StyleSheet.create({
  mainContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
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
    alignItems: 'baseline',
    gap: 8,
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
  subHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statusPillBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  netPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  netPositive: {
    backgroundColor: 'rgba(182, 247, 0, 0.08)',
  },
  netNegative: {
    backgroundColor: 'rgba(255, 77, 79, 0.08)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  netPillText: {
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
  iconBoxGiven: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(161, 250, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconBoxTaken: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 142, 139, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
