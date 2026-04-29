import {View, StyleSheet} from 'react-native';
import React from 'react';
import {Text} from 'react-native-paper';
import {formatCurrency} from '@trackingPortal/utils/utils';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {colors} from '@trackingPortal/themes/colors';
import { CommonCard, StatCard } from '@trackingPortal/components';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
      <CommonCard style={styles.heroCard} padding={24}>
        <View style={styles.headingRow}>
          <MaterialCommunityIcons name="scale-balance" size={14} color={colors.primary} />
          <Text style={styles.headingLabel}>NET POSITION</Text>
        </View>
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
      </CommonCard>
      

      <View style={styles.metricsRow}>
        <StatCard 
          icon="arrow-top-right" 
          label="Total Given" 
          value={formatCurrency(totalGiven, currency)} 
        />
        
        <StatCard 
          icon="arrow-bottom-left" 
          label="Total Borrowed" 
          value={formatCurrency(totalBorrowed, currency)} 
        />
      </View>
    </View>
  );
};

export default LoanSummary;

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
