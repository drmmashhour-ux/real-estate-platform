import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VerifiedUserBadge } from "../components/VerifiedUserBadge";
import { API_BASE_URL } from "../config";
import { useAppAuth } from "../hooks/useAuth";
import { buildAuthHeaders } from "../lib/authHeaders";
import { bookingStatusBadgeLabel, isBookingCanceled, isBookingPaidLike } from "../lib/bookingStatusDisplay";
import { colors } from "../theme/colors";

function paramFirst(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

type Row = {
  id: string;
  listing_id: string;
  dates: unknown;
  total_price: number;
  status: string;
  guest_email?: string | null;
  listings: { title: string } | null;
  instructions?: string | null;
};

function nightsFromDates(dates: unknown): number {
  if (Array.isArray(dates)) return dates.length;
  return 0;
}

function formatNightlyLine(dates: unknown): string {
  if (Array.isArray(dates) && dates.every((d) => typeof d === "string")) {
    return (dates as string[]).join(" · ");
  }
  return "—";
}

function addOneDayYmd(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Checkout-exclusive nights → human stay summary. */
function staySummary(dates: unknown): string {
  if (!Array.isArray(dates) || dates.length === 0) return "—";
  const strs = (dates as unknown[]).filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d));
  if (strs.length === 0) return "—";
  const sorted = [...strs].sort();
  const first = sorted[0]!;
  const lastNight = sorted[sorted.length - 1]!;
  const checkout = addOneDayYmd(lastNight);
  const n = sorted.length;
  return `${n} night${n === 1 ? "" : "s"} · ${first} → ${checkout} (checkout)`;
}

export default function BookingDetailsScreen() {
  const router = useRouter();
  const { me } = useAppAuth();
  const { bookingId } = useLocalSearchParams<{ bookingId: string | string[] }>();
  const bid = paramFirst(bookingId);

  const [row, setRow] = useState<Row | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [reviewErr, setReviewErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!bid) {
      setError("Missing booking id.");
      setLoading(false);
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
          listingTitle: string | null;
          instructions?: string | null;
        };
        error?: string;
      };

      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "We could not load this booking.");
        setRow(null);
      } else if (!json.booking) {
        setError("We could not find this booking.");
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
          guest_email: b.guestEmail,
          listings: b.listingTitle ? { title: b.listingTitle } : null,
          instructions: b.instructions ?? null,
        });
      }
    } catch {
      setError("Network error — check EXPO_PUBLIC_API_BASE_URL.");
      setRow(null);
    }
    setLoading(false);
  }, [bid]);

  useEffect(() => {
    void load();
  }, [load]);

  const status = row?.status ?? "";
  const paidLike = isBookingPaidLike(status);
  const canceled = isBookingCanceled(status);
  const isProcessing = status.toLowerCase() === "processing";
  const isPendingOnly = status.toLowerCase() === "pending";

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.hint}>Loading booking…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !row) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.kicker}>BOOKING</Text>
          <Text style={styles.head}>Not found</Text>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyBody}>{error ?? "We could not load this booking."}</Text>
          </View>
          <Pressable onPress={() => router.replace("/(tabs)")} style={({ pressed }) => [styles.ctaGold, pressed && styles.ctaPressed]}>
            <Text style={styles.ctaGoldLabel}>Browse stays</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const guestEmail = typeof row.guest_email === "string" && row.guest_email.includes("@") ? row.guest_email.trim() : null;

  async function submitReview() {
    if (!row || !guestEmail || reviewSubmitting || reviewDone) return;
    const listingId = row.listing_id;
    setReviewErr(null);
    setReviewSubmitting(true);
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/api/reviews/create`;
      const headers = await buildAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          listing_id: listingId,
          booking_id: row.id,
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
          guest_email: guestEmail,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
      if (!res.ok) {
        const friendly =
          data.code === "DUPLICATE_REVIEW"
            ? "You already submitted a review for this stay."
            : data.code === "NO_PAID_BOOKING"
              ? "Reviews are available after a paid stay."
              : data.code === "REVIEWS_UNAVAILABLE"
                ? "Reviews are not set up on the server yet."
                : typeof data.error === "string" && data.error.trim()
                  ? data.error
                  : "Could not submit your review.";
        Alert.alert("Review not saved", friendly);
        return;
      }
      setReviewDone(true);
      setReviewComment("");
      Alert.alert("Thank you", "Your review was submitted.");
    } catch {
      setReviewErr("Network error — check EXPO_PUBLIC_API_BASE_URL.");
      Alert.alert("Network error", "Check EXPO_PUBLIC_API_BASE_URL and try again.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.kicker}>BNHUB</Text>
        <Text style={styles.head}>{paidLike ? "Booking receipt" : "Booking details"}</Text>
        {me?.identityVerification?.isVerified ? (
          <View style={styles.verifiedGuestRow}>
            <VerifiedUserBadge compact />
          </View>
        ) : null}

        <View style={[styles.card, paidLike && styles.cardReceipt]}>
          <View style={styles.badgeRow}>
            <Text style={styles.label}>Status</Text>
            <View
              style={[
                styles.badge,
                paidLike ? styles.badgePaid : canceled ? styles.badgeCanceled : styles.badgePending,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  paidLike ? styles.badgeTextPaid : canceled ? styles.badgeTextCanceled : styles.badgeTextPending,
                ]}
              >
                {bookingStatusBadgeLabel(row.status)}
              </Text>
            </View>
          </View>

          {paidLike ? (
            <Text style={styles.receiptHint}>Payment was confirmed by Stripe through our servers. This screen is your reference copy.</Text>
          ) : null}

          <Text style={styles.label}>Listing</Text>
          <Text style={styles.valueLarge}>{row.listings?.title ?? "BNHub stay"}</Text>

          {guestEmail ? (
            <>
              <Text style={[styles.label, styles.labelSp]}>Guest email</Text>
              <Text style={styles.value} selectable>
                {guestEmail}
              </Text>
            </>
          ) : null}

          <Text style={[styles.label, styles.labelSp]}>Stay summary</Text>
          <Text style={styles.value}>{staySummary(row.dates)}</Text>

          <Text style={[styles.label, styles.labelSp]}>Nightly dates</Text>
          <Text style={styles.datesMuted}>{formatNightlyLine(row.dates)}</Text>

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

        <Text style={styles.h}>Host instructions</Text>
        {paidLike ? (
          row.instructions?.trim() ? (
            <Text style={styles.instructionsBody}>{row.instructions.trim()}</Text>
          ) : (
            <Text style={styles.mutedInstructions}>
              Your host has not added arrival notes yet. Check your confirmation email or message the host through BNHub
              support if you need help.
            </Text>
          )
        ) : (
          <Text style={styles.mutedInstructions}>
            Detailed address, entry codes, and house rules from your host appear here after payment is confirmed.
          </Text>
        )}

        {isPendingOnly ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/payment",
                params: {
                  bookingId: row.id,
                  total: String(row.total_price),
                  nights: String(nightsFromDates(row.dates)),
                  title: row.listings?.title ?? "BNHub stay",
                },
              })
            }
            style={({ pressed }) => [styles.ctaGold, pressed && styles.ctaPressed]}
          >
            <Text style={styles.ctaGoldLabel}>Continue to payment</Text>
          </Pressable>
        ) : null}

        {isProcessing ? (
          <>
            <Pressable
              onPress={() => router.push({ pathname: "/booking-confirmation", params: { bookingId: row.id } })}
              style={({ pressed }) => [styles.ctaGold, pressed && styles.ctaPressed]}
            >
              <Text style={styles.ctaGoldLabel}>View live payment status</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/payment",
                  params: {
                    bookingId: row.id,
                    total: String(row.total_price),
                    nights: String(nightsFromDates(row.dates)),
                    title: row.listings?.title ?? "BNHub stay",
                  },
                })
              }
              style={({ pressed }) => [styles.ctaOutline, pressed && styles.ctaOutlinePressed]}
            >
              <Text style={styles.ctaOutlineLabel}>Open payment again</Text>
            </Pressable>
          </>
        ) : null}

        {paidLike ? (
          <View style={styles.confirmedPill}>
            <Text style={styles.confirmedTitle}>Confirmed</Text>
            <Text style={styles.confirmedBody}>Thank you for booking with LECIPM BNHub.</Text>
          </View>
        ) : null}

        {paidLike && guestEmail ? (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>Leave a review</Text>
            <Text style={styles.reviewLead}>Share how the stay went. One review per listing per email.</Text>
            {reviewDone ? (
              <Text style={styles.reviewSuccess}>Thanks — your review was submitted.</Text>
            ) : (
              <>
                <Text style={styles.reviewLabel}>Rating</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => setReviewRating(n)}
                      style={({ pressed }) => [
                        styles.starBtn,
                        n <= reviewRating && styles.starBtnOn,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Text style={[styles.starText, n <= reviewRating && styles.starTextOn]}>{n <= reviewRating ? "★" : "☆"}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.reviewLabel}>Comment (optional)</Text>
                <TextInput
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder="What stood out?"
                  placeholderTextColor={colors.muted}
                  multiline
                  style={styles.reviewInput}
                  editable={!reviewSubmitting}
                />
                {reviewErr ? <Text style={styles.reviewErr}>{reviewErr}</Text> : null}
                <Pressable
                  onPress={() => void submitReview()}
                  disabled={reviewSubmitting}
                  style={({ pressed }) => [styles.reviewCta, reviewSubmitting && styles.ctaDisabled, pressed && !reviewSubmitting && styles.ctaPressed]}
                >
                  <Text style={styles.reviewCtaLabel}>{reviewSubmitting ? "Submitting…" : "Submit review"}</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : paidLike && !guestEmail ? (
          <Text style={styles.reviewNoEmail}>Add a guest email on your next booking to leave a review.</Text>
        ) : null}

        {canceled ? (
          <>
            <Text style={styles.canceledNote}>This booking is canceled. You can start a new stay when you are ready.</Text>
            <Pressable onPress={() => router.replace("/(tabs)")} style={({ pressed }) => [styles.ctaGold, pressed && styles.ctaPressed]}>
              <Text style={styles.ctaGoldLabel}>Browse stays</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const n = Math.max(1, nightsFromDates(row.dates));
                const tp = typeof row.total_price === "number" ? row.total_price : Number(row.total_price);
                const ppn = Number.isFinite(tp) && n > 0 ? Math.round((tp / n) * 100) / 100 : 0;
                router.push({
                  pathname: "/(tabs)/booking",
                  params: {
                    id: row.listing_id,
                    price: String(ppn),
                    title: row.listings?.title ?? "BNHub stay",
                  },
                });
              }}
              style={({ pressed }) => [styles.ctaOutline, pressed && styles.ctaOutlinePressed]}
            >
              <Text style={styles.ctaOutlineLabel}>Book this listing again</Text>
            </Pressable>
          </>
        ) : null}

        {isPendingOnly ? (
          <Pressable
            onPress={() => router.push({ pathname: "/booking-confirmation", params: { bookingId: row.id } })}
            style={styles.ghost}
          >
            <Text style={styles.ghostLabel}>Live payment status</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={() => router.replace("/(tabs)")} style={styles.secondary}>
          <Text style={styles.secondaryLabel}>Home</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  hint: { color: colors.muted, marginTop: 12, fontSize: 15 },
  back: { color: colors.gold, fontWeight: "600", fontSize: 16, marginBottom: 16 },
  kicker: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 8 },
  head: { color: colors.gold, fontSize: 28, fontWeight: "700", marginBottom: 10 },
  verifiedGuestRow: { marginBottom: 16 },
  h: { color: colors.text, fontSize: 16, fontWeight: "800", marginTop: 8, marginBottom: 10 },
  instructionsBody: { color: colors.text, fontSize: 15, lineHeight: 24, marginBottom: 16 },
  mutedInstructions: { color: colors.muted, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    marginBottom: 20,
  },
  emptyBody: { color: colors.muted, lineHeight: 22, fontSize: 15 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    marginBottom: 20,
  },
  cardReceipt: { borderColor: colors.goldDim },
  receiptHint: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 18 },
  badgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.7 },
  labelSp: { marginTop: 16 },
  value: { color: colors.text, fontSize: 16, marginTop: 6, fontWeight: "500" },
  valueLarge: { color: colors.text, fontSize: 20, marginTop: 6, fontWeight: "700" },
  valueGold: { color: colors.gold, fontSize: 24, fontWeight: "700", marginTop: 6 },
  datesMuted: { color: colors.muted, fontSize: 13, marginTop: 6, lineHeight: 20 },
  mono: { color: colors.text, fontSize: 12, marginTop: 6 },
  badge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, maxWidth: "75%" },
  badgePaid: { backgroundColor: "rgba(34, 197, 94, 0.15)", borderWidth: 1, borderColor: colors.success },
  badgePending: { backgroundColor: "rgba(212, 175, 55, 0.12)", borderWidth: 1, borderColor: colors.goldDim },
  badgeCanceled: { backgroundColor: "rgba(239, 68, 68, 0.12)", borderWidth: 1, borderColor: colors.danger },
  badgeText: { fontSize: 13, fontWeight: "800" },
  badgeTextPaid: { color: colors.success },
  badgeTextPending: { color: colors.gold },
  badgeTextCanceled: { color: colors.danger },
  confirmedPill: {
    backgroundColor: colors.surface2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.success,
    padding: 16,
    marginBottom: 16,
  },
  confirmedTitle: { color: colors.success, fontWeight: "800", marginBottom: 6, fontSize: 15 },
  confirmedBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  canceledNote: { color: colors.muted, lineHeight: 22, marginBottom: 16, fontSize: 14 },
  ctaGold: {
    backgroundColor: colors.gold,
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
    minHeight: 52,
    justifyContent: "center",
  },
  ctaGoldLabel: { fontWeight: "700", color: "#0a0a0a", fontSize: 16 },
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
  ctaPressed: { opacity: 0.92 },
  ghost: { paddingVertical: 14, alignItems: "center" },
  ghostLabel: { color: colors.gold, fontWeight: "700", fontSize: 15 },
  secondary: { marginTop: 8, paddingVertical: 14, alignItems: "center" },
  secondaryLabel: { color: colors.muted, fontWeight: "600", fontSize: 14 },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.goldDim,
    padding: 20,
    marginBottom: 20,
  },
  reviewTitle: { color: colors.gold, fontSize: 18, fontWeight: "700", marginBottom: 8 },
  reviewLead: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 16 },
  reviewLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 },
  starsRow: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  starBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface2,
  },
  starBtnOn: { borderColor: colors.gold, backgroundColor: "rgba(212, 175, 55, 0.12)" },
  starText: { color: colors.muted, fontSize: 22 },
  starTextOn: { color: colors.gold },
  reviewInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 12,
    fontSize: 15,
  },
  reviewErr: { color: colors.danger, marginBottom: 12, fontSize: 14 },
  reviewSuccess: { color: colors.success, fontWeight: "600", fontSize: 15 },
  reviewCta: {
    backgroundColor: colors.gold,
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  reviewCtaLabel: { color: "#0a0a0a", fontWeight: "700", fontSize: 15 },
  ctaDisabled: { opacity: 0.55 },
  reviewNoEmail: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 16 },
});
