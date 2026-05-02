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
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: 60 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.avatarWrapper}>
            <Image source={{uri: avatarSource}} style={styles.avatar} />
          </View>
          <Text style={styles.greeting}>Hey, {firstName}</Text>
          <Text style={styles.caption}>
            Manage your sanctuary and security settings.
          </Text>
        </View>

        <View style={styles.cardGroup}>
          <Text style={styles.sectionHeader}>Account Information</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, {backgroundColor: 'rgba(34, 197, 94, 0.1)'}]}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>FULL NAME</Text>
                <Text style={styles.detailValue}>{displayName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, {backgroundColor: 'rgba(34, 197, 94, 0.1)'}]}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>EMAIL ADDRESS</Text>
                <Text style={styles.detailValue}>{displayEmail}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cardGroup}>
          <Text style={[styles.sectionHeader, {color: colors.error}]}>Security</Text>
          <TouchableOpacity
            style={[styles.actionRow, styles.dangerRow]}
            activeOpacity={0.8}
            onPress={handleInitialDeleteTap}>
             <View style={[styles.detailIcon, {backgroundColor: 'rgba(248, 113, 113, 0.1)'}]}>
              <MaterialCommunityIcons
                name="delete-outline"
                size={20}
                color={colors.error}
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={[styles.actionLabel, {color: colors.error}]}>Delete Account</Text>
              <Text style={styles.dangerHint}>This action cannot be undone</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.error}
              style={{opacity: 0.5}}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionTag}>Aether Finance v1.0.4</Text>
      </ScrollView>

      <Modal
        visible={deleteModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => !isDeleting && setDeleteModalVisible(false)}>
        {/* ... Modal content remains same for functionality ... */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 32,
  },
  hero: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
    position: 'relative',
    marginBottom: 8,
  },
  heroGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    top: -50,
  },
  avatarWrapper: {
    width: AVATAR_SIZE + 12,
    height: AVATAR_SIZE + 12,
    borderRadius: (AVATAR_SIZE + 12) / 2,
    padding: 4,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 10},
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.surface,
  },
  greeting: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  caption: {
    color: colors.subText,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  cardGroup: {
    width: '100%',
    gap: 12,
  },
  sectionHeader: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingLeft: 4,
  },
  detailCard: {
    width: '100%',
    backgroundColor: colors.cardBg,
    borderRadius: 24,
    padding: 20,
    gap: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
  },
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  actionLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  dangerRow: {
    borderColor: 'rgba(248, 113, 113, 0.15)',
  },
  dangerHint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  versionTag: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  modalSheet: {
    backgroundColor: colors.cardBg,
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
    fontSize: 18,
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
    backgroundColor: colors.error,
  },
  deleteButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
});

export default ProfileScreen;
