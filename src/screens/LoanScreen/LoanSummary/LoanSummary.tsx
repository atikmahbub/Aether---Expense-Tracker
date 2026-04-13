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
