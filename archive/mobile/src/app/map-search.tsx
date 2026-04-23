import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config";
import type { Listing } from "../lib/useListings";
import { colors } from "../theme/colors";

const TABLET_MIN_WIDTH = 768;

const DEFAULT_REGION = {
  latitude: 45.5017,
  longitude: -73.5673,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export default function MapSearchScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const split = width >= TABLET_MIN_WIDTH;
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/api/bnhub/public/listings`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json().catch(() => ({}))) as { listings?: Listing[]; error?: string };
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Could not load listings.");
        setListings([]);
        return;
      }
      setListings(Array.isArray(data.listings) ? data.listings : []);
    } catch {
      setErr("Network error — check EXPO_PUBLIC_API_BASE_URL.");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const withCoords = useMemo(
    () =>
      listings.filter(
        (l) => typeof l.latitude === "number" && typeof l.longitude === "number" && Number.isFinite(l.latitude) && Number.isFinite(l.longitude)
      ),
    [listings]
  );

  const region = useMemo(() => {
    if (withCoords.length === 0) return DEFAULT_REGION;
    const lats = withCoords.map((l) => l.latitude!);
    const lngs = withCoords.map((l) => l.longitude!);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    const pad = 0.04;
    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: Math.max(0.08, maxLat - minLat + pad),
      longitudeDelta: Math.max(0.08, maxLng - minLng + pad),
    };
  }, [withCoords]);

  const mapEl = (
    <MapView provider={PROVIDER_DEFAULT} style={split ? styles.mapSplit : styles.map} initialRegion={region}>
      {withCoords.map((l) => (
        <Marker
          key={l.id}
          coordinate={{ latitude: l.latitude!, longitude: l.longitude! }}
          title={l.title}
          description={l.city ?? undefined}
          onPress={() => router.push({ pathname: "/(tabs)/property", params: { id: l.id } })}
        />
      ))}
    </MapView>
  );

  const listHeader = (
    <>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Explore on map</Text>
        <Text style={styles.sub}>
          Tablet: list + map split. Phone: map first — tap pins or open from search results.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadBlock}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.muted}>Loading listings…</Text>
        </View>
      ) : null}

      {err ? (
        <View style={styles.banner}>
          <Text style={styles.err}>{err}</Text>
          <Pressable onPress={() => void load()} style={styles.retry}>
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );

  const footerNote = (
    <Text style={styles.footerNote}>
      {withCoords.length === 0
        ? "No geocoded listings yet. Set latitude/longitude on listings for pins."
        : `${withCoords.length} listing${withCoords.length === 1 ? "" : "s"} on map.`}
    </Text>
  );

  if (split) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.splitRow}>
          <View style={[styles.listPane, { width: Math.min(420, width * 0.38) }]}>
            {listHeader}
            <FlatList
              data={withCoords}
              keyExtractor={(item) => item.id}
              ListFooterComponent={<View style={styles.listFooter}>{footerNote}</View>}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.listRow, pressed && { opacity: 0.88 }]}
                  onPress={() => router.push({ pathname: "/(tabs)/property", params: { id: item.id } })}
                >
                  <Text style={styles.listTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.listMeta} numberOfLines={1}>
                    {item.city ?? "—"}
                  </Text>
                </Pressable>
              )}
            />
          </View>
          <View style={styles.mapPane}>{mapEl}</View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {listHeader}
      {mapEl}
      <View style={styles.footer}>{footerNote}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  splitRow: { flex: 1, flexDirection: "row" },
  listPane: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border },
  mapPane: { flex: 1, paddingVertical: 8 },
  listRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listTitle: { color: colors.text, fontWeight: "700", fontSize: 15 },
  listMeta: { color: colors.muted, marginTop: 4, fontSize: 13 },
  listFooter: { padding: 16 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  back: { color: colors.gold, fontWeight: "600", fontSize: 16, marginBottom: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: 8 },
  sub: { color: colors.muted, lineHeight: 20, fontSize: 14 },
  loadBlock: { alignItems: "center", paddingVertical: 16 },
  muted: { color: colors.muted, marginTop: 8 },
  banner: { paddingHorizontal: 20, marginBottom: 8 },
  err: { color: colors.danger, marginBottom: 8 },
  retry: { alignSelf: "flex-start", backgroundColor: colors.gold, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  retryLabel: { color: "#0a0a0a", fontWeight: "700" },
  map: { flex: 1, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, overflow: "hidden" },
  mapSplit: { flex: 1, marginHorizontal: 8, marginBottom: 8, borderRadius: 16, overflow: "hidden" },
  footer: { padding: 20, paddingTop: 0 },
  footerNote: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },
});
