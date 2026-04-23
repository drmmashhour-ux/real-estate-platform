import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config";
import { buildAuthHeaders } from "../lib/authHeaders";
import { colors } from "../theme/colors";

type Metrics = {
  totalBookings: number;
  paidBookings: number;
  pendingBookings: number;
  processingBookings: number;
  grossRevenuePaid: number;
};

export default function AdminMetricsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authKind, setAuthKind] = useState<"none" | "unauthorized" | "forbidden">("none");
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthKind("none");
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/api/admin/booking-metrics`;
      const headers = await buildAuthHeaders();
      const res = await fetch(url, { headers });
      const data = (await res.json().catch(() => ({}))) as Metrics & { error?: string };
      if (!res.ok) {
        if (res.status === 401) {
          setAuthKind("unauthorized");
          setMetrics(null);
          return;
        }
        if (res.status === 403) {
          setAuthKind("forbidden");
          setMetrics(null);
          return;
        }
        setError(typeof data.error === "string" ? data.error : "Could not load metrics.");
        setMetrics(null);
        return;
      }
      setAuthKind("none");
      setMetrics({
        totalBookings: data.totalBookings ?? 0,
        paidBookings: data.paidBookings ?? 0,
        pendingBookings: data.pendingBookings ?? 0,
        processingBookings: data.processingBookings ?? 0,
        grossRevenuePaid: data.grossRevenuePaid ?? 0,
      });
    } catch {
      setError("Network error — check EXPO_PUBLIC_API_BASE_URL.");
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.kicker}>ADMIN</Text>
        <Text style={styles.head}>Booking metrics</Text>
        <Text style={styles.lead}>Platform-wide booking metrics. Admin sign-in required.</Text>

        {authKind === "unauthorized" ? (
          <View style={styles.card}>
            <Text style={styles.err}>Sign in with an admin account to view metrics.</Text>
            <Pressable onPress={() => router.push("/(auth)/sign-in")} style={({ pressed }) => [styles.retry, pressed && { opacity: 0.9 }]}>
              <Text style={styles.retryLabel}>Sign in</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/(tabs)")} style={styles.browseLink}>
              <Text style={styles.browseLinkLabel}>Back to browse</Text>
            </Pressable>
          </View>
        ) : null}

        {authKind === "forbidden" ? (
          <View style={styles.card}>
            <Text style={styles.err}>You do not have admin access.</Text>
            <Pressable onPress={() => router.push("/(tabs)")} style={({ pressed }) => [styles.retry, pressed && { opacity: 0.9 }]}>
              <Text style={styles.retryLabel}>Browse stays</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.muted}>Loading…</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.card}>
            <Text style={styles.err}>{error}</Text>
            <Pressable onPress={() => void load()} style={({ pressed }) => [styles.retry, pressed && { opacity: 0.9 }]}>
              <Text style={styles.retryLabel}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && authKind === "none" && metrics ? (
          <View style={styles.grid}>
            <MetricTile label="Total bookings" value={String(metrics.totalBookings)} />
            <MetricTile label="Paid" value={String(metrics.paidBookings)} accent />
            <MetricTile label="Pending" value={String(metrics.pendingBookings)} />
            <MetricTile label="Processing" value={String(metrics.processingBookings)} />
            <View style={styles.wideCard}>
              <Text style={styles.wideLabel}>Gross revenue (paid)</Text>
              <Text style={styles.wideValue}>${metrics.grossRevenuePaid.toFixed(2)}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.tile, accent && styles.tileAccent]}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, accent && styles.tileValueAccent]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingBottom: 40 },
  back: { color: colors.gold, fontWeight: "600", fontSize: 16, marginBottom: 16 },
  kicker: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 8 },
  head: { color: colors.gold, fontSize: 26, fontWeight: "700", marginBottom: 10 },
  lead: { color: colors.muted, lineHeight: 22, marginBottom: 22, fontSize: 14 },
  centerBlock: { alignItems: "center", paddingVertical: 40 },
  muted: { color: colors.muted, marginTop: 12 },
  err: { color: colors.danger, marginBottom: 14, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  retry: {
    alignSelf: "flex-start",
    backgroundColor: colors.gold,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryLabel: { color: "#0a0a0a", fontWeight: "700" },
  browseLink: { marginTop: 12, alignSelf: "center" },
  browseLinkLabel: { color: colors.gold, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    width: "47%",
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  tileAccent: { borderColor: colors.goldDim },
  tileLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8 },
  tileValue: { color: colors.text, fontSize: 24, fontWeight: "800" },
  tileValueAccent: { color: colors.gold },
  wideCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginTop: 4,
  },
  wideLabel: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8 },
  wideValue: { color: colors.gold, fontSize: 28, fontWeight: "800" },
});
