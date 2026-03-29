import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from 'react-native-paper';

import {darkTheme} from '@trackingPortal/themes/darkTheme';
import {CustomAppBar} from '@trackingPortal/components';

const TAB_CONTENT_BOTTOM_PADDING = 96;

type Props = {
  children: React.ReactNode;
};

const TabScreenContainer: React.FC<Props> = ({children}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor: darkTheme.colors.background,
          paddingTop: insets.top,
        },
      ]}>
      <CustomAppBar />
      <View
        style={[styles.content, {backgroundColor: theme.colors.background}]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: TAB_CONTENT_BOTTOM_PADDING,
  },
});

export default React.memo(TabScreenContainer);
export {TAB_CONTENT_BOTTOM_PADDING};
