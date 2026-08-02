import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import LoadingButton from '@trackingPortal/components/LoadingButton';
import { useAppTheme } from '@trackingPortal/contexts/ThemeContext';
import useKeyboardHeight from '@trackingPortal/hooks/useKeyboardHeight';

interface IFormModal {
  isVisible: boolean;
  title: string;
  subtitle?: string;
  saveLabel?: string;
  onClose: () => void;
  onSave: () => void;
  loading?: boolean;
  children: React.ReactNode;
}

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const FormModal: React.FC<IFormModal> = ({
  isVisible,
  title,
  subtitle,
  saveLabel,
  onClose,
  onSave,
  loading,
  children,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Android only: edge-to-edge (Expo SDK 54+) stops the window from resizing
  // for the keyboard on Android 15+, so the card is lifted manually instead.
  const keyboardHeight = useKeyboardHeight();
  const [rootHeight, setRootHeight] = useState(0);

  const onRootLayout = useCallback((event: LayoutChangeEvent) => {
    setRootHeight(event.nativeEvent.layout.height);
  }, []);

  // Older Android versions still resize the window for the IME; detect that by
  // the shrunken root height so the card isn't pushed up twice.
  const windowResized =
    rootHeight > 0 &&
    rootHeight < Dimensions.get('screen').height - keyboardHeight * 0.6;
  const lift =
    Platform.OS === 'android' && keyboardHeight > 0 && !windowResized
      ? keyboardHeight
      : 0;

  const dismissKeyboard = () => Keyboard.dismiss();

  const handleClose = () => {
    dismissKeyboard();
    onClose();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isVisible}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View
          style={[styles.modalOverlay, lift > 0 && {paddingBottom: lift}]}
          onLayout={onRootLayout}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              <View style={styles.floatingCard}>
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>

                <View style={styles.formContainer}>
                  {children}
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <LoadingButton
                    label={saveLabel || 'Save'}
                    loading={!!loading}
                    onPress={() => {
                      dismissKeyboard();
                      onSave();
                    }}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default FormModal;

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    keyboardView: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    floatingCard: {
      width: SCREEN_WIDTH * 0.9,
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.4,
    },
    subtitle: {
      fontSize: 13,
      color: colors.subText,
      marginTop: 6,
    },
    formContainer: {
      marginBottom: 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 12,
    },
    cancelButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    buttonText: {
      color: colors.subText,
      fontWeight: '600',
      fontSize: 15,
    },
  });
}
