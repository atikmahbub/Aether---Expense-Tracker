import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";
import { triggerWarningHaptic } from "@trackingPortal/utils/haptic";

export type ScalarAlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

type AlertOptions = {
  title: string;
  message?: string;
  buttons?: ScalarAlertButton[];
};

const AlertContext = createContext<(options: AlertOptions) => void>(() => {});

export const useScalarAlert = () => useContext(AlertContext);

export const ScalarAlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [alert, setAlert] = useState<AlertOptions | null>(null);

  const showAlert = useCallback((options: AlertOptions) => {
    if (options.buttons?.some(button => button.style === "destructive")) {
      triggerWarningHaptic();
    }
    setAlert(options);
  }, []);
  const close = useCallback(() => setAlert(null), []);
  const buttons = alert?.buttons?.length
    ? alert.buttons
    : [{ text: "OK", style: "default" as const }];
  const destructive = buttons.some(button => button.style === "destructive");

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      <Modal
        visible={!!alert}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={close}
      >
        <View style={styles.backdrop}>
          <Pressable
            accessibilityLabel="Close alert"
            style={StyleSheet.absoluteFill}
            onPress={close}
          />
          <View
            accessibilityRole="alert"
            accessibilityViewIsModal
            style={styles.card}
          >
            <View
              style={[
                styles.accent,
                destructive ? styles.destructiveAccent : styles.infoAccent,
              ]}
            />
            <View
              style={[
                styles.iconTile,
                destructive ? styles.destructiveTile : styles.infoTile,
              ]}
            >
              <MaterialCommunityIcons
                name={destructive ? "alert-outline" : "information-outline"}
                size={24}
                color={destructive ? colors.negative : colors.brandText}
              />
            </View>
            <Text style={styles.title}>{alert?.title}</Text>
            {!!alert?.message && (
              <Text style={styles.message}>{alert.message}</Text>
            )}
            <View style={styles.actions}>
              {buttons.map((button, index) => {
                const isDestructive = button.style === "destructive";
                const isPrimary =
                  isDestructive ||
                  (button.style !== "cancel" && index === buttons.length - 1);
                return (
                  <Pressable
                    key={`${button.text}-${index}`}
                    onPress={() => {
                      if (isDestructive) {
                        triggerWarningHaptic();
                      }
                      close();
                      button.onPress?.();
                    }}
                    style={({ pressed }) => [
                      styles.button,
                      isPrimary && styles.primaryButton,
                      isDestructive && styles.destructiveButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isPrimary && styles.primaryButtonText,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: designTokens.spacing.xxl,
      backgroundColor: `${colors.backdrop}CC`,
    },
    card: {
      width: "100%",
      maxWidth: 360,
      padding: designTokens.spacing.xxl,
      borderRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceRaised,
      overflow: "hidden",
    },
    accent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 5,
    },
    infoAccent: { backgroundColor: colors.panel },
    destructiveAccent: { backgroundColor: colors.negative },
    iconTile: {
      width: 48,
      height: 48,
      marginBottom: designTokens.spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.md,
    },
    infoTile: {
      borderWidth: 1,
      borderColor: colors.panelEdge,
      backgroundColor: colors.brandWash,
    },
    destructiveTile: { backgroundColor: colors.errorSoft },
    title: {
      color: colors.textPrimary,
      fontFamily: designTokens.font.bold,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "700",
      letterSpacing: -0.4,
    },
    message: {
      marginTop: designTokens.spacing.sm,
      color: colors.textSecondary,
      fontFamily: designTokens.font.regular,
      fontSize: 15,
      lineHeight: 22,
    },
    actions: {
      marginTop: designTokens.spacing.xxl,
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: designTokens.spacing.sm,
    },
    button: {
      minWidth: 88,
      minHeight: 46,
      paddingHorizontal: designTokens.spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: designTokens.radius.full,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
    },
    primaryButton: {
      borderColor: colors.brand,
      backgroundColor: colors.brand,
    },
    destructiveButton: {
      borderColor: colors.negative,
      backgroundColor: colors.negative,
    },
    pressed: { opacity: 0.78 },
    buttonText: {
      color: colors.textSecondary,
      fontFamily: designTokens.font.semibold,
      fontSize: 14,
      fontWeight: "600",
    },
    primaryButtonText: { color: colors.onBrand },
  });
}
