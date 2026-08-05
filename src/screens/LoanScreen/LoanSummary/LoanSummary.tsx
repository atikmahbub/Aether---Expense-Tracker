import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import ScalarAmountText from "@trackingPortal/components/ScalarAmountText";
import { CurvyHeroPanel, CustomAppBar } from "@trackingPortal/components";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useAppTheme } from "@trackingPortal/contexts/ThemeContext";
import { designTokens } from "@trackingPortal/themes/designTokens";
import { formatCurrency } from "@trackingPortal/utils/utils";
import React, { ComponentProps, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

interface ISummary {
  totalGiven: number;
  totalBorrowed: number;
}

const moneyOptions = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
} as const;

const LoanSummary: React.FC<ISummary> = ({
  totalGiven = 0,
  totalBorrowed = 0,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { currency } = useStoreContext();
  const netPosition = totalGiven - totalBorrowed;

  return (
    <CurvyHeroPanel>
      <CustomAppBar />
      <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.label}>NET POSITION</Text>
        {/* See HomeDashboard: adjustsFontSizeToFit collapses multi-font-run
            amounts (the ৳ is Noto Sans Bengali) at this size on iOS. */}
        <ScalarAmountText numberOfLines={1} style={styles.heroAmount}>
          {formatCurrency(Math.abs(netPosition), currency, moneyOptions)}
        </ScalarAmountText>
        <Text style={styles.heroFooter}>
          {netPosition === 0
            ? "Given and borrowed are balanced"
            : netPosition > 0
              ? "More given than borrowed"
              : "More borrowed than given"}
        </Text>
      </View>
      <View style={styles.metrics}>
        <Metric
          label="TOTAL GIVEN"
          icon="arrow-top-right"
          amount={`+${formatCurrency(totalGiven, currency, moneyOptions)}`}
          tone="positive"
          styles={styles}
          colors={colors}
        />
        <Metric
          label="TOTAL BORROWED"
          icon="arrow-bottom-left"
          amount={`−${formatCurrency(totalBorrowed, currency, moneyOptions)}`}
          tone="negative"
          styles={styles}
          colors={colors}
        />
      </View>
      </View>
    </CurvyHeroPanel>
  );
};

// Loan direction carries the arrow as well as the sign and the colour, so it
// never rests on colour alone.
function Metric({
  label,
  icon,
  amount,
  tone,
  styles,
  colors,
}: {
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  amount: string;
  tone: "positive" | "negative";
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) {
  const toneStyle = tone === "positive" ? styles.positive : styles.negative;
  const toneColor =
    tone === "positive" ? colors.panelPositive : colors.panelNegative;
  return (
    <View style={styles.metricCard}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.metricValueRow}>
        <MaterialCommunityIcons name={icon} size={15} color={toneColor} />
        <ScalarAmountText
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.metricAmount, toneStyle]}
        >
          {amount}
        </ScalarAmountText>
      </View>
    </View>
  );
}

export default LoanSummary;

function makeStyles(colors: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 10 },
    hero: {
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: designTokens.radius.lg,
      borderWidth: 1,
      borderColor: colors.panelTileBorder,
      backgroundColor: colors.panelTile,
    },
    label: {
      color: colors.panelTextSecondary,
      fontFamily: designTokens.font.extraBold,
      fontWeight: "800",
      ...designTokens.typography.caps,
    },
    heroAmount: {
      color: colors.panelText,
      fontFamily: designTokens.font.extraBold,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      ...designTokens.typography.heroAmount,
    },
    heroFooter: {
      color: colors.panelTextSecondary,
      fontFamily: designTokens.font.medium,
      fontWeight: "500",
      ...designTokens.typography.caption,
    },
    metrics: { flexDirection: "row", gap: 12 },
    metricValueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      minWidth: 0,
    },
    metricCard: {
      flex: 1,
      minWidth: 0,
      gap: 3,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: designTokens.radius.tile,
      borderWidth: 1,
      borderColor: colors.panelTileBorder,
      backgroundColor: colors.panelTile,
    },
    metricAmount: {
      flexShrink: 1,
      color: colors.panelText,
      fontFamily: designTokens.font.extraBold,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      ...designTokens.typography.metric,
    },
    positive: { color: colors.panelPositive },
    negative: { color: colors.panelNegative },
  });
}
