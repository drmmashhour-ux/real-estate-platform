import { useCallback, useEffect, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ManagerStackParamList } from "../navigation/types";
import { getListings, type PublicListingCard } from "../services/api";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<ManagerStackParamList, "Listings">;

function formatNightPrice(cents: number, currency: string) {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "EUR" }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function ListingsScreen({ navigation }: Props) {
  const [items, setItems] = useState<PublicListingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await getListings();
      setItems(res.listings ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load listings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retry} onPress={() => void load()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      ListEmptyComponent={
        <Text style={styles.empty}>No published stays match your filters yet.</Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate("ListingDetails", { id: item.id })}
        >
          {item.photos?.[0] ? (
            <Image source={{ uri: item.photos[0] }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]} />
          )}
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {item.city}
            </Text>
            <Text style={styles.cardPrice}>{formatNightPrice(item.nightPriceCents, item.currency)} / night</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  listContent: { padding: 16, paddingBottom: 32, backgroundColor: colors.background },
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: { opacity: 0.92 },
  thumb: { width: 108, height: 108, backgroundColor: colors.surface2 },
  thumbPlaceholder: { borderRightWidth: 1, borderColor: colors.border },
  cardBody: { flex: 1, padding: 14, justifyContent: "center" },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "600", marginBottom: 4 },
  cardMeta: { color: colors.muted, fontSize: 14, marginBottom: 8 },
  cardPrice: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  errorText: { color: colors.danger, textAlign: "center", marginBottom: 16 },
  retry: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: { color: "#0b0b0b", fontWeight: "600" },
  empty: { color: colors.muted, textAlign: "center", marginTop: 48 },
});
