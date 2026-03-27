import { useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams, router } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { GoldButton } from "../../../components/ui/GoldButton";
import { ScreenChrome } from "../../../components/ui/ScreenChrome";
import { mobileFetch } from "../../../services/apiClient";
import { colors } from "../../../theme/colors";

type Detail = {
  listing: {
    id: string;
    title: string;
    city: string;
    nightPriceCents: number;
    photos: string[];
    checkInTime: string | null;
    checkOutTime: string | null;
    cancellationPolicy: string | null;
    houseRules: string | null;
    checkInInstructions: string | null;
    starRating: number | null;
    luxuryTierPublic: string | null;
    safety: { guestMessage: string; bookingAllowed: boolean; listingVisible: boolean; reviewStatus: string };
    instantBookEnabled: boolean;
  };
  reviews: Array<{ id: string; rating: number; comment: string | null; guestName: string }>;
};

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useQuery({
    queryKey: ["listing", id],
    queryFn: () => mobileFetch<Detail>(`/api/mobile/v1/listings/${id}`),
    enabled: !!id,
  });

  if (q.isLoading) {
    return (
      <ScreenChrome title="Listing">
        <Text style={styles.muted}>Loading…</Text>
      </ScreenChrome>
    );
  }
  if (q.error || !q.data) {
    return (
      <ScreenChrome title="Listing">
        <Text style={styles.err}>Unable to load listing.</Text>
      </ScreenChrome>
    );
  }

  const { listing, reviews } = q.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <ScreenChrome title={listing.title} subtitle={listing.city}>
          {listing.photos[0] ? <Image source={{ uri: listing.photos[0] }} style={styles.hero} /> : null}
          <Text style={styles.price}>
            ${(listing.nightPriceCents / 100).toFixed(0)} <Text style={styles.per}>/ night</Text>
          </Text>
          {listing.starRating != null ? (
            <Text style={styles.badge}>BNHub estimate · ★ {listing.starRating}</Text>
          ) : null}
          {listing.luxuryTierPublic ? (
            <Text style={styles.badge}>Tier · {listing.luxuryTierPublic}</Text>
          ) : null}
          <Text style={styles.safe}>{listing.safety.guestMessage}</Text>
          <Text style={styles.h}>Check-in / check-out</Text>
          <Text style={styles.muted}>
            Check-in {listing.checkInTime ?? "—"} · Check-out {listing.checkOutTime ?? "—"}
          </Text>
          <Text style={styles.h}>House rules</Text>
          <Text style={styles.body}>{listing.houseRules ?? "See listing on web for full rules."}</Text>
          <Text style={styles.h}>Cancellation</Text>
          <Text style={styles.body}>{listing.cancellationPolicy ?? "Standard BNHub policy applies."}</Text>
          <Text style={styles.h}>Reviews</Text>
          {reviews.length === 0 ? <Text style={styles.muted}>No reviews yet.</Text> : null}
          {reviews.map((r) => (
            <View key={r.id} style={styles.rev}>
              <Text style={styles.rt}>
                ★ {r.rating} · {r.guestName}
              </Text>
              {r.comment ? <Text style={styles.body}>{r.comment}</Text> : null}
            </View>
          ))}
          <Link href="/(guest)/support" style={{ marginTop: 16 }}>
            <Text style={{ color: colors.gold }}>Report this listing</Text>
          </Link>
        </ScreenChrome>
      </ScrollView>
      <View style={styles.cta}>
        <GoldButton
          label={listing.safety.bookingAllowed ? "Book · price details" : "Unavailable"}
          onPress={() => {
            if (!listing.safety.bookingAllowed) return;
            router.push(`/(guest)/booking/quote?id=${listing.id}`);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", height: 220, borderRadius: 12, marginBottom: 12 },
  price: { color: colors.text, fontSize: 26, fontWeight: "800" },
  per: { fontSize: 16, fontWeight: "500", color: colors.textMuted },
  badge: { color: colors.gold, marginTop: 6, fontWeight: "600" },
  safe: { color: colors.textMuted, marginTop: 12, fontSize: 13 },
  h: { color: colors.text, fontWeight: "700", marginTop: 16 },
  body: { color: colors.textMuted, marginTop: 4 },
  muted: { color: colors.textMuted },
  err: { color: colors.danger },
  rev: { marginTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  rt: { color: colors.text, fontWeight: "600" },
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(10,10,10,0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
