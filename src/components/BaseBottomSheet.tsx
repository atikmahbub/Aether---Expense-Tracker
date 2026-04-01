import React from 'react';
import {StyleSheet, View, Platform, TouchableOpacity, Dimensions, KeyboardAvoidingView, ScrollView} from 'react-native';
import Modal from 'react-native-modal';
import {colors} from '@trackingPortal/themes/colors';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

interface BaseBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  index?: number;
  onClose?: () => void;
  enablePanDownToClose?: boolean;
}

const BaseBottomSheet = React.memo(
  React.forwardRef<any, BaseBottomSheetProps>(
    (
      {
        children,
        snapPoints,
        index = -1,
        onClose,
        enablePanDownToClose = true,
      },
      _ref,
    ) => {
      const isVisible = index >= 0;

      return (
        <Modal
          isVisible={isVisible}
          onBackdropPress={onClose}
          onBackButtonPress={onClose}
          onSwipeComplete={onClose}
          swipeDirection={enablePanDownToClose ? ['down'] : undefined}
          propagateSwipe={true}
          style={styles.modal}
          backdropOpacity={0.5}
          backdropTransitionOutTiming={0}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          animationInTiming={300}
          animationOutTiming={300}
          useNativeDriver={true}
          statusBarTranslucent
          deviceHeight={SCREEN_HEIGHT}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            style={styles.keyboardView}
          >
            <View style={styles.contentWrapper}>
              <View style={styles.indicatorWrapper}>
                <View style={styles.indicator} />
              </View>
              <ScrollView 
                bounces={false} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                {children}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      );
    },
  ),
);

// @ts-ignore
BaseBottomSheet.displayName = 'BaseBottomSheet';

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  contentWrapper: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    minHeight: SCREEN_HEIGHT * 0.6,
    maxHeight: SCREEN_HEIGHT * 0.92,
    paddingTop: 8,
  },
  indicatorWrapper: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  indicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 30,
  },
});

export default BaseBottomSheet;
