import { useCallback, useEffect, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ManagerStackParamList } from "../navigation/types";
import { getListing, type ListingDetailsResponse } from "../services/api";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<ManagerStackParamList, "ListingDetails">;

function formatNightPrice(cents: number, currency: string) {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "EUR" }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function ListingDetailsScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [data, setData] = useState<ListingDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await getListing(id);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load listing");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !data?.listing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? "Not found"}</Text>
        <Pressable style={styles.retry} onPress={() => void load()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const L = data.listing;
  const cover = L.photos?.[0];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {cover ? (
        <Image source={{ uri: cover }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]} />
      )}
      <View style={styles.body}>
        <Text style={styles.title}>{L.title}</Text>
        <Text style={styles.meta}>
          {L.city}
          {L.region ? ` · ${L.region}` : ""}
          {L.country ? ` · ${L.country}` : ""}
        </Text>
        <Text style={styles.price}>{formatNightPrice(L.nightPriceCents, L.currency)} / night</Text>
        {(L.maxGuests != null || L.beds != null || L.baths != null) && (
          <Text style={styles.detailLine}>
            {[L.maxGuests != null ? `${L.maxGuests} guests` : null, L.beds != null ? `${L.beds} beds` : null, L.baths != null ? `${L.baths} baths` : null]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        )}
        {(L.checkInTime || L.checkOutTime) && (
          <Text style={styles.detailLine}>
            Check-in {L.checkInTime ?? "—"} · Check-out {L.checkOutTime ?? "—"}
          </Text>
        )}
        {L.houseRules ? (
          <>
            <Text style={styles.sectionLabel}>House rules</Text>
            <Text style={styles.bodyText}>{L.houseRules}</Text>
          </>
        ) : null}
      </View>
      <Pressable
        style={({ pressed }) => [styles.bookBtn, pressed && styles.pressed]}
        onPress={() => navigation.navigate("Booking", { listingId: L.id, listingTitle: L.title })}
      >
        <Text style={styles.bookBtnText}>Book</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 32 },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  hero: { width: "100%", height: 220, backgroundColor: colors.card },
  heroPlaceholder: { borderBottomWidth: 1, borderColor: colors.border },
  body: { padding: 20 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: 8 },
  meta: { color: colors.muted, fontSize: 15, marginBottom: 12 },
  price: { color: colors.primary, fontSize: 18, fontWeight: "700", marginBottom: 8 },
  detailLine: { color: colors.text, fontSize: 14, marginBottom: 6 },
  sectionLabel: { color: colors.primary, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  bodyText: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  bookBtn: {
    marginHorizontal: 20,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  bookBtnText: { color: "#0b0b0b", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.9 },
  errorText: { color: colors.danger, textAlign: "center", marginBottom: 16 },
  retry: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: { color: "#0b0b0b", fontWeight: "600" },
});
