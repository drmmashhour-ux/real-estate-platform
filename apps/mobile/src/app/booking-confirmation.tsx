import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config";
import { colors } from "../theme/colors";
import { InsuranceLeadForm } from "../components/InsuranceLeadForm";
import { requestStoreReviewAfterBooking } from "../lib/requestStoreReviewAfterBooking";
import { supabase } from "../lib/supabase";

function paramFirst(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

type BookingRow = {
  id: string;
  listing_id: string;
  dates: unknown;
  total_price: number;
  status: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string | null;
  listings: { title: string } | null;
};

function nightsFromDates(dates: unknown): number {
  if (Array.isArray(dates)) return dates.length;
  return 0;
}

const POLL_MS = 3500;
const MAX_POLLS = 20;

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={[styles.skelLine, { width: "35%" }]} />
      <View style={[styles.skelLine, { width: "55%", marginTop: 14 }]} />
      <View style={[styles.skelLine, { width: "45%", marginTop: 12 }]} />
      <View style={[styles.skelLine, { width: "40%", marginTop: 12 }]} />
    </View>
  );
}

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string | string[] }>();
  const bid = paramFirst(bookingId);

  const [row, setRow] = useState<BookingRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef(0);
  const [insuranceVariant, setInsuranceVariant] = useState<"A" | "B">("A");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      try {
        const url = `${API_BASE_URL.replace(/\/$/, "")}/api/mobile/v1/bnhub/insurance/presentation-hint`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (!res.ok || cancelled) return;
        const j = (await res.json()) as { leadQualityTier?: string; score?: string };
        const tier = j.leadQualityTier ?? "";
        if (tier === "priority" || tier === "plus" || j.score === "high") {
          if (!cancelled) setInsuranceVariant("B");
        }
      } catch {
        /* default A */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchRow = useCallback(async () => {
    if (!bid) {
      setError("Missing booking id.");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/api/bookings/guest/${encodeURIComponent(bid)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const json = (await res.json().catch(() => ({}))) as {
        booking?: {
          id: string;
          listingId: string;
          dates: unknown;
          totalPrice: number;
          status: string;
          guestEmail: string | null;
          stripeCheckoutSessionId: string | null;
          stripePaymentIntentId: string | null;
          createdAt: string | null;
          updatedAt: string | null;
          listingTitle: string | null;
        };
        error?: string;
      };

      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "We could not load this booking. Pull to refresh.");
        setRow(null);
      } else if (!json.booking) {
        setError("Booking not found.");
        setRow(null);
      } else {
        const b = json.booking;
        setError(null);
        setRow({
          id: b.id,
          listing_id: b.listingId,
          dates: b.dates,
          total_price: b.totalPrice,
          status: b.status,
          stripe_checkout_session_id: b.stripeCheckoutSessionId,
          stripe_payment_intent_id: b.stripePaymentIntentId,
          created_at: b.createdAt ?? "",
          updated_at: b.updatedAt,
          listings: b.listingTitle ? { title: b.listingTitle } : null,
        });
      }
    } catch (e) {
      if (__DEV__) console.warn("[bnhub/booking-confirmation] fetch failed", e);
      setError("Network error — check EXPO_PUBLIC_API_BASE_URL.");
      setRow(null);
    }
    setLoading(false);
    setRefreshing(false);
  }, [bid]);

  useEffect(() => {
    pollRef.current = 0;
  }, [bid]);

  useEffect(() => {
    void fetchRow();
  }, [fetchRow]);

  useEffect(() => {
    if (!bid || !row) return;
    const st = row.status.toLowerCase();
    if (st === "paid" || st === "completed") return;
    if (st === "canceled" || st === "cancelled") return;

    const id = setInterval(() => {
      pollRef.current += 1;
      if (pollRef.current > MAX_POLLS) {
        clearInterval(id);
        return;
      }
      void fetchRow();
    }, POLL_MS);

    return () => clearInterval(id);
  }, [bid, row?.status, fetchRow]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchRow();
  }, [fetchRow]);

  const st = row?.status?.toLowerCase() ?? "";
  const isPaid = st === "paid" || st === "completed";
  const isCanceled = st === "canceled" || st === "cancelled";
  const isProcessing = st === "processing";
  const isPendingOnly = st === "pending";
  const awaitingWebhook = (isPendingOnly || isProcessing) && !isPaid && !isCanceled;

  const badgeMain = isPaid ? "Confirmed" : isCanceled ? "Canceled" : isProcessing ? "Checkout in progress" : "Awaiting payment";

  useEffect(() => {
    if (!isPaid || loading || !row || error) return;
    void requestStoreReviewAfterBooking();
  }, [isPaid, loading, row, error]);

  if (loading && !row) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.kicker}>BOOKING</Text>
          <Text style={styles.head}>Confirmation</Text>
          <SkeletonCard />
          <View style={styles.centerRow}>
            <ActivityIndicator size="small" color={colors.gold} />
            <Text style={styles.centerHint}>Loading your booking…</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
      >
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backWrap}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Pressable onPress={onRefresh} style={styles.refreshBtn} disabled={refreshing}>
            <Text style={styles.refreshLabel}>{refreshing ? "Refreshing…" : "Refresh"}</Text>
          </Pressable>
        </View>

        <Text style={styles.kicker}>BOOKING</Text>
        <Text style={styles.head}>Confirmation</Text>

        {error ? <Text style={styles.err}>{error}</Text> : null}

        {awaitingWebhook ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>{isProcessing ? "Stripe checkout open or in progress" : "Awaiting payment"}</Text>
            <Text style={styles.bannerBody}>
              The app never marks payment alone — wait for the server webhook, or pull to refresh. If checkout was canceled, return to Payment to try again.
            </Text>
          </View>
        ) : null}

        {row ? (
          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <Text style={styles.label}>Status</Text>
              <View
                style={[
                  styles.badge,
                  isPaid ? styles.badgePaid : isCanceled ? styles.badgeCanceled : styles.badgePending,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isPaid ? styles.badgeTextPaid : isCanceled ? styles.badgeTextCanceled : styles.badgeTextPending,
                  ]}
                >
                  {badgeMain}
                </Text>
              </View>
            </View>

            <Text style={styles.label}>Stay</Text>
            <Text style={styles.value}>{row.listings?.title ?? "BNHub stay"}</Text>

            <Text style={[styles.label, styles.labelSp]}>Nights</Text>
            <Text style={styles.value}>{nightsFromDates(row.dates)}</Text>

            <Text style={[styles.label, styles.labelSp]}>Total</Text>
            <Text style={styles.valueGold}>
              $
              {typeof row.total_price === "number" && row.total_price % 1 !== 0
                ? row.total_price.toFixed(2)
                : String(row.total_price)}
            </Text>

            <Text style={[styles.label, styles.labelSp]}>Booking ID</Text>
            <Text style={styles.mono} selectable>
              {row.id}
            </Text>
          </View>
        ) : null}

        {bid ? (
          <InsuranceLeadForm
            leadType="travel"
            source="bnbhub"
            bookingId={bid}
            listingId={row?.listing_id}
            variant={insuranceVariant}
            headline={
              insuranceVariant === "B"
                ? "Lock in travel protection before check-in"
                : "Get travel insurance for your stay"
            }
            subheadline={
              isPaid
                ? "Your trip is confirmed — optional travel coverage from a licensed partner."
                : "Planning your trip — optional travel coverage before or after payment."
            }
          />
        ) : null}

        {bid ? (
          <Pressable
            onPress={() => router.push({ pathname: "/booking-details", params: { bookingId: bid } })}
            style={({ pressed }) => [styles.ctaOutline, pressed && styles.ctaOutlinePressed]}
          >
            <Text style={styles.ctaOutlineLabel}>View booking details</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={() => router.replace("/(tabs)")} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <Text style={styles.ctaLabel}>Back to stays</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingBottom: 40 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  backWrap: { marginBottom: 8 },
  back: { color: colors.gold, fontWeight: "600", fontSize: 16 },
  refreshBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  refreshLabel: { color: colors.gold, fontWeight: "700", fontSize: 14 },
  kicker: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 8 },
  head: { color: colors.gold, fontSize: 28, fontWeight: "700", marginBottom: 16 },
  err: { color: colors.danger, marginBottom: 16, lineHeight: 22 },
  skeletonCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 20,
  },
  skelLine: {
    height: 14,
    borderRadius: 8,
    backgroundColor: colors.surface2,
  },
  centerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  centerHint: { color: colors.muted, fontSize: 14 },
  banner: {
    backgroundColor: colors.surface2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 18,
  },
  bannerTitle: { color: colors.text, fontWeight: "700", marginBottom: 8, fontSize: 15 },
  bannerBody: { color: colors.muted, lineHeight: 20, fontSize: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 22,
  },
  badgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.7 },
  labelSp: { marginTop: 16 },
  value: { color: colors.text, fontSize: 17, marginTop: 6, fontWeight: "600" },
  valueGold: { color: colors.gold, fontSize: 22, fontWeight: "700", marginTop: 6 },
  mono: { color: colors.text, fontSize: 12, marginTop: 6 },
  badge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, maxWidth: "68%" },
  badgePaid: { backgroundColor: "rgba(34, 197, 94, 0.15)", borderWidth: 1, borderColor: colors.success },
  badgePending: { backgroundColor: "rgba(212, 175, 55, 0.12)", borderWidth: 1, borderColor: colors.goldDim },
  badgeCanceled: { backgroundColor: "rgba(239, 68, 68, 0.12)", borderWidth: 1, borderColor: colors.danger },
  badgeText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.2 },
  badgeTextPaid: { color: colors.success },
  badgeTextPending: { color: colors.gold },
  badgeTextCanceled: { color: colors.danger },
  ctaOutline: {
    borderWidth: 1,
    borderColor: colors.gold,
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  ctaOutlinePressed: { opacity: 0.88 },
  ctaOutlineLabel: { fontWeight: "700", color: colors.gold, fontSize: 15 },
  cta: {
    backgroundColor: colors.gold,
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
  },
  ctaPressed: { opacity: 0.92 },
  ctaLabel: { fontWeight: "700", color: "#0a0a0a", fontSize: 16 },
});
