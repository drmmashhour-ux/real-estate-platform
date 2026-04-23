import { useQuery } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { Link } from "expo-router";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { WEB_APP_ORIGIN } from "../../config";
import { mobileFetch } from "../../services/apiClient";
import { colors } from "../../theme/colors";

type Featured = { listings: Array<{ id: string; title: string; city: string; nightPriceCents: number; photos: string[]; starRating: number | null }> };

export default function GuestHome() {
  const q = useQuery({
    queryKey: ["featured"],
    queryFn: () => mobileFetch<Featured>("/api/mobile/v1/listings/featured"),
  });

  return (
    <ScreenChrome title="Discover" subtitle="Featured BNHub stays">
      {q.isLoading ? <Text style={styles.muted}>Loading…</Text> : null}
      {q.error ? <Text style={styles.err}>Could not load listings. Check API URL and network.</Text> : null}
      <FlatList
        data={q.data?.listings ?? []}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <Link href={`/(guest)/listing/${item.id}`} asChild>
            <Pressable style={styles.card}>
              {item.photos[0] ? (
                <Image source={{ uri: item.photos[0] }} style={styles.img} />
              ) : (
                <View style={[styles.img, styles.ph]} />
              )}
              <Text style={styles.t}>{item.title}</Text>
              <Text style={styles.muted}>
                {item.city} · ${(item.nightPriceCents / 100).toFixed(0)}/night
                {item.starRating != null ? ` · ★ ${item.starRating}` : ""}
              </Text>
            </Pressable>
          </Link>
        )}
        ListFooterComponent={
          <View style={styles.nav}>
            <Pressable
              style={styles.link}
              onPress={() => Linking.openURL(`${WEB_APP_ORIGIN}/list-your-property`)}
            >
              <Text style={styles.linkT}>List property</Text>
            </Pressable>
            <Link href="/(guest)/search" style={styles.link}>
              <Text style={styles.linkT}>Search</Text>
            </Link>
            <Link href="/(guest)/map" style={styles.link}>
              <Text style={styles.linkT}>Map</Text>
            </Link>
            <Link href="/(guest)/bookings" style={styles.link}>
              <Text style={styles.linkT}>Trips</Text>
            </Link>
            <Link href="/(guest)/favorites" style={styles.link}>
              <Text style={styles.linkT}>Saved</Text>
            </Link>
            <Link href="/(guest)/profile" style={styles.link}>
              <Text style={styles.linkT}>Profile</Text>
            </Link>
          </View>
        }
      />
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  err: { color: colors.danger, marginBottom: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  img: { width: "100%", height: 160, backgroundColor: colors.surface2 },
  ph: { justifyContent: "center", alignItems: "center" },
  t: { color: colors.text, fontWeight: "600", padding: 12, paddingBottom: 4 },
  nav: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 24, marginBottom: 40 },
  link: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.goldDim },
  linkT: { color: colors.gold, fontWeight: "600" },
});
