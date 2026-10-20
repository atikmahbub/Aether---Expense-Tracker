import { CurvyHeroPanel, CustomAppBar, HeroFigure, HeroStatCard } from "@trackingPortal/components";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
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
  const netPosition = totalGiven - totalBorrowed;

  return (
    <CurvyHeroPanel>
      <CustomAppBar />
      <View style={styles.container}>
        <HeroFigure
          label="Net position"
          amount={formatCurrency(Math.abs(netPosition), currency, moneyOptions)}
          footer={
            netPosition === 0
              ? "Nothing outstanding either way"
              : netPosition > 0
                ? "More is owed to you than you owe"
                : "You owe more than is owed to you"
          }
        />
        <HeroStatCard
          stats={[
            {
              label: "↗ Owed to you",
              value: `+${formatCurrency(totalGiven, currency, moneyOptions)}`,
              tone: "positive",
            },
            {
              label: "↙ You owe",
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
