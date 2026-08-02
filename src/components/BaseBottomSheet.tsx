import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  Dimensions,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
  LayoutChangeEvent,
} from 'react-native';
import Modal from 'react-native-modal';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import useKeyboardHeight from '@trackingPortal/hooks/useKeyboardHeight';
import { designTokens } from '@trackingPortal/themes/designTokens';

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
      const { colors } = useAppTheme();
      const styles = useMemo(() => makeStyles(colors), [colors]);
      const isVisible = index >= 0;

      // Android only: with edge-to-edge (Expo SDK 54+) the window is no longer
      // resized for the keyboard on Android 15+, so the sheet has to be lifted
      // by the IME height manually.
      const keyboardHeight = useKeyboardHeight();
      const [rootHeight, setRootHeight] = useState(0);

      const onRootLayout = useCallback((event: LayoutChangeEvent) => {
        setRootHeight(event.nativeEvent.layout.height);
      }, []);

      // Older Android versions still resize the window for the IME; detect that
      // by the shrunken root height so the sheet isn't pushed up twice.
      const windowResized =
        rootHeight > 0 &&
        rootHeight < Dimensions.get('screen').height - keyboardHeight * 0.6;
      const lift = keyboardHeight > 0 && !windowResized ? keyboardHeight : 0;
      const availableHeight = (rootHeight || SCREEN_HEIGHT) - lift;

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
          backdropColor={colors.backdrop}
          backdropTransitionOutTiming={0}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          animationInTiming={designTokens.motion.standard}
          animationOutTiming={designTokens.motion.standard}
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
                    onPress={Keyboard.dismiss}
                    style={{flex: 1}}
                    accessible={false}
                  >
                    {children}
                  </Pressable>
                </KeyboardAwareScrollView>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <View
              style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: lift }}
              onLayout={onRootLayout}
            >
              <View
                style={[
                  styles.contentWrapper,
                  {
                    maxHeight: Math.min(
                      SCREEN_HEIGHT * 0.94,
                      Math.max(availableHeight, 0),
                    ),
                  },
                ]}
              >
                <View style={styles.indicatorWrapper}>
                  <View style={styles.indicator} />
                </View>
                {/* enableOnAndroid is off: it pads the content by the keyboard
                    height, which would stack on top of the lift above. */}
                <KeyboardAwareScrollView
                  enableOnAndroid={false}
                  keyboardShouldPersistTaps="handled"
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

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
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
      backgroundColor: colors.bg,
      borderTopLeftRadius: designTokens.radius.lg,
      borderTopRightRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: SCREEN_HEIGHT * 0.94,
      paddingTop: 6,
    },
    indicatorWrapper: {
      alignItems: 'center',
      paddingTop: 4,
      paddingBottom: 10,
    },
    indicator: {
      backgroundColor: colors.borderStrong,
      width: 40,
      height: 4,
      borderRadius: 2,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 18,
      flexGrow: 1,
    },
  });
}

export default BaseBottomSheet;
