import React from 'react';
import {View, StyleSheet, Image, ScrollView} from 'react-native';
import {Text} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {useAuth} from '@trackingPortal/auth/Auth0ProviderWithHistory';
import {AnimatedLoader} from '@trackingPortal/components';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import {colors} from '@trackingPortal/themes/colors';
import Toast from 'react-native-toast-message';
import {
  Alert,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView as RNScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';

const AVATAR_SIZE = 120;
const DEFAULT_AVATAR =
  'https://api.dicebear.com/7.x/avataaars/png?seed=Aether&backgroundColor=transparent';

const ProfileScreen: React.FC = () => {
  const {logout, user, loading} = useAuth();
  const {currentUser, apiGateway} = useStoreContext();
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (loading) {
    return <AnimatedLoader />;
  }

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

  const displayName = user?.name ?? 'Aether Explorer';
  const displayEmail = user?.email ?? 'hello@aether.finance';
  const avatarSource = user?.picture || user?.profilePicture || DEFAULT_AVATAR;
  const firstName = displayName.split(' ')[0] || 'there';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.avatarWrapper}>
          <Image source={{uri: avatarSource}} style={styles.avatar} />
        </View>
        <Text style={styles.greeting}>Hey, {firstName} 👋</Text>
        <Text style={styles.caption}>
          Welcome back to your financial sanctuary.
        </Text>
      </View>

      <Text style={styles.sectionHeader}>ACCOUNT DETAILS</Text>
      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <MaterialCommunityIcons
              name="account-outline"
              size={20}
              color={colors.text}
            />
          </View>
          <View style={styles.detailTextCol}>
            <Text style={styles.detailLabel}>FULL NAME</Text>
            <Text style={styles.detailValue}>{displayName}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color={colors.text}
            />
          </View>
          <View style={styles.detailTextCol}>
            <Text style={styles.detailLabel}>EMAIL ADDRESS</Text>
            <Text style={styles.detailValue}>{displayEmail}</Text>
          </View>
        </View>
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
            <RNScrollView 
              contentContainerStyle={styles.modalScrollContent}
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
                  disabled={isDeleting}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </RNScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 24,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(161, 250, 255, 0.08)',
    top: -30,
  },
  avatarWrapper: {
    width: AVATAR_SIZE + 16,
    height: AVATAR_SIZE + 16,
    borderRadius: (AVATAR_SIZE + 16) / 2,
    padding: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.surface,
  },
  greeting: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  caption: {
    color: colors.subText,
    fontSize: 14,
    textAlign: 'center',
  },
  sectionHeader: {
    width: '100%',
    color: '#a0aab5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  detailCard: {
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 28,
    padding: 24,
    gap: 18,
    shadowColor: colors.overlay,
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 16},
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    color: '#8a929a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginBottom: 4,
  },
  detailValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'left',
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    opacity: 0.4,
  },
  dangerZoneHeader: {
    width: '100%',
    color: '#8a929a',
    marginTop: 40,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dangerSimpleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  dangerSimpleTextCol: {
    gap: 4,
  },
  dangerSimpleLabel: {
    color: '#ff8e8b',
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.8,
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
  modalScrollContent: {
    flexGrow: 1,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalMessage: {
    color: colors.subText,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
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
  deleteButtonDisabled: {
    opacity: 0.5,
  },
});

export default ProfileScreen;
