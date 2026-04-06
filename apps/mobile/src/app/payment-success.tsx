import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config";
import { devCapturePaymentSuccess } from "../lib/devDebug";
import { isBookingPaidLike } from "../lib/bookingStatusDisplay";
import { trackBnhubEvent } from "../lib/bnhubTrack";
import { requestStoreReviewAfterBooking } from "../lib/requestStoreReviewAfterBooking";
import { colors } from "../theme/colors";

function paramFirst(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

type GuestSnap = {
  listingTitle: string | null;
  totalPrice: number;
  status: string;
  dates: unknown;
  instructions: string | null;
};

function stayLine(dates: unknown): string {
  if (!Array.isArray(dates) || dates.length === 0) return "—";
  const strs = dates.filter((d): d is string => typeof d === "string");
  if (strs.length === 0) return `${dates.length} nights`;
  const sorted = [...strs].sort();
  return `${sorted[0]} → ${sorted[sorted.length - 1]} (${sorted.length} nights)`;
}

/** After Stripe: deep link `…/payment-success?bookingId=…&session_id=…`. */
export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { bookingId, session_id } = useLocalSearchParams<{
    bookingId: string | string[];
    session_id: string | string[];
  }>();

  const bid = paramFirst(bookingId);
  const sid = paramFirst(session_id);

  const [snap, setSnap] = useState<GuestSnap | null>(null);
  const [snapLoading, setSnapLoading] = useState(true);
  const [snapErr, setSnapErr] = useState<string | null>(null);

  useEffect(() => {
    if (__DEV__ && bid) {
      devCapturePaymentSuccess(bid, sid ?? null);
    }
  }, [bid, sid]);

  useEffect(() => {
    if (bid) {
      void trackBnhubEvent("payment_success", { bookingId: bid });
    }
  }, [bid]);

  useEffect(() => {
    if (!bid) {
      setSnapLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const url = `${API_BASE_URL.replace(/\/$/, "")}/api/bookings/guest/${encodeURIComponent(bid)}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = (await res.json().catch(() => ({}))) as {
          booking?: GuestSnap;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.booking) {
          setSnapErr(typeof data.error === "string" ? data.error : "Could not load booking yet.");
          setSnap(null);
        } else {
          setSnap(data.booking);
          setSnapErr(null);
        }
      } catch {
        if (!cancelled) {
          setSnapErr("Network error — open View booking for details.");
          setSnap(null);
        }
      } finally {
        if (!cancelled) setSnapLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bid]);

  const shareStay = useCallback(async () => {
    const msg = bid
      ? `I booked a stay on BNHub (LECIPM). Ref: ${bid}`
      : "I booked a stay on BNHub — LECIPM.";
    try {
      await Share.share({ message: msg, title: "BNHub stay" });
    } catch {
      Alert.alert("Share", "Sharing is not available on this device.");
    }
  }, [bid]);

  const paidLike = snap ? isBookingPaidLike(snap.status) : false;

  useEffect(() => {
    if (!paidLike || snapLoading || !snap) return;
    void requestStoreReviewAfterBooking();
  }, [paidLike, snapLoading, snap]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Text style={styles.kicker}>BNHUB</Text>
        <Text style={styles.emoji} accessibilityLabel="Success">
          ✓
        </Text>
        <Text style={styles.head}>Booking confirmed</Text>
        <Text style={styles.sub}>
          {paidLike
            ? "Payment received — your stay is confirmed. Host instructions (if any) appear below."
            : "Stripe accepted your payment. Your booking record may take a moment to update — pull to refresh from booking details if needed."}
        </Text>

        {snapLoading ? (
          <ActivityIndicator color={colors.gold} style={{ marginVertical: 16 }} />
        ) : null}

        {snapErr && !snapLoading ? <Text style={styles.warn}>{snapErr}</Text> : null}

        {bid ? (
          <View style={styles.card}>
            <Text style={styles.label}>Booking ID</Text>
            <Text style={styles.value} selectable>
              {bid}
            </Text>
            {snap ? (
              <>
                <Text style={[styles.label, styles.labelSp]}>Stay</Text>
                <Text style={styles.value}>{snap.listingTitle ?? "BNHub stay"}</Text>
                <Text style={[styles.label, styles.labelSp]}>Dates</Text>
                <Text style={styles.value}>{stayLine(snap.dates)}</Text>
                <Text style={[styles.label, styles.labelSp]}>Total</Text>
                <Text style={styles.valueGold}>
                  ${typeof snap.totalPrice === "number" && snap.totalPrice % 1 !== 0 ? snap.totalPrice.toFixed(2) : String(snap.totalPrice)}
                </Text>
              </>
            ) : null}
            {sid ? (
              <>
                <Text style={[styles.label, styles.labelSp]}>Session</Text>
                <Text style={styles.meta} numberOfLines={2} selectable>
                  {sid}
                </Text>
              </>
            ) : null}
          </View>
        ) : (
          <Text style={styles.warn}>Missing booking reference. Keep your Stripe receipt email.</Text>
        )}

        {paidLike && snap?.instructions?.trim() ? (
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>From your host</Text>
            <Text style={styles.instructionsBody}>{snap.instructions.trim()}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => void shareStay()}
          style={({ pressed }) => [styles.shareCta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.shareCtaLabel}>Invite friends / Share your stay</Text>
        </Pressable>

        <Pressable
          onPress={() => bid && router.replace({ pathname: "/booking-details", params: { bookingId: bid } })}
          style={({ pressed }) => [styles.cta, !bid && styles.ctaDisabled, pressed && bid && styles.ctaPressed]}
          disabled={!bid}
        >
          <Text style={styles.ctaLabel}>View booking</Text>
        </Pressable>

        <Pressable
          onPress={() => bid && router.replace({ pathname: "/booking-confirmation", params: { bookingId: bid } })}
          style={styles.secondary}
          disabled={!bid}
        >
          <Text style={styles.secondaryLabel}>Payment status</Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/(tabs)")} style={styles.tertiary}>
          <Text style={styles.tertiaryLabel}>Back to stays</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  kicker: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 8,
  },
  emoji: {
    fontSize: 52,
    color: colors.success,
    textAlign: "center",
    marginBottom: 12,
  },
  head: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  sub: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    fontSize: 15,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.goldDim,
    padding: 20,
    marginBottom: 16,
  },
  instructionsCard: {
    backgroundColor: colors.surface2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 18,
  },
  instructionsTitle: { color: colors.gold, fontWeight: "800", fontSize: 14, marginBottom: 8 },
  instructionsBody: { color: colors.text, fontSize: 14, lineHeight: 22 },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  labelSp: { marginTop: 16 },
  value: { color: colors.text, fontSize: 15, marginTop: 8, fontWeight: "600" },
  valueGold: { color: colors.gold, fontSize: 18, marginTop: 8, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: 12, marginTop: 8 },
  warn: { color: colors.danger, textAlign: "center", marginBottom: 16, lineHeight: 20 },
  shareCta: {
    borderWidth: 1,
    borderColor: colors.gold,
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  shareCtaLabel: { color: colors.gold, fontWeight: "800", fontSize: 15 },
  cta: {
    backgroundColor: colors.gold,
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaPressed: { opacity: 0.92 },
  ctaLabel: { fontWeight: "700", color: "#0a0a0a", fontSize: 16 },
  secondary: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryLabel: { color: colors.gold, fontWeight: "700", fontSize: 15 },
  tertiary: {
    paddingVertical: 10,
    alignItems: "center",
  },
  tertiaryLabel: { color: colors.muted, fontWeight: "600", fontSize: 14 },
});
