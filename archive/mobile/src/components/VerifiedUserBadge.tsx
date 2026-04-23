import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type Props = { compact?: boolean };

/** Shown when the signed-in user has approved ID verification (`/api/mobile/v1/me`). */
export function VerifiedUserBadge({ compact }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]} accessibilityRole="text">
      <Text style={styles.icon} accessibilityLabel="">
        ✓
      </Text>
      <Text style={[styles.label, compact && styles.labelCompact]}>Verified user</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldDim,
  },
  wrapCompact: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  icon: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: "800",
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  labelCompact: {
    fontSize: 12,
  },
});
