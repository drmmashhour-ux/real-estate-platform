import { Link, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { ScreenChrome } from "../../../components/ui/ScreenChrome";
import { colors } from "../../../theme/colors";

export default function HostListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ScreenChrome title="Listing" subtitle={id}>
      <Link href={`/(host)/listings/${id}/photos`} style={styles.l}>
        <Text style={styles.t}>Photos</Text>
      </Link>
      <Link href={`/(host)/listings/${id}/amenities`} style={styles.l}>
        <Text style={styles.t}>Amenities</Text>
      </Link>
      <Link href={`/(host)/listings/${id}/checkin-checkout`} style={styles.l}>
        <Text style={styles.t}>Check-in / check-out</Text>
      </Link>
      <Text style={styles.m}>PATCH endpoints for edits ship next; data loads from apps/web today.</Text>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  l: { marginVertical: 8 },
  t: { color: colors.gold, fontWeight: "700" },
  m: { color: colors.textMuted, marginTop: 16 },
});
