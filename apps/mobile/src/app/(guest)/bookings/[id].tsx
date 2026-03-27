import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { ScreenChrome } from "../../../components/ui/ScreenChrome";
import { mobileFetch } from "../../../services/apiClient";
import { colors } from "../../../theme/colors";

type One = {
  booking: {
    confirmationCode: string | null;
    checkIn: string;
    checkOut: string;
    status: string;
    checkInInstructions: string | null;
    listing: {
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
    };
    reviewEligible: boolean;
  };
};

export default function GuestBookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useQuery({
    queryKey: ["booking", id],
    queryFn: () => mobileFetch<One>(`/api/mobile/v1/bookings/${id}`),
    enabled: !!id,
  });

  if (!q.data) {
    return (
      <ScreenChrome title="Reservation">
        <Text style={styles.m}>Loading…</Text>
      </ScreenChrome>
    );
  }

  const b = q.data.booking;
  const ps = b.paymentSummary;

  return (
    <ScreenChrome title={b.listing.title} subtitle={b.confirmationCode ?? b.status}>
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
  h: { color: colors.text, fontWeight: "700", marginTop: 14 },
  m: { color: colors.textMuted, marginTop: 4 },
  t: { color: colors.gold, fontWeight: "800", marginTop: 8 },
  body: { color: colors.textMuted, marginTop: 8 },
});
