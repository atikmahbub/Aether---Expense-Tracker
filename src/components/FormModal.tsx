import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LoadingButton from '@trackingPortal/components/LoadingButton';
import {colors} from '@trackingPortal/themes/colors';

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
  const dismissKeyboard = () => Keyboard.dismiss();

  const handleClose = () => {
    dismissKeyboard();
    onClose();
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={isVisible}
      onRequestClose={handleClose}
      statusBarTranslucent>
      <View style={styles.modalRoot}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}>
          <View style={styles.modalContent}>
              <View style={styles.indicatorWrapper}>
                <View style={styles.indicator} />
              </View>
              <View>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                contentContainerStyle={styles.scrollView}>
                {children}
              </ScrollView>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    dismissKeyboard();
                    onClose();
                  }}>
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
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default FormModal;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  indicatorWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  indicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  modalContent: {
    backgroundColor: colors.overlay,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: {width: 0, height: -12},
    maxHeight: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.4,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 13,
    color: colors.subText,
    marginTop: 4,
    marginBottom: 16,
  },
  scrollView: {
    paddingBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.surface,
  },
  buttonText: {
    color: colors.subText,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
