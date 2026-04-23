import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mobileFetch } from "../../services/apiClient";
import { colors } from "../../theme/colors";

type Featured = { listings: Array<{ id: string; title: string; lat: number | null; lng: number | null; nightPriceCents: number }> };

/** react-native-maps (Expo Go). Production can switch to @rnmapbox/maps + dev build. */
export default function GuestMap() {
  const insets = useSafeAreaInsets();
  const q = useQuery({
    queryKey: ["featured-map"],
    queryFn: () => mobileFetch<Featured>("/api/mobile/v1/listings/featured"),
  });

  const withCoords = (q.data?.listings ?? []).filter((l) => l.lat != null && l.lng != null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <MapView
        style={StyleSheet.absoluteFill}
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude: withCoords[0]?.lat ?? 45.5,
          longitude: withCoords[0]?.lng ?? -73.57,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
      >
        {withCoords.map((l) => (
          <Marker key={l.id} coordinate={{ latitude: l.lat!, longitude: l.lng! }} title={l.title}>
            <View style={styles.pin}>
              <Text style={styles.pinT}>${(l.nightPriceCents / 100).toFixed(0)}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
      <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Map</Text>
        <Link href="/(guest)/search">
          <Text style={styles.link}>List search</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "rgba(10,10,10,0.92)",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: colors.text, fontSize: 18, fontWeight: "700" },
  link: { color: colors.gold, fontWeight: "600" },
  pin: {
    backgroundColor: colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#111",
  },
  pinT: { color: "#111", fontWeight: "800", fontSize: 11 },
});

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
];
