import React from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import {colors} from '@trackingPortal/themes/colors';

interface LayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<LayoutProps> = ({children}) => {
  return (
    <View style={styles.container}>
      <View style={styles.navigationContent}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  navigationContent: {
    flex: 1,
  },
});

export default AppLayout;
