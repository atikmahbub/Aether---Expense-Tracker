import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  InteractionManager,
  Linking,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TextInput,
} from 'react-native';
import React, {useCallback, useState} from 'react';
import {Text} from 'react-native-paper';
import {useAuth} from '@trackingPortal/auth/Auth0ProviderWithHistory';
import {AnimatedLoader} from '@trackingPortal/components';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {colors} from '@trackingPortal/themes/colors';
import {SUPPORTED_CURRENCIES} from '@trackingPortal/constants/currency';
import Toast from 'react-native-toast-message';

export default function SettingsScreen() {
  const {logout, loading} = useAuth();
  const {currency, setCurrencyPreference, currentUser, apiGateway} = useStoreContext();
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const openCurrencyModal = useCallback(() => {
    InteractionManager.runAfterInteractions(() =>
      setCurrencyModalVisible(true),
    );
  }, []);

  const handlePrivacyPolicy = async () => {
    const url = 'https://atikmahbub.github.io/aether-privacy-policy/';
    try {
      await Linking.openURL(url);
    } catch {
      Toast.show({ type: "error", text1: "Failed to open link" });
    }
  };

  const handleInitialDeleteTap = () => {
    Alert.alert(
      "Delete Account?",
      "Are you sure you want to proceed with account deletion? This will erase all your data.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Proceed", 
          style: "destructive", 
          onPress: () => {
            setDeleteConfirmationText('');
            setDeleteModalVisible(true);
          } 
        }
      ]
    );
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await apiGateway.userService.deleteUser(currentUser.userId);
      Toast.show({ type: "success", text1: "Account deleted successfully" });
      setDeleteModalVisible(false);
      await logout();
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to delete account" });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <AnimatedLoader />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>PREFERENCES</Text>
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.selectorRow}
          activeOpacity={0.85}
          onPress={openCurrencyModal}>
          <View style={styles.selectorRowContent}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name='cash-multiple'
                size={20}
                color={colors.text}
              />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>CURRENCY</Text>
              <Text
                style={
                  styles.detailValue
                }>{`${currency.symbol} ${currency.code}`}</Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name='chevron-right'
            size={22}
            color='#4f555c'
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>ACCOUNT</Text>
      <TouchableOpacity
        style={styles.actionButton}
        activeOpacity={0.8}
        onPress={() => logout()}>
        <View style={styles.actionLeft}>
          <View style={styles.actionIconWrapper}>
            <MaterialCommunityIcons name="logout" size={20} color={colors.text} />
          </View>
          <View>
            <Text style={styles.actionLabel}>Log out</Text>
            <Text style={styles.actionHint}>Logout from current device</Text>
          </View>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="#4f555c"
        />
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>ABOUT</Text>
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.selectorRow}
          activeOpacity={0.85}
          onPress={handlePrivacyPolicy}>
          <View style={styles.selectorRowContent}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name='shield-account-outline'
                size={20}
                color={colors.text}
              />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>LEGAL</Text>
              <Text style={styles.detailValue}>Privacy Policy</Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name='open-in-new'
            size={22}
            color='#4f555c'
          />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionHeader, styles.dangerZoneHeader]}>DANGER ZONE</Text>
      <TouchableOpacity
        style={styles.dangerSimpleRow}
        activeOpacity={0.8}
        onPress={handleInitialDeleteTap}>
        <View style={styles.dangerSimpleTextCol}>
          <Text style={styles.dangerSimpleLabel}>Delete Account</Text>
          <Text style={styles.dangerSimpleHint}>This action cannot be undone</Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="#4f555c"
        />
      </TouchableOpacity>

      <Modal
        visible={currencyModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setCurrencyModalVisible(false)}>
        <TouchableWithoutFeedback
          onPress={() => setCurrencyModalVisible(false)}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Choose Currency</Text>
          {SUPPORTED_CURRENCIES.map(option => {
            const selected = option.code === currency.code;
            return (
              <TouchableOpacity
                key={option.code}
                style={[
                  styles.currencyOption,
                  selected && styles.currencyOptionActive,
                ]}
                activeOpacity={0.85}
                onPress={async () => {
                  await setCurrencyPreference(option);
                  setCurrencyModalVisible(false);
                }}>
                <View style={styles.currencyOptionLeft}>
                  <View style={styles.currencySymbolBadge}>
                    <Text style={styles.currencySymbolText}>
                      {option.symbol}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.currencyName}>{option.name}</Text>
                    <Text style={styles.currencyCode}>{option.code}</Text>
                  </View>
                </View>
                {selected ? (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color={colors.primary}
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => !isDeleting && setDeleteModalVisible(false)}>
        <TouchableWithoutFeedback
          onPress={() => {
            if (!isDeleting) {
              setDeleteModalVisible(false);
              Keyboard.dismiss();
            }
          }}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.keyboardAvoidingContainer}
          pointerEvents="box-none">
          <View style={styles.modalSheet}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Delete Account</Text>
              <Text style={styles.modalMessage}>
                This will permanently delete your account and all associated data. To confirm, please type DELETE below.
              </Text>
              <TextInput
                style={styles.deleteInput}
                placeholder="Type DELETE to confirm"
                placeholderTextColor="#4f555c"
                value={deleteConfirmationText}
                onChangeText={setDeleteConfirmationText}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isDeleting}
              />
              <View style={styles.modalButtonsGroup}>
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    styles.deleteButton,
                    deleteConfirmationText !== 'DELETE' && styles.deleteButtonDisabled
                  ]} 
                  onPress={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmationText !== 'DELETE'}>
                  {isDeleting ? (
                    <ActivityIndicator color={colors.text} />
                  ) : (
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setDeleteModalVisible(false);
                    Keyboard.dismiss();
                  }}
                  disabled={isDeleting}
                  hasTVPreferredFocus={true}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
    gap: 16,
  },
  sectionHeader: {
    color: '#a0aab5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 12,
  },
  cardContainer: {
    backgroundColor: '#16191d',
    borderRadius: 28,
    padding: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextCol: {
    flex: 1,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectorRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  detailLabel: {
    color: '#8a929a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: '#16191d',
    borderRadius: 36,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  actionHint: {
    color: '#8a929a',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  dangerZoneHeader: {
    color: '#8a929a',
    marginTop: 36,
  },
  dangerSimpleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  dangerSimpleTextCol: {
    gap: 4,
  },
  dangerSimpleLabel: {
    color: '#ff8e8b',
    fontSize: 15,
    fontWeight: '600',
  },
  dangerSimpleHint: {
    color: '#8a929a',
    fontSize: 12,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  modalSheet: {
    backgroundColor: colors.overlay,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginTop: 'auto',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  deleteInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  modalMessage: {
    color: colors.subText,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtonsGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#ff8e8b',
  },
  deleteButtonText: {
    color: '#16191d',
    fontSize: 16,
    fontWeight: '800',
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  currencyOptionActive: {
    backgroundColor: 'rgba(161, 250, 255, 0.08)',
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  currencyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencySymbolBadge: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbolText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  currencyName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  currencyCode: {
    color: colors.subText,
    fontSize: 12,
    letterSpacing: 1,
  },
});
