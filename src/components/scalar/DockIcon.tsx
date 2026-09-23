import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type DockIconName = "wallet" | "loans" | "plus" | "invest" | "settings";

/** Scalar dock glyphs: 24 grid, 1.8 stroke, round caps. */
export default function DockIcon({
  name,
  color,
  size = 22,
}: {
  name: DockIconName;
  color: string;
  size?: number;
}) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "wallet" && (
        <>
          <Rect x={3} y={6} width={18} height={13} rx={3} {...stroke} />
          <Path d="M3 10h18" {...stroke} />
          <Path d="M15.5 14.5h2" {...stroke} />
        </>
      )}
      {name === "loans" && (
        <>
          <Path d="M5 8h13" {...stroke} />
          <Path d="M15 5l3 3-3 3" {...stroke} />
          <Path d="M19 16H6" {...stroke} />
          <Path d="M9 13l-3 3 3 3" {...stroke} />
        </>
      )}
      {name === "plus" && (
        <>
          <Path d="M12 5v14" {...stroke} />
          <Path d="M5 12h14" {...stroke} />
        </>
      )}
      {name === "invest" && (
        <>
          <Path d="M4 19h16" {...stroke} />
          <Path d="M5 15l4-5 4 3 6-7" {...stroke} />
          <Path d="M15 6h4v4" {...stroke} />
        </>
      )}
      {name === "settings" && (
        <>
          <Path d="M4 7h9" {...stroke} />
          <Path d="M17 7h3" {...stroke} />
          <Circle cx={15} cy={7} r={2} {...stroke} />
          <Path d="M4 17h3" {...stroke} />
          <Path d="M11 17h9" {...stroke} />
          <Circle cx={9} cy={17} r={2} {...stroke} />
        </>
      )}
    </Svg>
  );
}
