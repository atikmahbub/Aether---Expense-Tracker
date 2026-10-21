import { selectionHaptic } from "@trackingPortal/utils/haptic";
import React from "react";
import { StyleSheet, View } from "react-native";

import PillChip from "@trackingPortal/components/scalar/PillChip";

interface SegmentedControlProps {
  options: string[];
  /** Display text per option; defaults to the capitalised option. */
  labels?: Record<string, string>;
  selectedOption: string;
  onOptionPress: (option: string) => void;
  containerStyle?: object;
  /** On the tinted top rather than a sheet. */
  panel?: boolean;
}

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

/**
 * The Wallet-style pill row (Expense / Income). Kept under its old name so
 * every form and screen picks up the same look.
 */
const TransactionSegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  labels,
  selectedOption,
  onOptionPress,
  containerStyle,
  panel = false,
}) => (
  <View style={[styles.row, containerStyle]}>
    {options.map((option) => (
      <PillChip
        key={option}
        variant={panel ? "hero" : "sheet"}
        label={labels?.[option] ?? capitalize(option)}
        active={option === selectedOption}
        onPress={() => {
          if (option !== selectedOption) selectionHaptic();
          onOptionPress(option);
        }}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6 },
});

export default TransactionSegmentedControl;
