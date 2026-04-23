import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocalSearchParams, router } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";
import { GoldButton } from "../../../components/ui/GoldButton";
import { ScreenChrome } from "../../../components/ui/ScreenChrome";
import { canBookingPay, isBookingPaidLike } from "../../../lib/bookingStatusDisplay";
import { mobileFetch } from "../../../services/apiClient";
import { colors } from "../../../theme/colors";

type One = {
  booking: {
    confirmationCode: string | null;
    checkIn: string;
    checkOut: string;
    nights: number;
    status: string;
    lifecyclePhase: string;
    checkedInAt: string | null;
    checkedOutAt: string | null;
    checkInInstructions: string | null;
    listing: {
      id: string;
      title: string;
      checkInTime: string | null;
      checkOutTime: string | null;
      houseRules: string | null;
    };
    paymentSummary: {
      nightlySubtotalCents: number;
      cleaningFeeCents: number;
      guestServiceFeeCents: number;
      totalChargedCents: number;
      paymentStatus: string;
      stripePaymentIntentId: string | null;
      scheduledHostPayoutAt: string | null;
    };
    checklist: { available: boolean; itemCount: number };
    reviewEligible: boolean;
  };
};

export default function GuestBookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["booking", id],
    queryFn: () => mobileFetch<One>(`/api/mobile/v1/bookings/${id}`),
    enabled: !!id,
  });

  const guestAction = useMutation({
    mutationFn: (action: "check_in" | "check_out" | "complete_stay") =>
      mobileFetch<{ ok?: boolean }>(`/api/mobile/v1/bookings/${id}/guest-actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["booking", id] });
    },
    onError: (e: Error) => Alert.alert("Action failed", e.message),
  });

  if (q.isLoading) {
    return (
      <ScreenChrome title="Reservation">
        <Text style={styles.m}>Loading…</Text>
      </ScreenChrome>
    );
  }
  if (q.error || !q.data) {
    return (
      <ScreenChrome title="Reservation">
        <Text style={styles.err}>Could not load booking.</Text>
      </ScreenChrome>
    );
  }

  const b = q.data.booking;
  const ps = b.paymentSummary;
  const paid = isBookingPaidLike(b.status);
  const canPay = canBookingPay(b.status);

  return (
    <ScreenChrome title={b.listing.title} subtitle={b.confirmationCode ?? b.status}>
      <Text style={styles.phase}>Status: {b.lifecyclePhase.replace(/_/g, " ")}</Text>
      {ps.stripePaymentIntentId ? (
        <Text style={styles.small}>Payment ref · {ps.stripePaymentIntentId.slice(0, 24)}…</Text>
      ) : null}
      {ps.scheduledHostPayoutAt ? (
        <Text style={styles.small}>
          Host payout window from · {new Date(ps.scheduledHostPayoutAt).toLocaleString()}
        </Text>
      ) : null}
      <Text style={styles.h}>What you paid</Text>
      <Text style={styles.m}>Nights subtotal ${(ps.nightlySubtotalCents / 100).toFixed(2)}</Text>
      <Text style={styles.m}>Cleaning ${(ps.cleaningFeeCents / 100).toFixed(2)}</Text>
      <Text style={styles.m}>Guest service fee ${(ps.guestServiceFeeCents / 100).toFixed(2)}</Text>
      <Text style={styles.t}>Total ${(ps.totalChargedCents / 100).toFixed(2)} · {ps.paymentStatus}</Text>
      <Text style={styles.h}>Check-in</Text>
      <Text style={styles.m}>
        {new Date(b.checkIn).toLocaleString()} → {new Date(b.checkOut).toLocaleString()}
      </Text>
      <Text style={styles.m}>Window: {b.listing.checkInTime} / {b.listing.checkOutTime}</Text>
      <Text style={styles.body}>{b.checkInInstructions ?? "Instructions from host will appear here."}</Text>
      {canPay ? (
        <GoldButton
          label="Pay now (Stripe)"
          onPress={() =>
            router.push({
              pathname: "/payment",
              params: {
                bookingId: id,
                title: b.listing.title,
                nights: String(b.nights ?? ""),
                total: String((ps.totalChargedCents / 100).toFixed(2)),
              },
            })
          }
        />
      ) : null}
      {paid && b.checklist.available ? (
        <Link href={`/(guest)/booking/checklist/${id}`} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.gold, fontWeight: "700" }}>Arrival checklist</Text>
        </Link>
      ) : null}
      {paid ? (
        <View style={{ marginTop: 16, gap: 10 }}>
          <GoldButton
            label={b.checkedInAt ? "Checked in ✓" : "I’ve arrived — check in"}
            onPress={() => {
              if (b.checkedInAt) return;
              guestAction.mutate("check_in");
            }}
          />
          <GoldButton
            label={b.checkedOutAt ? "Checked out ✓" : "I’ve left — check out"}
            onPress={() => {
              if (b.checkedOutAt) return;
              guestAction.mutate("check_out");
            }}
          />
          <GoldButton
            label="Mark stay complete"
            onPress={() => guestAction.mutate("complete_stay")}
          />
        </View>
      ) : null}
      {b.reviewEligible ? (
        <Link href={`/(guest)/reviews/write/${id}`} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.gold, fontWeight: "700" }}>Write a review</Text>
        </Link>
      ) : null}
      <View style={{ height: 24 }} />
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  phase: { color: colors.gold, fontWeight: "600", marginBottom: 6 },
  small: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  h: { color: colors.text, fontWeight: "700", marginTop: 14 },
  m: { color: colors.textMuted, marginTop: 4 },
  err: { color: colors.danger },
  t: { color: colors.gold, fontWeight: "800", marginTop: 8 },
  body: { color: colors.textMuted, marginTop: 8 },
});
