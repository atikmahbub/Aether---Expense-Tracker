import React from "react";
import { View } from "react-native";

import { RollingDigit } from "@trackingPortal/components/ScalarLoadingMarks";

interface ScalarSpinnerProps {
  size?: number;
}

/**
 * Scalar's compact loading mark: a single odometer column. The size prop is
 * retained for compatibility with existing call sites.
 */
const ScalarSpinner: React.FC<ScalarSpinnerProps> = ({ size = 24 }) => (
  <View
    style={{
      width: Math.max(24, size),
      height: Math.max(24, size),
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <RollingDigit />
  </View>
);

export default ScalarSpinner;
