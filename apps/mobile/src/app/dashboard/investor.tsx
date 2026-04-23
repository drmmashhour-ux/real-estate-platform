import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/AppScreen";
import { EmptyState } from "@/components/EmptyState";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import { useAppAuth } from "@/hooks/useAuth";
import { theme } from "@/lib/theme";
import { fetchInvestorDashboard } from "@/services/dashboard.api";

export default function InvestorDashboardMobile() {
  const { session, ready } = useAppAuth();

  const q = useQuery({
    queryKey: ["mobile-dashboard-investor", session?.access_token],
    queryFn: () => fetchInvestorDashboard(session!.access_token),
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
        <EmptyState title="Investor dashboard" subtitle="Sign in to load portfolio scenarios and ROI signals." />
      </AppScreen>
    );
  }

  if (q.isPending) {
    return (
      <AppScreen>
        <ActivityIndicator color={theme.colors.gold} style={{ marginTop: 24 }} />
        <Text style={[styles.muted, { marginTop: 16 }]}>Loading portfolio…</Text>
      </AppScreen>
    );
  }

  if (q.isError) {
    return (
      <AppScreen>
        <Text style={styles.title}>Could not load</Text>
        <Text style={styles.muted}>{q.error instanceof Error ? q.error.message : "Unknown error"}</Text>
      </AppScreen>
    );
  }

  const data = q.data;

  if (!data.hasPortfolioData) {
    return (
      <AppScreen>
        <EmptyState title="Portfolio" subtitle={data.alerts[0] ?? "Create a scenario on the web app to unlock charts here."} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <Text style={styles.eyebrow}>Investor</Text>
      <Text style={styles.title}>Portfolio</Text>

      <View style={styles.stats}>
        <StatCard label="Value" value={data.stats.portfolioValueDisplay} sub="Modeled" />
        <StatCard label="Cash flow" value={data.stats.monthlyRevenueDisplay} sub="Monthly (est.)" />
      </View>

      <View style={styles.stats}>
        <StatCard label="ROI" value={data.stats.roiDisplay} sub="Blended" />
        <StatCard label="At risk" value={data.stats.revenueAtRiskDisplay} sub="Scenario" />
      </View>

      <SectionCard>
        <Text style={styles.sectionTitle}>Holdings</Text>
        <View style={styles.list}>
          {data.portfolio.map((p) => (
            <View key={p.id} style={styles.row}>
              <Text style={styles.rowTitle}>{p.name}</Text>
              <Text style={styles.rowMeta}>
                {p.location} · {p.revenueDisplay} · ROI {p.roiDisplay} · Risk {p.risk}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Alerts</Text>
        {data.alerts.map((a) => (
          <Text key={a} style={styles.alertLine}>
            • {a}
          </Text>
        ))}
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
  muted: {
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
  list: {
    gap: 12,
  },
  row: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#111111",
    borderRadius: 18,
    padding: 14,
  },
  rowTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  rowMeta: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  alertLine: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
});
