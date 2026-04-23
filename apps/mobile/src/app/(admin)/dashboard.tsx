import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { mobileFetch } from "../../services/apiClient";
import { colors } from "../../theme/colors";

type Q = { queues: Record<string, number>; note: string };

const AI_LINES = ['BNHub revenue ↑ vs prior week (illustrative)', 'Seller hub engagement strong in premium corridors'];

/**
 * Admin mobile home — LECIPM gold header, stat tiles, AI strip, hub chips, operations links.
 */
export default function AdminDashboard() {
  const q = useQuery({
    queryKey: ["admin-queues"],
    queryFn: () => mobileFetch<Q>("/api/mobile/v1/admin/queues"),
  });
  const queues = q.data?.queues;

  return (
    <ScreenChrome showBrand title="Admin home" subtitle="Mobile command surface">
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.lead}>Operations snapshot — wire deeper metrics from your warehouse.</Text>

        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statEyebrow}>Revenue today</Text>
            <Text style={styles.statVal}>—</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statEyebrow}>Bookings</Text>
            <Text style={styles.statVal}>—</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statEyebrow}>Leads</Text>
            <Text style={styles.statVal}>—</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statEyebrow}>Alerts</Text>
            <Text style={styles.statVal}>{queues ? Object.keys(queues).length : "—"}</Text>
          </View>
        </View>

        <Text style={styles.section}>AI insights</Text>
        <View style={styles.aiBox}>
          {AI_LINES.map((line) => (
            <Text key={line} style={styles.aiLine}>
              · {line}
            </Text>
          ))}
        </View>

        <Text style={styles.section}>Hubs</Text>
        <View style={styles.hubRow}>
          {["Buyer", "Seller", "Broker", "Investor", "BNHub", "Rent"].map((h) => (
            <View key={h} style={styles.hubChip}>
              <Text style={styles.hubChipText}>{h}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Queues</Text>
        {queues ? (
          <View style={styles.box}>
            {Object.entries(queues).map(([k, v]) => (
              <Text key={k} style={styles.row}>
                {k}: <Text style={styles.num}>{v}</Text>
              </Text>
            ))}
          </View>
        ) : (
          <Text style={styles.m}>Loading…</Text>
        )}
        <Text style={styles.note}>{q.data?.note}</Text>

        <Link href="/(admin)/approvals" style={styles.link}>
          <Text style={styles.linkT}>Approvals</Text>
        </Link>
        <Link href="/(admin)/operations-map" style={styles.link}>
          <Text style={styles.linkT}>Operations map</Text>
        </Link>
      </ScrollView>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  lead: { color: colors.textMuted, lineHeight: 22, marginBottom: 20 },
  statRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 22 },
  stat: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  statEyebrow: { color: colors.goldDim, fontSize: 10, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  statVal: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 6 },
  section: {
    color: colors.goldDim,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
    textTransform: "uppercase",
  },
  aiBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  aiLine: { color: colors.text, fontSize: 14, lineHeight: 21 },
  hubRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 22 },
  hubChip: {
    borderWidth: 1,
    borderColor: colors.goldDim,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  hubChipText: { color: colors.text, fontWeight: "700", fontSize: 12 },
  box: { backgroundColor: colors.surface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  row: { color: colors.textMuted, marginVertical: 4 },
  num: { color: colors.gold, fontWeight: "800" },
  m: { color: colors.textMuted },
  note: { color: colors.textMuted, fontSize: 12, marginTop: 12 },
  link: { marginTop: 12 },
  linkT: { color: colors.gold, fontWeight: "700" },
});
