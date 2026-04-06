import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import { colors } from "../../theme/colors";

/** Official LECIPM mark (matches `apps/web/public/brand/lecipm-mark-on-dark.svg`). */
const LECIPM_MARK_XML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="10" y="10" width="108" height="108" rx="26" fill="none" stroke="#D4AF37" stroke-width="2.5"/>
  <path d="M 30 42 L 46 34 L 62 40 L 78 30 L 98 36" fill="none" stroke="#D4AF37" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="98" cy="36" r="3" fill="#FFFFFF" opacity="0.95"/>
  <rect x="32" y="54" width="15" height="46" rx="3" fill="#FFFFFF"/>
  <rect x="54" y="42" width="18" height="58" rx="3" fill="#FFFFFF"/>
  <rect x="80" y="50" width="15" height="50" rx="3" fill="#FFFFFF"/>
  <rect x="36" y="60" width="7" height="5" rx="1" fill="#0B0B0B" opacity="0.35"/>
  <rect x="59" y="50" width="8" height="5" rx="1" fill="#0B0B0B" opacity="0.35"/>
  <rect x="84" y="58" width="7" height="5" rx="1" fill="#0B0B0B" opacity="0.35"/>
</svg>`;

export type LecipmLogoProps = {
  /** Edge length of the square mark. */
  size?: number;
  /** When true, shows “LECIPM” wordmark beside the mark. */
  showWordmark?: boolean;
  /** Optional second line under the wordmark (small caps style). */
  tagline?: string;
  /** Center the block (e.g. sign-in hero). */
  centered?: boolean;
  style?: ViewStyle;
};

export function LecipmLogo({
  size = 48,
  showWordmark = false,
  tagline,
  centered = false,
  style,
}: LecipmLogoProps) {
  const mark = <SvgXml xml={LECIPM_MARK_XML} width={size} height={size} />;

  if (!showWordmark) {
    return (
      <View style={[centered && styles.center, style]} accessibilityRole="image" accessibilityLabel="LECIPM">
        {mark}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.row,
        centered && styles.rowCenter,
        style,
      ]}
      accessibilityRole="header"
      accessibilityLabel="LECIPM, Le Carrefour Immobilier Prestige"
    >
      {mark}
      <View style={styles.textCol}>
        <Text style={styles.wordmark}>LECIPM</Text>
        {tagline ? (
          <Text style={styles.tagline} numberOfLines={2}>
            {tagline}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowCenter: {
    justifyContent: "center",
    alignSelf: "center",
  },
  textCol: { flexShrink: 1 },
  wordmark: {
    color: colors.gold,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 4,
  },
  tagline: {
    marginTop: 4,
    color: colors.gold,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
    opacity: 0.9,
  },
});
