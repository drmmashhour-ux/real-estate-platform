import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { GoldButton } from "../../../components/ui/GoldButton";
import { ScreenChrome } from "../../../components/ui/ScreenChrome";
import { mobileFetch } from "../../../services/apiClient";
import { colors } from "../../../theme/colors";

type ListingPayload = {
  listing: {
    id: string;
    safety: { bookingAllowed: boolean; guestMessage: string };
  };
};

/** Server-backed guard: deep links cannot bypass safety when booking is disallowed. */
export default function BookingQuote() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useQuery({
    queryKey: ["listing-quote", id],
    queryFn: () => mobileFetch<ListingPayload>(`/api/mobile/v1/listings/${id}`),
    enabled: !!id,
  });

  const allowed = q.data?.listing.safety.bookingAllowed === true;

  return (
    <ScreenChrome title="Price summary" subtitle="Nightly + cleaning + fees">
      {q.isLoading ? <Text style={styles.muted}>Loading…</Text> : null}
      {q.error ? <Text style={styles.err}>Could not load listing.</Text> : null}
      {q.data && !allowed ? (
        <Text style={styles.err}>
          This listing can’t be booked right now. {q.data.listing.safety.guestMessage}
        </Text>
      ) : null}
      {q.data && allowed ? (
        <>
          <Text style={styles.t}>
            Full quote will match web checkout (taxes, service fee, cleaning). Connect `getPriceQuote` when the mobile quote endpoint is ready.
          </Text>
          <GoldButton label="Continue (demo)" onPress={() => router.push(`/(guest)/booking/confirm?id=${id}`)} />
        </>
      ) : null}
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  t: { color: colors.textMuted, marginBottom: 20, lineHeight: 22 },
  muted: { color: colors.textMuted },
  err: { color: colors.danger, marginBottom: 12, lineHeight: 20 },
});
