import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  type AppStateStatus,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config";
import { buildAuthHeaders } from "../lib/authHeaders";
import { bnhubBookingCheckoutUrls } from "../lib/checkoutDeepLinks";
import { bookingStatusBadgeLabel, isBookingCanceled, isBookingPaidLike } from "../lib/bookingStatusDisplay";
import { devCaptureBookingStatus } from "../lib/devDebug";
import { trackBnhubEvent } from "../lib/bnhubTrack";
import { colors } from "../theme/colors";

function paramFirst(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function formatMoneyCents(cents: number): string {
  if (!Number.isFinite(cents)) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

type CheckoutQuote =
  | {
      itemized: false;
      listingTitle: string;
      accommodationCents: number;
      totalCents: number;
    }
  | {
      itemized: true;
      listingTitle: string;
      accommodationCents: number;
      baseFeeCents: number;
      peakFeeCents: number;
      serviceFeeTotalCents: number;
      upsellCents: { insurance: number; earlyCheckIn: number; lateCheckOut: number };
      totalCents: number;
    };

export default function PaymentScreen() {
  const router = useRouter();
  const { bookingId, total, title, nights, paymentCancelled } = useLocalSearchParams<{
    bookingId: string | string[];
    total: string | string[];
    title: string | string[];
    nights: string | string[];
    paymentCancelled: string | string[];
  }>();

  const bid = paramFirst(bookingId);
  const tot = paramFirst(total);
  const ttl = paramFirst(title);
  const nts = paramFirst(nights);
  const cancelled = paramFirst(paymentCancelled);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const checkoutInFlight = useRef(false);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [upsells, setUpsells] = useState({
    insurance: false,
    earlyCheckIn: false,
    lateCheckOut: false,
  });

  const loadBookingStatus = useCallback(async () => {
    if (!bid) {
      setBookingStatus(null);
      setStatusLoading(false);
      return;
    }
    try {
      const base = API_BASE_URL.replace(/\/$/, "");
      const headers = await buildAuthHeaders();
      const prismaUrl = `${base}/api/mobile/v1/bookings/${encodeURIComponent(bid)}`;
      const pr = await fetch(prismaUrl, { headers });
      if (pr.ok) {
        const data = (await pr.json().catch(() => ({}))) as { booking?: { status?: string } };
        const st = typeof data.booking?.status === "string" ? data.booking.status : null;
        setBookingStatus(st);
        devCaptureBookingStatus(st);
        setStatusLoading(false);
        return;
      }
      const url = `${base}/api/bookings/guest/${encodeURIComponent(bid)}/status`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json().catch(() => ({}))) as { status?: string; error?: string };
      if (!res.ok) {
        setBookingStatus(null);
        if (__DEV__) {
          devCaptureBookingStatus(null);
          console.warn("[bnhub/payment] status fetch failed", res.status);
        }
      } else {
        const st = typeof data.status === "string" ? data.status : null;
        setBookingStatus(st);
        devCaptureBookingStatus(st);
      }
    } catch {
      setBookingStatus(null);
      if (__DEV__) console.warn("[bnhub/payment] status fetch network error");
    }
    setStatusLoading(false);
  }, [bid]);

  useEffect(() => {
    void loadBookingStatus();
  }, [loadBookingStatus]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active" && bid) void loadBookingStatus();
    });
    return () => sub.remove();
  }, [bid, loadBookingStatus]);

  useEffect(() => {
    if (cancelled === "1") {
      Alert.alert("Payment cancelled", "You can try again when you are ready.");
    }
  }, [cancelled]);

  const st = bookingStatus ?? "";
  const isPaid = isBookingPaidLike(st);
  const isCanceled = isBookingCanceled(st);
  const isProcessing = st.toLowerCase() === "processing";
  const canPay = bid && !isPaid && !isCanceled && !statusLoading;

  const loadCheckoutQuote = useCallback(async () => {
    if (!bid || isBookingPaidLike(bookingStatus ?? "") || isBookingCanceled(bookingStatus ?? "")) return;
    setQuoteLoading(true);
    try {
      const base = API_BASE_URL.replace(/\/$/, "");
      const q = new URLSearchParams({ bookingId: bid });
      if (upsells.insurance) q.set("insurance", "1");
      if (upsells.earlyCheckIn) q.set("earlyCheckIn", "1");
      if (upsells.lateCheckOut) q.set("lateCheckOut", "1");
      const res = await fetch(`${base}/api/mobile/v1/bnhub/checkout-quote?${q.toString()}`, {
        headers: { Accept: "application/json" },
      });
      const data = (await res.json().catch(() => ({}))) as CheckoutQuote & { error?: string };
      if (res.ok && typeof data.itemized === "boolean") {
        setQuote(data as CheckoutQuote);
        void trackBnhubEvent("checkout_quote_view", {
          bookingId: bid,
          itemized: data.itemized,
          totalCents: "totalCents" in data ? data.totalCents : null,
        });
      } else {
        setQuote(null);
      }
    } catch {
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, [bid, bookingStatus, upsells.insurance, upsells.earlyCheckIn, upsells.lateCheckOut]);

  useEffect(() => {
    void loadCheckoutQuote();
  }, [loadCheckoutQuote]);

  const setUpsell = useCallback(
    (key: keyof typeof upsells, value: boolean) => {
      setUpsells((u) => ({ ...u, [key]: value }));
      void trackBnhubEvent("upsell_toggled", { key, value: value ? 1 : 0, bookingId: bid ?? "" });
    },
    [bid]
  );

  const startCheckout = useCallback(async () => {
    if (!bid || isPaid || isCanceled || checkoutInFlight.current) return;

    checkoutInFlight.current = true;
    const url = `${API_BASE_URL.replace(/\/$/, "")}/api/stripe/checkout`;
    setCheckoutLoading(true);
    try {
      const { successUrl, cancelUrl } = bnhubBookingCheckoutUrls(bid);
      const headers = await buildAuthHeaders({
        "Content-Type": "application/json",
      });
      /** Supabase guest checkout: server validates URLs; `bookingId` is set in Stripe session metadata. */
      const payload: Record<string, unknown> = {
        bookingId: bid,
        successUrl,
        cancelUrl,
      };
      if (quote?.itemized) {
        payload.upsells = {
          insurance: upsells.insurance,
          earlyCheckIn: upsells.earlyCheckIn,
          lateCheckOut: upsells.lateCheckOut,
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

      if (!res.ok) {
        const raw = typeof data.error === "string" ? data.error : "";
        const msg =
          raw && raw.trim()
            ? raw
            : "We could not start checkout. Check your connection and try again.";
        Alert.alert("Payment could not start", `${msg}\n\nTap Pay again to retry.`);
        return;
      }

      if (data.url && typeof data.url === "string") {
        const can = await Linking.canOpenURL(data.url);
        if (can) {
          void trackBnhubEvent("start_checkout", { bookingId: bid });
          await Linking.openURL(data.url);
          void loadBookingStatus();
        } else {
          Alert.alert(
            "Open checkout",
            "This device could not open Stripe. Complete payment on another device or open the checkout URL from your email when available."
          );
        }
      } else {
        Alert.alert("Error", "Failed to start payment (no checkout URL).");
      }
    } catch {
      Alert.alert("Connection error", "Check your network and tap Pay again to retry.");
    } finally {
      setCheckoutLoading(false);
      checkoutInFlight.current = false;
    }
  }, [bid, isPaid, isCanceled, loadBookingStatus, quote, upsells.insurance, upsells.earlyCheckIn, upsells.lateCheckOut]);

  const goBookingDetails = () => {
    if (bid) router.push({ pathname: "/booking-details", params: { bookingId: bid } });
  };

  const goBookingStatus = () => {
    if (bid) router.push({ pathname: "/booking-confirmation", params: { bookingId: bid } });
  };

  if (!bid) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.container}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <View style={styles.missingCard}>
            <Text style={styles.missingTitle}>No booking</Text>
            <Text style={styles.missingBody}>We could not find a booking reference. Start from a listing and confirm your stay again.</Text>
          </View>
          <Pressable
            onPress={() => router.replace("/(tabs)")}
            style={({ pressed }) => [styles.ctaGold, pressed && styles.ctaGoldPressed]}
          >
            <Text style={styles.ctaGoldLabel}>Browse stays</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.kicker}>SECURE CHECKOUT</Text>
        <Text style={styles.head}>Complete payment</Text>
        <Text style={styles.lead}>
          The server verifies the amount from your booking. This device only opens Stripe Checkout — no card data is stored here.
        </Text>

        <View style={styles.trustRow}>
          <Text style={styles.trustText}>Secure payment</Text>
          <Text style={styles.trustDot}>·</Text>
          <Text style={styles.trustText}>Verified host</Text>
        </View>

        {isPaid ? (
          <View style={styles.paidBanner}>
            <Text style={styles.paidTitle}>Already paid</Text>
            <Text style={styles.paidBody}>This booking is paid. No further payment is needed.</Text>
          </View>
        ) : null}

        {isCanceled ? (
          <View style={styles.canceledBanner}>
            <Text style={styles.canceledTitle}>Booking canceled</Text>
            <Text style={styles.canceledBody}>Payment is not available for this booking. Create a new booking if you still need a stay.</Text>
          </View>
        ) : null}

        {isProcessing && !isPaid ? (
          <View style={styles.processingBanner}>
            <Text style={styles.processingTitle}>Checkout started</Text>
            <Text style={styles.processingBody}>
              Finish payment in the Stripe window, or tap Pay now again to open a fresh checkout link. Only the server webhook marks this as paid.
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Row label="Booking ID" value={bid} mono />
          <Row label="Stay" value={ttl || "BNHub stay"} />
          <Row label="Nights" value={nts ?? "—"} />
          <Row
            label="Total (estimate)"
            value={
              quote
                ? formatMoneyCents(quote.totalCents)
                : tot
                  ? `$${tot}`
                  : quoteLoading
                    ? "…"
                    : "—"
            }
            highlight
          />
          {!statusLoading ? (
            <Row
              label="Status"
              value={bookingStatusBadgeLabel(bookingStatus ?? "")}
              statusTone={isPaid ? "paid" : isCanceled ? "canceled" : isProcessing ? "processing" : "pending"}
            />
          ) : (
            <View style={styles.statusRow}>
              <Text style={styles.rowLabel}>Status</Text>
              <ActivityIndicator size="small" color={colors.gold} />
            </View>
          )}
        </View>

        {quote?.itemized && !isPaid && !isCanceled ? (
          <View style={styles.upsellCard}>
            <Text style={styles.upsellTitle}>Add-ons (optional)</Text>
            <Text style={styles.upsellHint}>Shown when itemized checkout is enabled on the server.</Text>
            <UpsellRow
              label={`Travel peace of mind · ${formatMoneyCents(quote.upsellCents.insurance)}`}
              value={upsells.insurance}
              onValueChange={(v) => setUpsell("insurance", v)}
            />
            <UpsellRow
              label={`Early check-in · ${formatMoneyCents(quote.upsellCents.earlyCheckIn)}`}
              value={upsells.earlyCheckIn}
              onValueChange={(v) => setUpsell("earlyCheckIn", v)}
            />
            <UpsellRow
              label={`Late check-out · ${formatMoneyCents(quote.upsellCents.lateCheckOut)}`}
              value={upsells.lateCheckOut}
              onValueChange={(v) => setUpsell("lateCheckOut", v)}
            />
            <Text style={styles.upsellTotal}>
              Total with add-ons & fees: {formatMoneyCents(quote.totalCents)}
            </Text>
          </View>
        ) : null}

        {isPaid ? (
          <Pressable onPress={goBookingDetails} style={({ pressed }) => [styles.ctaGold, pressed && styles.ctaGoldPressed]}>
            <Text style={styles.ctaGoldLabel}>View booking details</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => void startCheckout()}
          disabled={checkoutLoading || !canPay}
          style={({ pressed }) => [
            styles.pay,
            (checkoutLoading || !canPay) && styles.payDisabled,
            pressed && canPay && !checkoutLoading && styles.payPressed,
          ]}
        >
          {checkoutLoading ? (
            <ActivityIndicator color="#0a0a0a" />
          ) : (
            <Text style={styles.payLabel}>
              {isPaid ? "Paid" : isCanceled ? "Unavailable" : isProcessing ? "Open checkout again" : "Confirm & Pay"}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={goBookingStatus} disabled={!bid} style={styles.ghost}>
          <Text style={styles.ghostLabel}>Live payment status</Text>
        </Pressable>

        <Text style={styles.note}>
          After Stripe, return to the app — status refreshes when the app becomes active again.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function UpsellRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.upsellRow}>
      <Text style={styles.upsellLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.goldDim }}
        thumbColor={value ? colors.gold : colors.muted}
      />
    </View>
  );
}

function Row({
  label,
  value,
  highlight,
  mono,
  statusTone,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
  statusTone?: "paid" | "pending" | "canceled" | "processing";
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          highlight && styles.rowValueHighlight,
          mono && styles.rowMono,
          statusTone === "paid" && styles.rowPaid,
          (statusTone === "pending" || statusTone === "processing") && styles.rowPending,
          statusTone === "canceled" && styles.rowCanceled,
        ]}
        numberOfLines={mono ? 2 : 3}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 24 },
  back: { color: colors.gold, fontWeight: "600", fontSize: 16, marginBottom: 20 },
  kicker: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 8,
  },
  head: { color: colors.gold, fontSize: 28, fontWeight: "700", marginBottom: 10 },
  lead: { color: colors.muted, lineHeight: 22, marginBottom: 12, fontSize: 15 },
  trustRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 },
  trustText: { color: colors.goldDim, fontSize: 13, fontWeight: "800" },
  trustDot: { color: colors.muted },
  missingCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    marginBottom: 20,
  },
  missingTitle: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 10 },
  missingBody: { color: colors.muted, lineHeight: 22, fontSize: 15 },
  paidBanner: {
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  paidTitle: { color: colors.success, fontWeight: "800", fontSize: 15, marginBottom: 6 },
  paidBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  canceledBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  canceledTitle: { color: colors.danger, fontWeight: "800", fontSize: 15, marginBottom: 6 },
  canceledBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  processingBanner: {
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    borderWidth: 1,
    borderColor: colors.goldDim,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  processingTitle: { color: colors.gold, fontWeight: "800", fontSize: 15, marginBottom: 6 },
  processingBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 18,
    gap: 16,
  },
  row: { gap: 6 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { color: colors.muted, fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  rowValue: { color: colors.text, fontSize: 17 },
  rowValueHighlight: { color: colors.gold, fontSize: 20, fontWeight: "700" },
  rowMono: { fontSize: 13 },
  rowPaid: { color: colors.success, fontWeight: "700" },
  rowPending: { color: colors.gold, fontWeight: "600" },
  rowCanceled: { color: colors.danger, fontWeight: "600" },
  ctaGold: {
    backgroundColor: colors.gold,
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
    minHeight: 52,
    justifyContent: "center",
  },
  ctaGoldPressed: { opacity: 0.92 },
  pay: {
    backgroundColor: colors.gold,
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
  },
  payDisabled: { opacity: 0.48 },
  payPressed: { opacity: 0.92 },
  payLabel: { textAlign: "center", fontWeight: "700", color: "#0a0a0a", fontSize: 17 },
  ctaGoldLabel: { fontWeight: "700", color: "#0a0a0a", fontSize: 16 },
  ghost: {
    marginTop: 4,
    paddingVertical: 14,
    alignItems: "center",
  },
  ghostLabel: { color: colors.gold, fontWeight: "700", fontSize: 15 },
  upsellCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 18,
  },
  upsellTitle: { color: colors.gold, fontWeight: "800", fontSize: 15, marginBottom: 6 },
  upsellHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  upsellRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  upsellLabel: { color: colors.text, fontSize: 14, flex: 1 },
  upsellTotal: { color: colors.textMuted, fontSize: 13, marginTop: 8, fontWeight: "600" },
  note: { color: colors.muted, marginTop: 18, lineHeight: 22, fontSize: 13 },
});
