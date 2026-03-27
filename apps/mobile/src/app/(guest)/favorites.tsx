import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { mobileFetch } from "../../services/apiClient";
import { colors } from "../../theme/colors";

type Fav = { listings: Array<{ id: string; title: string; city: string; nightPriceCents: number }> };

export default function GuestFavorites() {
  const q = useQuery({
    queryKey: ["favorites"],
    queryFn: () => mobileFetch<Fav>("/api/mobile/v1/favorites"),
  });

  return (
    <ScreenChrome title="Saved" subtitle="Your favorite stays">
      <FlatList
        data={q.data?.listings ?? []}
        keyExtractor={(x) => x.id}
        ListEmptyComponent={<Text style={styles.m}>No saved listings.</Text>}
        renderItem={({ item }) => (
          <Link href={`/(guest)/listing/${item.id}`} asChild>
            <Pressable style={styles.row}>
              <Text style={styles.t}>{item.title}</Text>
              <Text style={styles.m}>
                {item.city} · ${(item.nightPriceCents / 100).toFixed(0)}/night
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
  m: { color: colors.textMuted, marginTop: 4 },
});
