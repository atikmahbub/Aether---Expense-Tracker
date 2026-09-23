import { EInvestStatus } from "@trackingPortal/api/enums";
import { InvestModel } from "@trackingPortal/api/models";
import { CurvyHeroPanel, CustomAppBar, HeroFigure, HeroStatCard } from "@trackingPortal/components";
import { useStoreContext } from "@trackingPortal/contexts/StoreProvider";
import { formatCurrency, formatNumber } from "@trackingPortal/utils/utils";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

interface ISummary {
  investList: InvestModel[];
  status: EInvestStatus;
}

const InvestSummary: React.FC<ISummary> = ({ investList, status }) => {
  const { currency } = useStoreContext();
  const isActive = status === EInvestStatus.Active;
  const totalAmount = investList.reduce((sum, item) => sum + item.amount, 0);
  const completedReturns = investList
    .filter((item) => item.earned != null && item.amount > 0)
    .map((item) => (((item.earned ?? 0) - item.amount) / item.amount) * 100);
  const averageReturn = completedReturns.length
    ? completedReturns.reduce((sum, value) => sum + value, 0) /
      completedReturns.length
    : 0;

  // "1 asset · Gold" — name the holdings while the list is short enough to read.
  const assetSubtitle = useMemo(() => {
    const count = `${investList.length} ${investList.length === 1 ? "asset" : "assets"}`;
    const names = investList
      .slice(0, 2)
      .map((item) => item.name)
      .filter(Boolean);
    if (!names.length) return count;
    const suffix = investList.length > names.length ? "…" : "";
    return `${count} · ${names.join(", ")}${suffix}`;
  }, [investList]);

  const returnGlyph = averageReturn < 0 ? "▼ " : averageReturn > 0 ? "▲ " : "";

  return (
    <CurvyHeroPanel>
      <CustomAppBar />
      <View style={styles.container}>
        <HeroFigure
          label={isActive ? "Active investments" : "Completed investments"}
          amount={formatCurrency(totalAmount, currency, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
          footer={assetSubtitle}
        />
        {/* Direction carries a glyph as well as the sign and colour. */}
        <HeroStatCard
          stats={[
            {
              label: `${returnGlyph}Average return`,
              value: formatNumber(averageReturn, {
                maximumFractionDigits: 1,
                minimumFractionDigits: 1,
                suffix: "%",
              }).replace("-", "−"),
              tone:
                averageReturn < 0
                  ? "negative"
                  : averageReturn > 0
                    ? "positive"
                    : "neutral",
            },
            {
              label: "Asset count",
              value: formatNumber(investList.length, {
                maximumFractionDigits: 0,
                useGrouping: false,
              }),
            },
          ]}
        />
      </View>
    </CurvyHeroPanel>
  );
};

export default InvestSummary;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 22, gap: 16 },
});
