import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export type TrustHostStripProps = {
  hostRating: number | null | undefined;
  reviewCount?: number | null;
  completedBookings?: number | null;
  hostVerified?: boolean | null;
  topHost?: boolean | null;
  compact?: boolean;
};

function fmtRating(n: number): string {
  const x = Math.round(n * 10) / 10;
  return x % 1 === 0 ? String(x) : x.toFixed(1);
}

/** Host-side trust signals for listing / checkout screens. */
export function TrustHostStrip({
  hostRating,
  reviewCount,
  completedBookings,
  hostVerified,
  topHost,
  compact,
}: TrustHostStripProps) {
  const parts: string[] = [];
  if (hostVerified) parts.push("Verified host");
  if (topHost) parts.push("Top host");
  const hasRating = typeof hostRating === "number" && Number.isFinite(hostRating) && hostRating > 0;
  if (hasRating) {
    const rc = typeof reviewCount === "number" && reviewCount > 0 ? reviewCount : null;
    parts.push(`⭐ ${fmtRating(hostRating!)}${rc != null ? ` (${rc})` : ""}`);
  }
  if (typeof completedBookings === "number" && completedBookings > 0) {
    parts.push(`${completedBookings} completed stay${completedBookings === 1 ? "" : "s"}`);
  }
  if (parts.length === 0) return null;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]} accessibilityRole="summary">
      <Text style={[styles.text, compact && styles.textCompact]}>{parts.join(" · ")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface2,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 12,
  },
  wrapCompact: { paddingVertical: 8, marginBottom: 10 },
  text: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  textCompact: { fontSize: 12, lineHeight: 18 },
});
