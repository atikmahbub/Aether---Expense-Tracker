import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useCallback, useMemo, useState } from "react";
import {
  InteractionManager,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { useAuth } from "@trackingPortal/auth/Auth0ProviderWithHistory";
import { AnimatedLoader } from "@trackingPortal/components";
import { SUPPORTED_CURRENCIES } from "@trackingPortal/constants/currency";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import {
  ThemeMode,
  useAppTheme,
} from "@trackingPortal/contexts/ThemeContext";
import TransactionSegmentedControl from "@trackingPortal/screens/TransactionScreen/components/TransactionSegmentedControl";
import { designTokens } from "@trackingPortal/themes/designTokens";

const STORE_URL =
  "https://play.google.com/store/apps/details?id=com.atik.aether";

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { logout, loading } = useAuth();
  const { currency, setCurrencyPreference } = useStoreContext();
  const router = useRouter();
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  const openCurrencyModal = useCallback(() => {
    InteractionManager.runAfterInteractions(() =>
      setCurrencyModalVisible(true),
    );
  }, []);

  const openLink = async (url: string) => {
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

  if (loading) return <AnimatedLoader />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionLabel}>APPEARANCE</Text>
      <TransactionSegmentedControl
        options={["Light", "Dark", "System"]}
        selectedOption={
          themeMode.charAt(0).toUpperCase() + themeMode.slice(1)
        }
        onOptionPress={(option) =>
          setThemeMode(option.toLowerCase() as ThemeMode)
        }
      />

      <Text style={styles.sectionLabel}>PREFERENCES</Text>
      <View style={styles.card}>
        <SettingsRow
          icon="cash-multiple"
          label="Currency"
          value={`${currency.code} ${currency.symbol}`}
          onPress={openCurrencyModal}
          styles={styles}
          colors={colors}
        />
        <View style={styles.divider} />
        <SettingsRow
          icon="tag-multiple"
          label="Categories"
          onPress={() => router.push("/categories")}
          styles={styles}
          colors={colors}
        />
      </View>

      <Text style={styles.sectionLabel}>ABOUT</Text>
      <View style={styles.card}>
        <SettingsRow
          icon="shield-account"
          label="Privacy Policy"
          external
          onPress={() =>
            openLink("https://atikmahbub.github.io/aether-privacy-policy/")
          }
          styles={styles}
          colors={colors}
        />
        <View style={styles.divider} />
        <SettingsRow
          icon="share-variant"
          label="Share Scalar"
          onPress={handleShare}
          styles={styles}
          colors={colors}
        />
        <View style={styles.divider} />
        <SettingsRow
          icon="star"
          label="Rate Scalar"
          external
          onPress={() => openLink(STORE_URL)}
          styles={styles}
          colors={colors}
        />
      </View>

      <Pressable
        onPress={() => logout()}
        style={({ pressed }) => [
          styles.signOut,
          pressed && styles.rowPressed,
        ]}
      >
        <MaterialCommunityIcons
          name="logout"
          size={20}
          color={colors.negative}
        />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <Modal
        visible={currencyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setCurrencyModalVisible(false)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.handle} />
          <Text style={styles.modalTitle}>Choose currency</Text>
          {SUPPORTED_CURRENCIES.map((option, index) => {
            const selected = option.code === currency.code;
            return (
              <React.Fragment key={option.code}>
                <Pressable
                  onPress={async () => {
                    await setCurrencyPreference(option);
                    setCurrencyModalVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.currencyRow,
                    selected && styles.currencyRowSelected,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View style={styles.currencySymbol}>
                    <Text style={styles.currencySymbolText}>
                      {option.symbol}
                    </Text>
                  </View>
                  <View style={styles.currencyCopy}>
                    <Text style={styles.currencyName}>{option.name}</Text>
                    <Text style={styles.currencyCode}>{option.code}</Text>
                  </View>
                  {selected && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color={colors.brandText}
                    />
                  )}
                </Pressable>
                {index < SUPPORTED_CURRENCIES.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </Modal>
    </ScrollView>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  external,
  onPress,
  styles,
  colors,
}: {
  icon: any;
  label: string;
  value?: string;
  external?: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.iconTile}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={colors.brandText}
        />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      <MaterialCommunityIcons
        name={external ? "open-in-new" : "chevron-right"}
        size={19}
        color={colors.textTertiary}
      />
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 28,
      gap: 12,
    },
    title: {
      marginBottom: 4,
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      ...designTokens.typography.title,
    },
    sectionLabel: {
      marginTop: 12,
      color: colors.textTertiary,
      fontFamily: designTokens.font.bold,
      fontWeight: "700",
      ...designTokens.typography.caps,
    },
    card: {
      overflow: "hidden",
      borderRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    row: {
      minHeight: 64,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    rowPressed: { backgroundColor: colors.surfaceSunken },
    iconTile: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.md,
      backgroundColor: colors.brandWash,
    },
    rowLabel: {
      flex: 1,
      color: colors.textPrimary,
      fontFamily: designTokens.font.semibold,
      fontSize: 16,
      fontWeight: "600",
    },
    rowValue: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.medium,
      fontSize: 15,
      fontWeight: "500",
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: 68,
      backgroundColor: colors.divider,
    },
    signOut: {
      height: 52,
      marginTop: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: designTokens.radius.full,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    signOutText: {
      color: colors.negative,
      fontFamily: designTokens.font.bold,
      fontSize: 16,
      fontWeight: "700",
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.backdrop,
      opacity: 0.75,
    },
    modalSheet: {
      marginTop: "auto",
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 28,
      borderTopLeftRadius: designTokens.radius.lg,
      borderTopRightRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    handle: {
      width: 40,
      height: 4,
      alignSelf: "center",
      marginBottom: 16,
      borderRadius: 2,
      backgroundColor: colors.borderStrong,
    },
    modalTitle: {
      marginBottom: 8,
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontSize: 20,
      fontWeight: "700",
    },
    currencyRow: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 8,
      borderRadius: designTokens.radius.md,
    },
    currencyRowSelected: { backgroundColor: colors.brandWash },
    currencySymbol: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.md,
      backgroundColor: colors.surface,
    },
    currencySymbolText: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.bengali,
      fontSize: 18,
      fontWeight: "700",
    },
    currencyCopy: { flex: 1 },
    currencyName: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.semibold,
      fontSize: 15,
      fontWeight: "600",
    },
    currencyCode: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.medium,
      fontSize: 12,
    },
  });
}
