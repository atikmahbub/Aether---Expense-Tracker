import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  InteractionManager,
  Linking,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import React, {useCallback, useMemo, useState} from 'react';
import {Text} from 'react-native-paper';
import {useAuth} from '@trackingPortal/auth/Auth0ProviderWithHistory';
import {AnimatedLoader} from '@trackingPortal/components';
import {useStoreContext} from '@trackingPortal/contexts/StoreProvider';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme, ThemeMode } from '@trackingPortal/contexts/ThemeContext';
import {SUPPORTED_CURRENCIES} from '@trackingPortal/constants/currency';
import Toast from 'react-native-toast-message';

const THEME_OPTIONS: { label: string; value: ThemeMode; icon: string }[] = [
  { label: 'System', value: 'system', icon: 'brightness-auto' },
  { label: 'Light', value: 'light', icon: 'white-balance-sunny' },
  { label: 'Dark', value: 'dark', icon: 'moon-waning-crescent' },
];

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const {logout, loading} = useAuth();
  const {currency, setCurrencyPreference} = useStoreContext();
  const router = useRouter();
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  const openCurrencyModal = useCallback(() => {
    InteractionManager.runAfterInteractions(() =>
      setCurrencyModalVisible(true),
    );
  }, []);

  const STORE_URL = 'https://play.google.com/store/apps/details?id=com.atik.aether';

  const handlePrivacyPolicy = async () => {
    const url = 'https://atikmahbub.github.io/aether-privacy-policy/';
    try {
      await Linking.openURL(url);
    } catch {
      Toast.show({ type: "error", text1: "Failed to open link" });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Track your finances effortlessly with Scalar — download it free on Google Play: ${STORE_URL}`,
      });
    } catch {
      Toast.show({ type: "error", text1: "Failed to share" });
    }
  };

  const handleRate = async () => {
    try {
      await Linking.openURL(STORE_URL);
    } catch {
      Toast.show({ type: "error", text1: "Failed to open Play Store" });
    }
  };

  if (loading) {
    return <AnimatedLoader />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>APPEARANCE</Text>
      <View style={styles.cardContainer}>
        <View style={styles.selectorRow}>
          <View style={styles.selectorRowContent}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name='theme-light-dark'
                size={20}
                color={colors.text}
              />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>THEME</Text>
              <Text style={styles.detailValue}>Color Scheme</Text>
            </View>
          </View>
        </View>
        <View style={styles.themeToggleRow}>
          {THEME_OPTIONS.map((option) => {
            const isSelected = themeMode === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.themeToggleOption,
                  isSelected && styles.themeToggleOptionSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => setThemeMode(option.value)}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={18}
                  color={isSelected ? '#0F1117' : colors.muted}
                />
                <Text style={[
                  styles.themeToggleLabel,
                  isSelected && styles.themeToggleLabelSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
            color={colors.muted}
          />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.selectorRow}
          activeOpacity={0.85}
          onPress={() => router.push('/categories')}>
          <View style={styles.selectorRowContent}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name='tag-multiple-outline'
                size={20}
                color={colors.text}
              />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>MANAGEMENT</Text>
              <Text style={styles.detailValue}>Categories</Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name='chevron-right'
            size={22}
            color={colors.muted}
          />
        </TouchableOpacity>
      </View>

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
            color={colors.muted}
          />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.selectorRow}
          activeOpacity={0.85}
          onPress={handleShare}>
          <View style={styles.selectorRowContent}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name='share-variant-outline'
                size={20}
                color={colors.text}
              />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>SPREAD THE WORD</Text>
              <Text style={styles.detailValue}>Share Scalar</Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name='chevron-right'
            size={22}
            color={colors.muted}
          />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.selectorRow}
          activeOpacity={0.85}
          onPress={handleRate}>
          <View style={styles.selectorRowContent}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name='star-outline'
                size={20}
                color={colors.text}
              />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>GOOGLE PLAY</Text>
              <Text style={styles.detailValue}>Rate Scalar</Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name='open-in-new'
            size={22}
            color={colors.muted}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>ACCOUNT</Text>
      <TouchableOpacity
        style={styles.logoutCard}
        activeOpacity={0.7}
        onPress={() => logout()}>
        <View style={styles.actionLeft}>
          <View style={styles.logoutIconWrapper}>
            <MaterialCommunityIcons name="logout" size={22} color="#ff8e8b" />
          </View>
          <View>
            <Text style={styles.logoutLabel}>Log out</Text>
            <Text style={styles.logoutHint}>Sign out from this device</Text>
          </View>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colors.muted}
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
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 60,
      gap: 16,
    },
    sectionHeader: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginTop: 12,
      marginBottom: 4,
    },
    cardContainer: {
      backgroundColor: colors.cardBg,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailTextCol: {
      flex: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.glassBorder,
      marginVertical: 16,
      marginLeft: 64,
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
      color: colors.muted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    detailValue: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      fontFamily: 'Manrope',
    },
    themeToggleRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 16,
    },
    themeToggleOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    themeToggleOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    themeToggleLabel: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '700',
    },
    themeToggleLabelSelected: {
      color: '#0F1117',
    },
    logoutCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 24,
      paddingVertical: 20,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: 'rgba(248, 113, 113, 0.1)',
    },
    actionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    logoutIconWrapper: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255, 142, 139, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 142, 139, 0.15)',
    },
    logoutLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
      fontFamily: 'Manrope',
    },
    logoutHint: {
      color: colors.muted,
      fontSize: 13,
      marginTop: 2,
      fontWeight: '500',
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
    modalTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 16,
    },
    currencyOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderColor: colors.glassBorder,
    },
    currencyOptionActive: {
      backgroundColor: colors.badgeBg,
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
      backgroundColor: colors.surface,
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
}
