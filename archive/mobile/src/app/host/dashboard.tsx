import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../../config";
import { buildAuthHeaders } from "../../lib/authHeaders";
import { colors } from "../../theme/colors";

type Row = {
  id: string;
  listingId: string;
  dates: unknown;
  total: number;
  status: string;
  guestEmail: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type AutoMsgLog = {
  id: string;
  bookingId: string;
  triggerType: string;
  status: string;
  recipient: string;
  content: string;
  createdAt: string;
};

function formatDates(dates: unknown): string {
  if (!Array.isArray(dates) || dates.length === 0) return "—";
  const first = typeof dates[0] === "string" ? dates[0] : null;
  const last =
    typeof dates[dates.length - 1] === "string" ? (dates[dates.length - 1] as string) : null;
  if (first && last) return `${first} → ${last} (${dates.length}n)`;
  return `${dates.length} nights`;
}

function statusStyle(status: string) {
  const s = status.toLowerCase();
  if (s === "paid" || s === "completed") return styles.badgePaid;
  if (s === "canceled" || s === "cancelled") return styles.badgeBad;
  if (s === "processing") return styles.badgeProcessing;
  return styles.badgePending;
}

export default function HostDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Row[]>([]);
  const [attentionCount, setAttentionCount] = useState(0);
  const [autoLogs, setAutoLogs] = useState<AutoMsgLog[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const base = API_BASE_URL.replace(/\/$/, "");
      const headers = await buildAuthHeaders();
      const [bookingsRes, autoRes] = await Promise.all([
        fetch(`${base}/api/mobile/v1/bnhub/host/bookings`, { headers }),
        fetch(`${base}/api/mobile/v1/bnhub/host/automated-messages`, { headers }),
      ]);
      const data = (await bookingsRes.json().catch(() => ({}))) as {
        bookings?: Row[];
        attentionCount?: number;
        error?: string;
      };
      const autoData = (await autoRes.json().catch(() => ({}))) as { logs?: AutoMsgLog[] };
      if (bookingsRes.status === 401) {
        setError("Unauthorized — sign in as a host.");
        setBookings([]);
        setAttentionCount(0);
        setAutoLogs([]);
        return;
      }
      if (!bookingsRes.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not load bookings.");
        setBookings([]);
        setAttentionCount(0);
        setAutoLogs([]);
        return;
      }
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      setAttentionCount(typeof data.attentionCount === "number" ? data.attentionCount : 0);
      setAutoLogs(Array.isArray(autoData.logs) ? autoData.logs : []);
    } catch {
      setError("Network error — check EXPO_PUBLIC_API_BASE_URL.");
      setBookings([]);
      setAttentionCount(0);
      setAutoLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <View style={styles.titleRow}>
          <Text style={styles.head}>Host dashboard</Text>
          {attentionCount > 0 ? (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{attentionCount}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.lead}>
          Bookings for your BNHub listings (Supabase). New or unpaid stays show in the badge — open a booking to add
          guest instructions.
        </Text>

        {attentionCount > 0 ? (
          <View style={styles.notifBanner}>
            <Text style={styles.notifBannerTitle}>New booking activity</Text>
            <Text style={styles.notifBannerBody}>
              {attentionCount} reservation{attentionCount === 1 ? "" : "s"} need payment or follow-up (pending /
              processing).
            </Text>
          </View>
        ) : null}

        {autoLogs.length > 0 ? (
          <View style={styles.autoSection}>
            <Text style={styles.autoSectionTitle}>Messaging automation</Text>
            <Text style={styles.autoSectionHint}>
              Drafts and sent messages from BNHub automation (approve drafts in web Autopilot when using draft mode).
            </Text>
            {autoLogs.slice(0, 6).map((log) => (
              <View key={log.id} style={styles.autoRow}>
                <Text style={styles.autoRowMeta}>
                  {log.triggerType} · {log.status} · {log.recipient}
                </Text>
                <Text style={styles.autoRowBody} numberOfLines={3}>
                  {log.content}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {loading ? <ActivityIndicator color={colors.gold} style={{ marginVertical: 24 }} /> : null}
        {error ? <Text style={styles.err}>{error}</Text> : null}

        {!loading && !error && bookings.length === 0 ? (
          <Text style={styles.muted}>
            No Supabase bookings yet. Set `host_user_id` on your listings to match your Supabase Auth user id.
          </Text>
        ) : null}

        {bookings.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => router.push(`/host/bookings/${b.id}`)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {b.id.slice(0, 8)}…
              </Text>
              <View style={[styles.badge, statusStyle(b.status)]}>
                <Text style={styles.badgeText}>{b.status}</Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>{formatDates(b.dates)}</Text>
            <Text style={styles.cardMeta}>${typeof b.total === "number" ? b.total.toFixed(2) : b.total}</Text>
            {b.guestEmail ? (
              <Text style={styles.cardEmail} numberOfLines={1}>
                {b.guestEmail}
              </Text>
            ) : (
              <Text style={styles.cardMuted}>Guest email not captured</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  back: { color: colors.gold, fontWeight: "600", fontSize: 16, marginBottom: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  head: { color: colors.text, fontSize: 26, fontWeight: "800", flex: 1 },
  notifBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  notifBadgeText: { color: "#fff", fontWeight: "900", fontSize: 13 },
  lead: { color: colors.muted, lineHeight: 22, fontSize: 14, marginBottom: 16 },
  notifBanner: {
    backgroundColor: colors.surface2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.goldDim,
    padding: 14,
    marginBottom: 18,
  },
  notifBannerTitle: { color: colors.gold, fontWeight: "800", fontSize: 14, marginBottom: 6 },
  notifBannerBody: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  err: { color: colors.danger, marginBottom: 12 },
  muted: { color: colors.muted, lineHeight: 22, fontSize: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  cardTitle: { color: colors.text, fontWeight: "800", fontSize: 16, flex: 1 },
  cardMeta: { color: colors.muted, fontSize: 13, marginTop: 6 },
  cardEmail: { color: colors.text, fontSize: 13, marginTop: 8 },
  cardMuted: { color: colors.muted, fontSize: 12, marginTop: 8, fontStyle: "italic" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  badgePaid: { backgroundColor: "rgba(34, 197, 94, 0.15)" },
  badgePending: { backgroundColor: "rgba(212, 175, 55, 0.15)" },
  badgeProcessing: { backgroundColor: "rgba(59, 130, 246, 0.15)" },
  badgeBad: { backgroundColor: "rgba(239, 68, 68, 0.12)" },
  autoSection: {
    marginBottom: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  autoSectionTitle: { color: colors.text, fontWeight: "800", fontSize: 15, marginBottom: 6 },
  autoSectionHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 10 },
  autoRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  autoRowMeta: { color: colors.goldDim, fontSize: 11, fontWeight: "700", marginBottom: 4 },
  autoRowBody: { color: colors.muted, fontSize: 13, lineHeight: 19 },
});
