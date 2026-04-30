import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
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
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

const styles = StyleSheet.create({
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
