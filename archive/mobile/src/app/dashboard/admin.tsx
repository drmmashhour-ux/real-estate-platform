import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/AppScreen";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import { useAppAuth } from "@/hooks/useAuth";
import { theme } from "@/lib/theme";
import { fetchAdminDashboard } from "@/services/dashboard.api";

export default function AdminDashboardMobile() {
  const { session, ready } = useAppAuth();

  const q = useQuery({
    queryKey: ["mobile-dashboard-admin", session?.access_token],
    queryFn: () => fetchAdminDashboard(session!.access_token),
    enabled: ready && Boolean(session?.access_token),
  });

  if (!ready) {
    return (
      <AppScreen>
        <ActivityIndicator color={theme.colors.gold} />
      </AppScreen>
    );
  }

  if (!session?.access_token) {
    return (
      <AppScreen>
        <Text style={styles.eyebrow}>Admin</Text>
        <Text style={styles.title}>Sign in required</Text>
        <Text style={styles.bodyMuted}>Use an administrator account to load live platform metrics.</Text>
      </AppScreen>
    );
  }

  if (q.isPending) {
    return (
      <AppScreen>
        <ActivityIndicator color={theme.colors.gold} style={{ marginTop: 24 }} />
        <Text style={[styles.bodyMuted, { marginTop: 16 }]}>Loading admin metrics…</Text>
      </AppScreen>
    );
  }

  if (q.isError) {
    const raw = q.error instanceof Error ? q.error.message : String(q.error);
    const forbidden = raw.includes("403");
    const unauthorized = raw.includes("401");
    return (
      <AppScreen>
        <Text style={styles.title}>{forbidden ? "Access denied" : unauthorized ? "Session expired" : "Could not load"}</Text>
        <Text style={styles.bodyMuted}>
          {forbidden
            ? "Your account does not have platform admin privileges."
            : unauthorized
              ? "Sign in again and retry."
              : raw}
        </Text>
      </AppScreen>
    );
  }

  const data = q.data;
  const insights = data.insights?.length ? data.insights : ["No insights available for today’s window."];

  return (
    <AppScreen>
      <Text style={styles.eyebrow}>Admin</Text>
      <Text style={styles.title}>Command center</Text>

      <View style={styles.stats}>
        <StatCard label="Revenue" value={data.stats.revenueTodayDisplay} sub="Today (platform share)" />
        <StatCard label="Bookings" value={String(data.stats.bookingsToday)} sub="Created today" />
      </View>

      <View style={styles.stats}>
        <StatCard label="Leads" value={String(data.stats.leadsToday)} sub="Created today" />
        <StatCard label="Alerts" value={String(data.stats.alertsApprox)} sub="High-severity signals" />
      </View>

      <SectionCard>
        <Text style={styles.sectionTitle}>Signals</Text>
        {insights.map((line, i) => (
          <View key={`${i}-${line.slice(0, 24)}`} style={styles.item}>
            <Text style={styles.itemText}>{line}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Latest movement</Text>
        <Text style={styles.bodyMuted}>
          {data.movements[0]
            ? `${data.movements[0].hubLabel} · ${data.movements[0].detail}`
            : "No recent movements in this window."}
        </Text>
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
  },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 16,
  },
  bodyMuted: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  stats: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 14,
  },
  item: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#111111",
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
  },
  itemText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
