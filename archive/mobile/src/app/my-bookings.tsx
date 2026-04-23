import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config";
import { buildAuthHeaders } from "../lib/authHeaders";
import { useAppAuth } from "../hooks/useAuth";
import { colors } from "../theme/colors";

type Row = {
  id: string;
  listingId: string;
  dates: unknown;
  total: number;
  status: string;
  guestEmail: string | null;
  updatedAt: string | null;
  listingTitle: string | null;
  listingCity: string | null;
};

function formatDates(dates: unknown): string {
  if (!Array.isArray(dates) || dates.length === 0) return "—";
  const first = typeof dates[0] === "string" ? dates[0] : null;
  const last =
    typeof dates[dates.length - 1] === "string" ? (dates[dates.length - 1] as string) : null;
  if (first && last) return `${first} → ${last} (${dates.length} night${dates.length === 1 ? "" : "s"})`;
  return `${dates.length} night${dates.length === 1 ? "" : "s"}`;
}

export default function MyBookingsScreen() {
  const router = useRouter();
  const { session, ready } = useAppAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Row[]>([]);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      setBookings([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/api/mobile/v1/bnhub/my-bookings`;
      const headers = await buildAuthHeaders();
      const res = await fetch(url, { headers });
      const data = (await res.json().catch(() => ({}))) as { bookings?: Row[]; error?: string };
      if (res.status === 401) {
        setError("sign_in");
        setBookings([]);
        return;
      }
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not load bookings.");
        setBookings([]);
        return;
      }
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch {
      setError("Network error — check EXPO_PUBLIC_API_BASE_URL.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  const unauthorized = !session;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.kicker}>ACCOUNT</Text>
        <Text style={styles.head}>My bookings</Text>
        <Text style={styles.lead}>
          Stays linked to your signed-in account (BNHub Supabase), plus guest bookings made with the same email
          before you signed in.
        </Text>

        {unauthorized ? (
          <View style={styles.card}>
            <Text style={styles.muted}>Sign in to see bookings tied to your account.</Text>
            <Pressable
              onPress={() => router.push("/(auth)/sign-in")}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
            >
              <Text style={styles.primaryBtnLabel}>Sign in</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/(tabs)")} style={styles.textLink}>
              <Text style={styles.textLinkLabel}>Continue as guest</Text>
            </Pressable>
          </View>
        ) : null}

        {!unauthorized && loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.muted}>Loading…</Text>
          </View>
        ) : null}

        {!unauthorized && !loading && error === "sign_in" ? (
          <View style={styles.card}>
            <Text style={styles.err}>Session expired. Sign in again.</Text>
            <Pressable
              onPress={() => router.push("/(auth)/sign-in")}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
            >
              <Text style={styles.primaryBtnLabel}>Sign in</Text>
            </Pressable>
          </View>
        ) : null}

        {!unauthorized && !loading && error && error !== "sign_in" ? (
          <View style={styles.card}>
            <Text style={styles.err}>{error}</Text>
            <Pressable onPress={() => void load()} style={({ pressed }) => [styles.retry, pressed && { opacity: 0.9 }]}>
              <Text style={styles.retryLabel}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!unauthorized && !loading && !error && bookings.length === 0 ? (
          <View style={styles.cardMuted}>
            <Text style={styles.muted}>No bookings yet. Browse stays and confirm a trip — ownership saves here when you are signed in.</Text>
          </View>
        ) : null}

        {!unauthorized && !loading && !error && bookings.length > 0 ? (
          <View style={styles.list}>
            {bookings.map((b) => (
              <View key={b.id} style={styles.row}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {b.listingTitle?.trim() || "BNHub stay"}
                </Text>
                {b.listingCity ? <Text style={styles.rowCity}>{b.listingCity}</Text> : null}
                <Text style={styles.rowMeta}>{formatDates(b.dates)}</Text>
                <Text style={styles.rowMeta}>
                  ${Number.isInteger(b.total) ? b.total.toFixed(0) : b.total.toFixed(2)} · {b.status}
                </Text>
                <Pressable
                  onPress={() =>
                    router.push({ pathname: "/booking-details", params: { bookingId: b.id } })
                  }
                  style={({ pressed }) => [styles.rowCta, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.rowCtaLabel}>View details & receipt</Text>
                </Pressable>
              </View>
            ))}
          </View>
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
  head: { color: colors.gold, fontSize: 26, fontWeight: "700", marginBottom: 10 },
  lead: { color: colors.muted, lineHeight: 22, marginBottom: 22, fontSize: 14 },
  centerBlock: { alignItems: "center", paddingVertical: 32 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  err: { color: colors.danger, marginBottom: 12, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  cardMuted: {
    backgroundColor: colors.surface2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnLabel: { color: "#0a0a0a", fontWeight: "700" },
  textLink: { marginTop: 14, alignItems: "center" },
  textLinkLabel: { color: colors.gold, fontWeight: "600" },
  retry: {
    alignSelf: "flex-start",
    backgroundColor: colors.gold,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  retryLabel: { color: "#0a0a0a", fontWeight: "700" },
  list: { gap: 12 },
  row: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 4 },
  rowCity: { color: colors.muted, fontSize: 13, marginBottom: 6 },
  rowMeta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  rowCta: {
    marginTop: 14,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  rowCtaLabel: { color: colors.gold, fontWeight: "700", fontSize: 14 },
});
