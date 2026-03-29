import {View, StyleSheet} from 'react-native';
import React from 'react';
import {Text} from 'react-native-paper';
import {colors} from '@trackingPortal/themes/colors';

interface IValueWithLabel {
  label: string;
  value: string | number;
  error?: boolean;
}

const ValueWithLabel: React.FC<IValueWithLabel> = ({label, value, error}) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, error && styles.error]}>{label}</Text>
      <Text style={[styles.value, error && styles.error]}>{value}</Text>
    </View>
  );
};

export default ValueWithLabel;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    color: colors.subText,
    fontSize: 14,
    letterSpacing: 0.4,
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
  },
});
