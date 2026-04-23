import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/AppScreen";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import { theme } from "@/lib/theme";

export default function HomeTab() {
  return (
    <AppScreen>
      <Text style={styles.eyebrow}>LECIPM</Text>
      <Text style={styles.title}>Luxury real estate intelligence.</Text>
      <Text style={styles.subtitle}>
        Search, invest, manage, and monitor the platform through one premium mobile experience.
      </Text>

      <View style={styles.statsRow}>
        <StatCard label="Revenue Today" value="$12.8K" sub="Platform wide" />
        <StatCard label="Alerts" value="4" sub="Needs review" />
      </View>

      <SectionCard>
        <Text style={styles.sectionTitle}>Quick access</Text>
        <View style={styles.linkGrid}>
          <Link href="/dashboard/buyer" style={styles.quickLink}>
            Buyer
          </Link>
          <Link href="/dashboard/seller" style={styles.quickLink}>
            Seller
          </Link>
          <Link href="/dashboard/broker" style={styles.quickLink}>
            Broker
          </Link>
          <Link href="/dashboard/investor" style={styles.quickLink}>
            Investor
          </Link>
          <Link href="/dashboard/admin" style={styles.quickLink}>
            Admin
          </Link>
          <Link href="/stay/1" style={styles.quickLink}>
            BNHub
          </Link>
        </View>
      </SectionCard>

      <View style={styles.space} />

      <SectionCard>
        <Text style={styles.sectionTitle}>AI insights</Text>
        <View style={styles.insightItem}>
          <Text style={styles.insightText}>BNHub revenue is trending above the 7-day average.</Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightText}>One payout anomaly needs admin review.</Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightText}>Westmount luxury inventory is attracting stronger buyer intent today.</Text>
        </View>
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: theme.colors.gold,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginTop: 8,
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: "700",
    marginTop: 10,
    lineHeight: 36,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 12,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 14,
  },
  linkGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickLink: {
    color: theme.colors.gold,
    borderWidth: 1,
    borderColor: theme.colors.goldSoft,
    backgroundColor: "#111111",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    overflow: "hidden",
  },
  insightItem: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#111111",
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
  },
  insightText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  space: {
    height: 16,
  },
});
