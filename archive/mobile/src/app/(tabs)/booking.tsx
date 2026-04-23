import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../../theme/colors";

function paramFirst(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Legacy entry: deep links and old flows hit `/(tabs)/booking` — forward to the summary step.
 */
export default function BookingTabRedirect() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string | string[];
    price?: string | string[];
    title?: string | string[];
    checkIn?: string | string[];
    checkOut?: string | string[];
    guests?: string | string[];
  }>();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const listingId = paramFirst(params.id)?.trim() ?? "";
    if (!listingId) {
      router.replace("/(tabs)");
      return;
    }
    router.replace({
      pathname: "/booking-summary",
      params: {
        listingId,
        price: paramFirst(params.price) ?? "",
        title: paramFirst(params.title) ?? "",
        checkIn: paramFirst(params.checkIn) ?? "",
        checkOut: paramFirst(params.checkOut) ?? "",
        guests: paramFirst(params.guests) ?? "1",
        coverUrl: "",
      },
    });
  }, [router, params]);

  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
});
