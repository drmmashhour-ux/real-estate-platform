import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config";
import { buildAuthHeaders } from "../lib/authHeaders";
import { colors } from "../theme/colors";

type Summary = {
  buckets: { hostKey: string; grossRevenue: number; bookingCount: number }[];
  totalGross: number;
  totalBookings: number;
};

type Recent = {
  id: string;
  listingTitle: string;
  total: number;
  updatedAt: string | null;
};

type WeeklyBar = { weekStart: string; label: string; amount: number };

type ConnectStatus = {
  needsPrismaProfile?: boolean;
  connected: boolean;
  onboardingComplete?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  accountId?: string | null;
  payoutEstimate?: {
    grossPaid: number;
    paidBookingCount: number;
    listingCount: number;
    note: string;
  } | null;
  bnhubListingCount?: number;
};

export default function HostEarningsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authKind, setAuthKind] = useState<"none" | "unauthorized" | "forbidden">("none");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentPaid, setRecentPaid] = useState<Recent[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState<WeeklyBar[]>([]);
  const [connect, setConnect] = useState<ConnectStatus | null>(null);
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectErr, setConnectErr] = useState<string | null>(null);

  const base = API_BASE_URL.replace(/\/$/, "");

  const load = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    setConnectErr(null);
    setAuthKind("none");
    try {
      const earningsUrl = `${base}/api/host/earnings`;
      const connectUrl = `${base}/api/mobile/v1/stripe/connect/status`;
      const headers = await buildAuthHeaders();
      const res = await fetch(earningsUrl, { headers });
      const data = (await res.json().catch(() => ({}))) as {
        summary?: Summary;
        recentPaid?: Recent[];
        weeklyRevenue?: WeeklyBar[];
        error?: string;
      };
      if (!res.ok) {
        setConnect(null);
        if (res.status === 401) {
          setAuthKind("unauthorized");
          setError(null);
        } else if (res.status === 403) {
          setAuthKind("forbidden");
          setError(null);
        } else {
          setError(typeof data.error === "string" ? data.error : "Could not load earnings.");
        }
        setSummary(null);
        setRecentPaid([]);
        setWeeklyRevenue([]);
        return;
      }

      const cRes = await fetch(connectUrl, { headers });
      const cJson = (await cRes.json().catch(() => ({}))) as ConnectStatus & { error?: string };
      if (cRes.ok) {
        setConnect({
          connected: Boolean(cJson.connected),
          needsPrismaProfile: cJson.needsPrismaProfile,
          onboardingComplete: cJson.onboardingComplete,
          chargesEnabled: cJson.chargesEnabled,
          payoutsEnabled: cJson.payoutsEnabled,
          detailsSubmitted: cJson.detailsSubmitted,
          accountId: cJson.accountId ?? null,
          payoutEstimate: cJson.payoutEstimate ?? null,
          bnhubListingCount: cJson.bnhubListingCount,
        });
      } else {
        setConnect(null);
        if (cRes.status !== 401) {
          setConnectErr(typeof cJson.error === "string" ? cJson.error : "Could not load payout status.");
        }
      }

      setAuthKind("none");
      setSummary(data.summary ?? null);
      setRecentPaid(Array.isArray(data.recentPaid) ? data.recentPaid : []);
      setWeeklyRevenue(Array.isArray(data.weeklyRevenue) ? data.weeklyRevenue : []);
    } catch {
      setError("Network error — check EXPO_PUBLIC_API_BASE_URL.");
      setSummary(null);
      setRecentPaid([]);
      setWeeklyRevenue([]);
      setConnect(null);
    } finally {
      if (mode === "initial") {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, [base]);

  useEffect(() => {
    void load("initial");
  }, [load]);

  const ensureConnectAccount = useCallback(async () => {
    setConnectBusy(true);
    setConnectErr(null);
    try {
      const headers = await buildAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch(`${base}/api/mobile/v1/stripe/connect/create-account`, {
        method: "POST",
        headers,
        body: "{}",
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setConnectErr(typeof j.error === "string" ? j.error : "Could not create payout account.");
        return;
      }
      await load("refresh");
    } catch {
      setConnectErr("Network error creating payout account.");
    } finally {
      setConnectBusy(false);
    }
  }, [base, load]);

  const openStripeOnboarding = useCallback(async () => {
    setConnectBusy(true);
    setConnectErr(null);
    try {
      const headers = await buildAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch(`${base}/api/mobile/v1/stripe/connect/onboarding-link`, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok) {
        setConnectErr(typeof j.error === "string" ? j.error : "Could not open Stripe onboarding.");
        return;
      }
      if (typeof j.url === "string" && j.url.length > 0) {
        await Linking.openURL(j.url);
      }
      await load("refresh");
    } catch {
      setConnectErr("Network error opening Stripe.");
    } finally {
      setConnectBusy(false);
    }
  }, [base, load]);

  const payoutReady =
    connect?.chargesEnabled === true &&
    connect?.payoutsEnabled === true &&
    connect?.onboardingComplete === true;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load("refresh")}
            tintColor={colors.gold}
          />
        }
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.kicker}>BNHUB HOST</Text>
        <Text style={styles.head}>Dashboard</Text>
        <Text style={styles.lead}>
          Gross revenue and paid booking activity. Guest checkout is unchanged — Stripe Connect is for future host payouts
          after onboarding.
        </Text>

        <Pressable
          onPress={() => router.push("/(host)/hub")}
          style={({ pressed }) => [styles.hubLink, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.hubLinkLabel}>Host hub — listings, promotions & guest chat →</Text>
        </Pressable>

        {authKind === "unauthorized" ? (
          <View style={styles.card}>
            <Text style={styles.err}>Sign in with a host account to view earnings.</Text>
            <Pressable
              onPress={() => router.push("/(auth)/sign-in")}
              style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}
            >
              <Text style={styles.retryLabel}>Sign in</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/(tabs)")} style={styles.browseLink}>
              <Text style={styles.browseLinkLabel}>Back to browse</Text>
            </Pressable>
          </View>
        ) : null}

        {authKind === "forbidden" ? (
          <View style={styles.card}>
            <Text style={styles.err}>This account does not have host access.</Text>
            <Pressable onPress={() => router.push("/(tabs)")} style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}>
              <Text style={styles.retryLabel}>Browse stays</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.muted}>Loading host metrics…</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.card}>
            <Text style={styles.err}>{error}</Text>
            <Pressable onPress={() => void load("initial")} style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}>
              <Text style={styles.retryLabel}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && authKind === "none" && summary ? (
          <>
            <Text style={styles.sectionKicker}>HOST PAYOUTS</Text>
            <View style={styles.connectCard}>
              <Text style={styles.connectTitle}>Stripe Connect</Text>
              <Text style={styles.connectLead}>
                Onboarding is separate from guest payment. Complete Connect so the platform can route payouts when split
                checkout is enabled.
              </Text>

              {connectErr ? <Text style={styles.errSmall}>{connectErr}</Text> : null}

              {connect?.needsPrismaProfile ? (
                <Text style={styles.muted}>
                  Link your LECIPM profile: use the same email as your web account so Stripe Connect can attach to your
                  platform user.
                </Text>
              ) : null}

              {payoutReady ? (
                <View style={styles.readyBadge}>
                  <Text style={styles.readyBadgeText}>Payout ready</Text>
                </View>
              ) : connect?.connected ? (
                <Text style={styles.mutedSmall}>
                  Onboarding: {connect?.onboardingComplete ? "complete" : "in progress"} · Charges{" "}
                  {connect?.chargesEnabled ? "on" : "off"} · Payouts {connect?.payoutsEnabled ? "on" : "off"}
                </Text>
              ) : connect ? (
                <Text style={styles.mutedSmall}>No connected account yet — create one to start Stripe onboarding.</Text>
              ) : (
                <Text style={styles.mutedSmall}>Payout status could not be loaded. Pull to refresh or try again later.</Text>
              )}

              {connect?.payoutEstimate ? (
                <View style={styles.payoutSummary}>
                  <Text style={styles.payoutSummaryKicker}>PAYOUT SUMMARY (SUPABASE)</Text>
                  <Text style={styles.payoutSummaryAmt}>${connect.payoutEstimate.grossPaid.toFixed(2)} gross</Text>
                  <Text style={styles.mutedSmall}>
                    {connect.payoutEstimate.paidBookingCount} paid booking
                    {connect.payoutEstimate.paidBookingCount === 1 ? "" : "s"} · {connect.payoutEstimate.listingCount}{" "}
                    listing
                    {connect.payoutEstimate.listingCount === 1 ? "" : "s"}
                  </Text>
                  <Text style={styles.payoutNote}>{connect.payoutEstimate.note}</Text>
                </View>
              ) : null}

              <View style={styles.connectActions}>
                {connect != null && !connect.connected && !connect.needsPrismaProfile ? (
                  <Pressable
                    onPress={() => void ensureConnectAccount()}
                    disabled={connectBusy}
                    style={({ pressed }) => [styles.connectBtn, pressed && styles.retryPressed, connectBusy && { opacity: 0.7 }]}
                  >
                    <Text style={styles.connectBtnLabel}>{connectBusy ? "Working…" : "Create payout account"}</Text>
                  </Pressable>
                ) : null}

                {connect != null && connect.connected && !payoutReady && !connect.needsPrismaProfile ? (
                  <Pressable
                    onPress={() => void openStripeOnboarding()}
                    disabled={connectBusy}
                    style={({ pressed }) => [styles.connectBtnOutline, pressed && styles.retryPressed, connectBusy && { opacity: 0.7 }]}
                  >
                    <Text style={styles.connectBtnOutlineLabel}>
                      {connectBusy ? "Opening…" : "Continue in Stripe"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <Text style={styles.atAGlance}>At a glance</Text>
            <Text style={styles.sectionKicker}>OVERVIEW</Text>
            <View style={styles.overviewGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Gross revenue</Text>
                <Text style={styles.metricValue}>${summary.totalGross.toFixed(2)}</Text>
                <Text style={styles.metricHint}>From paid guest bookings</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Bookings</Text>
                <Text style={styles.metricValueAlt}>{summary.totalBookings}</Text>
                <Text style={styles.metricHint}>Completed / paid count</Text>
              </View>
            </View>

            {summary.buckets.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>By host key</Text>
                {summary.buckets.map((b) => (
                  <View key={b.hostKey} style={styles.bucketRow}>
                    <Text style={styles.bucketKey} numberOfLines={1}>
                      {b.hostKey}
                    </Text>
                    <Text style={styles.bucketMeta}>
                      ${b.grossRevenue.toFixed(2)} · {b.bookingCount} booking{b.bookingCount === 1 ? "" : "s"}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={[styles.sectionKicker, styles.sectionKickerSp]}>WEEKLY REVENUE</Text>
            <View style={styles.chartCard}>
              <Text style={styles.chartHint}>Paid bookings by week (UTC). Placeholder chart — trend at a glance.</Text>
              {weeklyRevenue.length > 0 ? (
                (() => {
                  const maxAmt = Math.max(...weeklyRevenue.map((w) => w.amount), 1);
                  const trackH = 96;
                  return (
                    <View style={styles.chartBars}>
                      {weeklyRevenue.map((w) => {
                        const fillH = Math.max(4, Math.round((w.amount / maxAmt) * trackH));
                        return (
                          <View key={w.weekStart} style={styles.chartCol}>
                            <View style={[styles.chartBarTrack, { height: trackH }]}>
                              <View style={[styles.chartBarFill, { height: fillH }]} />
                            </View>
                            <Text style={styles.chartLabel} numberOfLines={1}>
                              {w.label}
                            </Text>
                            <Text style={styles.chartAmount} numberOfLines={1}>
                              {w.amount > 0 ? `$${w.amount.toFixed(0)}` : "—"}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })()
              ) : (
                <Text style={styles.muted}>No weekly data yet.</Text>
              )}
            </View>

            <Text style={[styles.sectionKicker, styles.sectionKickerSp]}>RECENT BOOKINGS</Text>
            {recentPaid.length > 0 ? (
              <View style={styles.card}>
                {recentPaid.map((r, i) => (
                  <View
                    key={r.id}
                    style={[styles.recentRow, i === recentPaid.length - 1 && styles.recentRowLast]}
                  >
                    <Text style={styles.recentTitle} numberOfLines={2}>
                      {r.listingTitle}
                    </Text>
                    <Text style={styles.recentAmount}>${r.total.toFixed(2)}</Text>
                    <Text style={styles.recentMeta}>
                      {r.updatedAt ? r.updatedAt.slice(0, 10) : "—"} · Paid
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.cardMuted}>
                <Text style={styles.muted}>No paid bookings in the recent window yet.</Text>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingBottom: 40 },
  back: { color: colors.gold, fontWeight: "600", fontSize: 16, marginBottom: 16 },
  kicker: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 8 },
  atAGlance: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  head: { color: colors.gold, fontSize: 28, fontWeight: "700", marginBottom: 10 },
  lead: { color: colors.muted, lineHeight: 22, marginBottom: 14, fontSize: 14 },
  hubLink: {
    alignSelf: "flex-start",
    marginBottom: 22,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  hubLinkLabel: { color: colors.gold, fontWeight: "800", fontSize: 14, textDecorationLine: "underline" },
  centerBlock: { alignItems: "center", paddingVertical: 32 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  mutedSmall: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  err: { color: colors.danger, marginBottom: 12, lineHeight: 20 },
  errSmall: { color: colors.danger, fontSize: 13, marginBottom: 10, lineHeight: 18 },
  sectionKicker: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionKickerSp: { marginTop: 8 },
  connectCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: 20,
    marginBottom: 20,
  },
  connectTitle: { color: colors.gold, fontSize: 17, fontWeight: "800", marginBottom: 8 },
  connectLead: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  readyBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 4,
    marginBottom: 8,
  },
  readyBadgeText: { color: colors.gold, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  payoutSummary: {
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  payoutSummaryKicker: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  payoutSummaryAmt: { color: colors.text, fontSize: 20, fontWeight: "800" },
  payoutNote: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 8 },
  connectActions: { marginTop: 16, gap: 10 },
  connectBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  connectBtnLabel: { color: "#0a0a0a", fontWeight: "800", fontSize: 15 },
  connectBtnOutline: {
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  connectBtnOutlineLabel: { color: colors.gold, fontWeight: "800", fontSize: 15 },
  overviewGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    minWidth: 0,
  },
  metricLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  metricValue: { color: colors.gold, fontSize: 26, fontWeight: "800", marginTop: 8 },
  metricValueAlt: { color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 8 },
  metricHint: { color: colors.muted, fontSize: 12, marginTop: 8, lineHeight: 17 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 16,
  },
  cardMuted: {
    backgroundColor: colors.surface2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: { color: colors.text, fontWeight: "700", marginBottom: 14, fontSize: 15 },
  bucketRow: { marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  bucketKey: { color: colors.text, fontSize: 14, fontWeight: "600", marginBottom: 4 },
  bucketMeta: { color: colors.muted, fontSize: 13 },
  recentRow: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  recentRowLast: { marginBottom: 0, paddingBottom: 0, borderBottomWidth: 0 },
  recentTitle: { color: colors.text, fontSize: 15, fontWeight: "600", marginBottom: 6 },
  recentAmount: { color: colors.gold, fontSize: 17, fontWeight: "700", marginBottom: 4 },
  recentMeta: { color: colors.muted, fontSize: 12 },
  retry: {
    alignSelf: "flex-start",
    backgroundColor: colors.gold,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryPressed: { opacity: 0.9 },
  retryLabel: { color: "#0a0a0a", fontWeight: "700" },
  browseLink: { marginTop: 12, alignSelf: "center" },
  browseLinkLabel: { color: colors.gold, fontWeight: "600" },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 16,
  },
  chartHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 16 },
  chartBars: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 4 },
  chartCol: { flex: 1, alignItems: "center", minWidth: 0 },
  chartBarTrack: {
    width: "100%",
    backgroundColor: colors.surface2,
    borderRadius: 8,
    justifyContent: "flex-end",
    overflow: "hidden",
    marginBottom: 8,
  },
  chartBarFill: {
    width: "100%",
    backgroundColor: colors.gold,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    minHeight: 4,
  },
  chartLabel: { color: colors.muted, fontSize: 9, textAlign: "center" },
  chartAmount: { color: colors.text, fontSize: 10, fontWeight: "600", marginTop: 2, textAlign: "center" },
});
