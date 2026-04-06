import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrustHostStrip } from "../components/TrustHostStrip";
import { VerifiedUserBadge } from "../components/VerifiedUserBadge";
import { API_BASE_URL } from "../config";
import { useAppAuth } from "../hooks/useAuth";
import { buildAuthHeaders } from "../lib/authHeaders";
import { nightDateStrings, nightsBetween } from "../lib/bookingDates";
import { isValidGuestEmail, normalizeGuestEmail } from "../lib/guestEmail";
import { trackBnhubEvent } from "../lib/bnhubTrack";
import { colors } from "../theme/colors";

function paramFirst(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function formatShortDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function BookingSummaryScreen() {
  const router = useRouter();
  const { me } = useAppAuth();
  const params = useLocalSearchParams<{
    listingId?: string | string[];
    price?: string | string[];
    title?: string | string[];
    checkIn?: string | string[];
    checkOut?: string | string[];
    guests?: string | string[];
    coverUrl?: string | string[];
  }>();

  const listingId = paramFirst(params.listingId) ?? "";
  const [listingTrust, setListingTrust] = useState<{
    hostRating: number | null;
    reviewCount: number;
    completedBookings: number;
    hostVerified: boolean;
    topHost: boolean;
  } | null>(null);

  useEffect(() => {
    const lid = listingId.trim();
    if (!lid) return;
    let active = true;
    void (async () => {
      try {
        const url = `${API_BASE_URL.replace(/\/$/, "")}/api/bnhub/public/listings/${encodeURIComponent(lid)}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = (await res.json().catch(() => ({}))) as {
          trust?: {
            hostRating: number | null;
            reviewCount: number;
            completedBookings: number;
            hostVerified: boolean;
            topHost: boolean;
          } | null;
        };
        if (active && data.trust) setListingTrust(data.trust);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, [listingId]);
  const priceStr = paramFirst(params.price);
  const titleStr = paramFirst(params.title) ?? "Stay";
  const checkIn = paramFirst(params.checkIn)?.trim() || "";
  const checkOut = paramFirst(params.checkOut)?.trim() || "";
  const guestsStr = paramFirst(params.guests)?.trim() || "1";
  const coverUrl = paramFirst(params.coverUrl)?.trim() || "";

  const nightlyPrice = Number(priceStr || 0);
  const nights = useMemo(
    () => (checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0),
    [checkIn, checkOut]
  );
  const storedNightDates = useMemo(
    () => (checkIn && checkOut ? nightDateStrings(checkIn, checkOut) : []),
    [checkIn, checkOut]
  );

  const subtotal = nights > 0 && Number.isFinite(nightlyPrice) ? nights * nightlyPrice : 0;
  const serviceFee = 0;
  const displayTotal = subtotal + serviceFee;

  const guestsCount = useMemo(() => {
    const n = parseInt(guestsStr, 10);
    return Number.isFinite(n) && n > 0 ? Math.min(50, n) : 1;
  }, [guestsStr]);

  const [guestEmail, setGuestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);

  async function confirmAndPay() {
    if (lock.current || submitting) return;
    if (!listingId.trim()) {
      Alert.alert("Missing listing", "Go back and pick a stay again.");
      return;
    }
    if (nights === 0 || storedNightDates.length === 0) {
      Alert.alert("Dates", "Check-in and check-out are required.");
      return;
    }
    if (!Number.isFinite(nightlyPrice) || nightlyPrice <= 0) {
      Alert.alert("Price", "This listing has no valid nightly rate.");
      return;
    }
    const emailNorm = normalizeGuestEmail(guestEmail);
    if (!isValidGuestEmail(emailNorm)) {
      Alert.alert("Email", "Enter a valid email for your confirmation and receipt.");
      return;
    }

    lock.current = true;
    setSubmitting(true);
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/api/bookings/create`;
      const headers = await buildAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          listingId,
          selectedDates: storedNightDates,
          guestEmail: emailNorm,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        bookingId?: string;
        total?: number;
        nights?: number;
        title?: string;
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        const msg =
          typeof data.error === "string" && data.error.trim()
            ? data.error
            : res.status === 409
              ? "Those dates are not available."
              : "Could not create booking.";
        if (data.code === "IDENTITY_VERIFICATION_REQUIRED") {
          Alert.alert("Verification needed", msg, [
            { text: "Not now", style: "cancel" },
            { text: "Verify ID", onPress: () => router.push("/verify-identity") },
          ]);
          return;
        }
        Alert.alert(res.status === 409 ? "Dates unavailable" : "Booking failed", msg);
        return;
      }
      if (!data.bookingId) {
        Alert.alert("Error", "No booking id returned.");
        return;
      }

      void trackBnhubEvent("create_booking", { listingId });

      const serverTotal = typeof data.total === "number" ? data.total : Number(data.total);
      const serverNights = typeof data.nights === "number" ? data.nights : nights;
      const serverTitle = typeof data.title === "string" && data.title.trim() ? data.title : titleStr;

      router.push({
        pathname: "/payment",
        params: {
          bookingId: data.bookingId,
          total: String(Number.isFinite(serverTotal) ? serverTotal : displayTotal),
          nights: String(serverNights),
          title: serverTitle,
        },
      });
    } catch {
      Alert.alert("Network error", "Check your connection and try again.");
    } finally {
      setSubmitting(false);
      lock.current = false;
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.kicker}>REVIEW & PAY</Text>
        <Text style={styles.head}>Almost there</Text>

        {listingTrust ? (
          <TrustHostStrip
            hostRating={listingTrust.hostRating}
            reviewCount={listingTrust.reviewCount}
            completedBookings={listingTrust.completedBookings}
            hostVerified={listingTrust.hostVerified}
            topHost={listingTrust.topHost}
          />
        ) : null}

        {me?.trust ? (
          <Text style={styles.guestTrustLine}>
            Your trust: {me.trust.trustScore}/100
            {me.trust.totalStays > 0 ? ` · ${me.trust.totalStays} completed stay${me.trust.totalStays === 1 ? "" : "s"}` : ""}
            {me.trust.badges?.length ? ` · ${me.trust.badges.join(", ")}` : ""}
          </Text>
        ) : null}

        <View style={styles.card}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.cover} accessibilityLabel="" />
          ) : (
            <View style={styles.coverPh}>
              <Text style={styles.coverPhText}>BNHub</Text>
            </View>
          )}
          <Text style={styles.title} numberOfLines={2}>
            {titleStr}
          </Text>
          <Text style={styles.dates}>
            {checkIn && checkOut
              ? `${formatShortDate(checkIn)} → ${formatShortDate(checkOut)}`
              : "—"}
          </Text>
          <Text style={styles.guestsLine}>
            {guestsCount} guest{guestsCount === 1 ? "" : "s"} · {nights} night{nights === 1 ? "" : "s"}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Price breakdown</Text>
        <View style={styles.breakdown}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>
              ${nightlyPrice % 1 === 0 ? nightlyPrice.toFixed(0) : nightlyPrice.toFixed(2)} × {nights} night
              {nights === 1 ? "" : "s"}
            </Text>
            <Text style={styles.rowValue}>
              ${Number.isInteger(subtotal) ? subtotal.toFixed(0) : subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Guest service fee</Text>
            <Text style={styles.rowValue}>
              ${serviceFee.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.row, styles.rowTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ${Number.isInteger(displayTotal) ? displayTotal.toFixed(0) : displayTotal.toFixed(2)}
            </Text>
          </View>
          <Text style={styles.breakdownHint}>Final amount is confirmed when you pay (Stripe).</Text>
        </View>

        <View style={styles.trustRow}>
          <Text style={styles.trustItem}>Secure payment</Text>
          <Text style={styles.trustDot}>·</Text>
          <Text style={styles.trustItem}>Verified host</Text>
          {me?.identityVerification?.isVerified ? (
            <>
              <Text style={styles.trustDot}>·</Text>
              <Text style={styles.trustItem}>Verified guest</Text>
            </>
          ) : null}
        </View>
        {me?.identityVerification?.isVerified ? (
          <View style={styles.badgeRow}>
            <VerifiedUserBadge compact />
          </View>
        ) : null}
        <Text style={styles.trustSub}>Card details are processed by Stripe — we never store your card on this device.</Text>

        <Text style={styles.emailLabel}>Email for confirmation</Text>
        <TextInput
          value={guestEmail}
          onChangeText={setGuestEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          style={styles.emailInput}
        />

        <Pressable
          onPress={() => void confirmAndPay()}
          disabled={submitting || nights === 0}
          style={({ pressed }) => [
            styles.cta,
            (submitting || nights === 0) && styles.ctaDisabled,
            pressed && !submitting && nights > 0 && styles.ctaPressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#0a0a0a" />
          ) : (
            <Text style={styles.ctaLabel}>Confirm & Pay</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.replace("/(tabs)")} style={styles.secondary}>
          <Text style={styles.secondaryLabel}>Browse more stays</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 22, paddingBottom: 40 },
  back: { color: colors.gold, fontWeight: "600", fontSize: 16, marginBottom: 14 },
  kicker: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 2, marginBottom: 6 },
  head: { color: colors.gold, fontSize: 28, fontWeight: "800", marginBottom: 18 },
  guestTrustLine: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 22,
  },
  cover: { width: "100%", height: 180, backgroundColor: colors.surface2 },
  coverPh: {
    width: "100%",
    height: 180,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
  },
  coverPhText: { color: colors.muted, fontWeight: "800", letterSpacing: 2 },
  title: { color: colors.text, fontSize: 20, fontWeight: "800", paddingHorizontal: 16, paddingTop: 14 },
  dates: { color: colors.muted, fontSize: 15, paddingHorizontal: 16, marginTop: 8 },
  guestsLine: { color: colors.muted, fontSize: 14, paddingHorizontal: 16, paddingBottom: 16, marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "800", marginBottom: 10 },
  breakdown: {
    backgroundColor: colors.surface2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  rowLabel: { color: colors.muted, fontSize: 14, flex: 1 },
  rowValue: { color: colors.text, fontSize: 15, fontWeight: "600" },
  rowTotal: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { color: colors.text, fontSize: 16, fontWeight: "800" },
  totalValue: { color: colors.gold, fontSize: 22, fontWeight: "800" },
  breakdownHint: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  badgeRow: { marginBottom: 10 },
  trustRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  trustItem: { color: colors.gold, fontSize: 13, fontWeight: "800" },
  trustDot: { color: colors.muted },
  trustSub: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 20 },
  emailLabel: { color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: 8 },
  emailInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16,
    marginBottom: 18,
  },
  cta: {
    backgroundColor: colors.gold,
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
  },
  ctaDisabled: { opacity: 0.5 },
  ctaPressed: { opacity: 0.92 },
  ctaLabel: { color: "#0a0a0a", fontWeight: "900", fontSize: 17 },
  secondary: { marginTop: 14, paddingVertical: 14, alignItems: "center" },
  secondaryLabel: { color: colors.gold, fontWeight: "700", fontSize: 15 },
});
