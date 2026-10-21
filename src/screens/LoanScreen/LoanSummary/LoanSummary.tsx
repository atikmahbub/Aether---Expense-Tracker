import { CurvyHeroPanel, CustomAppBar, HeroFigure, HeroStatCard } from "@trackingPortal/components";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { useTranslation } from "@trackingPortal/contexts/LanguageContext";
import { formatCurrency } from "@trackingPortal/utils/utils";
import React from "react";
import { StyleSheet, View } from "react-native";

interface ISummary {
  totalGiven: number;
  totalBorrowed: number;
}

const moneyOptions = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
} as const;

// Loan direction carries the arrow as well as the sign and the colour, so it
// never rests on colour alone. The net position itself stays neutral ink.
const LoanSummary: React.FC<ISummary> = ({
  totalGiven = 0,
  totalBorrowed = 0,
}) => {
  const { currency } = useStoreContext();
  const { t } = useTranslation();
  const netPosition = totalGiven - totalBorrowed;

  return (
    <CurvyHeroPanel>
      <CustomAppBar />
      <View style={styles.container}>
        <HeroFigure
          label={t("loan.netPosition")}
          amount={formatCurrency(Math.abs(netPosition), currency, moneyOptions)}
          footer={
            netPosition === 0
              ? t("loan.nothingOutstanding")
              : netPosition > 0
                ? t("loan.owedMore")
                : t("loan.oweMore")
          }
        />
        <HeroStatCard
          stats={[
            {
              label: t("loan.owedToYou"),
              value: `+${formatCurrency(totalGiven, currency, moneyOptions)}`,
              tone: "positive",
            },
            {
              label: t("loan.youOwe"),
              value: `−${formatCurrency(totalBorrowed, currency, moneyOptions)}`,
              tone: "negative",
            },
          ]}
        />
      </View>
    </CurvyHeroPanel>
  );
};

export default LoanSummary;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 22, gap: 16 },
});
