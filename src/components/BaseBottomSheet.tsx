import React from 'react';
import {StyleSheet, View, Platform, TouchableOpacity, Dimensions, Pressable, KeyboardAvoidingView} from 'react-native';
import Modal from 'react-native-modal';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
          {Platform.OS === 'ios' ? (
            <KeyboardAvoidingView
              behavior="padding"
              style={{ flex: 1, justifyContent: 'flex-end' }}
              pointerEvents="box-none"
            >
              <View style={styles.contentWrapper}>
                <View style={styles.indicatorWrapper}>
                  <View style={styles.indicator} />
                </View>
                <KeyboardAwareScrollView
                  enableOnAndroid={true}
                  keyboardShouldPersistTaps="handled"
                  extraScrollHeight={0}
                  enableAutomaticScroll={true}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  <Pressable 
                    onPress={() => {}} 
                    style={{flex: 1}} 
                    accessible={false}
                  >
                    {children}
                  </Pressable>
                </KeyboardAwareScrollView>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <View style={styles.contentWrapper}>
                <View style={styles.indicatorWrapper}>
                  <View style={styles.indicator} />
                </View>
                <KeyboardAwareScrollView
                  enableOnAndroid={true}
                  keyboardShouldPersistTaps="handled"
                  extraScrollHeight={40}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  <Pressable 
                    onPress={() => {}} 
                    style={{flex: 1}} 
                    accessible={false}
                  >
                    {children}
                  </Pressable>
                </KeyboardAwareScrollView>
              </View>
            </View>
          )}
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
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  contentWrapper: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    maxHeight: SCREEN_HEIGHT * 0.9,
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
    paddingBottom: 120,
    flexGrow: 1,
  },
});

export default BaseBottomSheet;
