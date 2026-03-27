import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { colors } from "../../theme/colors";

const links = [
  ["/(host)/listings", "Listings"],
  ["/(host)/calendar", "Calendar"],
  ["/(host)/reservations", "Reservations"],
  ["/(host)/earnings", "Earnings"],
  ["/(host)/quality", "Quality & trust"],
  ["/(host)/pricing", "Pricing"],
  ["/(host)/reviews", "Reviews"],
  ["/(host)/safety", "Safety requirements"],
  ["/(host)/profile", "Host profile"],
] as const;

export default function HostDashboard() {
  return (
    <ScreenChrome title="Host hub" subtitle="Operations · channel-ready calendar">
      <View style={styles.grid}>
        {links.map(([href, label]) => (
          <Link key={href} href={href} style={styles.cell}>
            <Text style={styles.link}>{label}</Text>
          </Link>
        ))}
      </View>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cell: {
    width: "47%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  link: { color: colors.gold, fontWeight: "700", textAlign: "center" },
});
