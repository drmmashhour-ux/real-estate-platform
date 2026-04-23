import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { ScreenChrome } from "../../../components/ui/ScreenChrome";
import { mobileFetch } from "../../../services/apiClient";
import { colors } from "../../../theme/colors";

type BookingsRes = {
  bookings: Array<{
    id: string;
    confirmationCode: string | null;
    checkIn: string;
    status: string;
    listing: { title: string; city: string };
    paymentSummary: { totalChargedCents: number; paymentStatus: string };
  }>;
};

export default function GuestBookings() {
  const q = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => mobileFetch<BookingsRes>("/api/mobile/v1/bookings"),
  });

  return (
    <ScreenChrome title="Trips" subtitle="Upcoming and past stays">
      <FlatList
        data={q.data?.bookings ?? []}
        keyExtractor={(b) => b.id}
        ListEmptyComponent={<Text style={styles.m}>No bookings yet.</Text>}
        renderItem={({ item }) => (
          <Link href={`/(guest)/bookings/${item.id}`} asChild>
            <Pressable style={styles.row}>
              <Text style={styles.t}>{item.listing.title}</Text>
              <Text style={styles.m}>
                {item.listing.city} · {new Date(item.checkIn).toLocaleDateString()} · {item.status}
              </Text>
              <Text style={styles.m}>
                Paid ${(item.paymentSummary.totalChargedCents / 100).toFixed(2)} · {item.paymentSummary.paymentStatus}
              </Text>
            </Pressable>
          </Link>
        )}
      />
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  t: { color: colors.text, fontWeight: "700" },
  m: { color: colors.textMuted, marginTop: 4 },
});
