import React from "react";
import { StyleProp, Text, TextStyle } from "react-native";

import { designTokens } from "@trackingPortal/themes/designTokens";

interface ScalarAmountTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
}

export default function ScalarAmountText({
  children,
  style,
  ...textProps
}: ScalarAmountTextProps) {
  const parts = children.split("৳");

  return (
    <Text style={style} {...textProps}>
      {parts.map((part, index) => (
        <React.Fragment key={`${part}-${index}`}>
          {index > 0 && (
            <Text style={{ fontFamily: designTokens.font.bengali }}>৳</Text>
          )}
          {part}
        </React.Fragment>
      ))}
    </Text>
  );
}
