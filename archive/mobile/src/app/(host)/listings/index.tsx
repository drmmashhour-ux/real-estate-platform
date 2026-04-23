import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { ScreenChrome } from "../../../components/ui/ScreenChrome";
import { mobileFetch } from "../../../services/apiClient";
import { colors } from "../../../theme/colors";

type Res = { listings: Array<{ id: string; title: string; city: string; listingStatus: string }> };

export default function HostListings() {
  const q = useQuery({
    queryKey: ["host-listings"],
    queryFn: () => mobileFetch<Res>("/api/mobile/v1/host/listings"),
  });
  return (
    <ScreenChrome title="Your listings" subtitle="Edit photos, rules, calendar">
      <FlatList
        data={q.data?.listings ?? []}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <Link href={`/(host)/listings/${item.id}`} asChild>
            <Pressable style={styles.row}>
              <Text style={styles.t}>{item.title}</Text>
              <Text style={styles.m}>
                {item.city} · {item.listingStatus}
              </Text>
            </Pressable>
          </Link>
        )}
      />
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  t: { color: colors.text, fontWeight: "600" },
  m: { color: colors.textMuted },
});
