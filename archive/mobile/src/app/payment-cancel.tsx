import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

function paramFirst(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/** Opened via `lecipm://payment-cancel?bookingId=…` from web Stripe cancel URL. */
export default function PaymentCancelScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string | string[] }>();
  const bid = paramFirst(bookingId);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Text style={styles.kicker}>BNHUB</Text>
        <Text style={styles.head}>Payment not completed</Text>
        <Text style={styles.sub}>
          You left Stripe before completing payment — no charge was made. Tap below to open checkout again, or adjust your
          dates from the listing.
        </Text>

        {bid ? (
          <View style={styles.card}>
            <Text style={styles.label}>Booking ID</Text>
            <Text style={styles.value} selectable>
              {bid}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={() =>
            bid
              ? router.replace({
                  pathname: "/payment",
                  params: { bookingId: bid },
                })
              : router.replace("/(tabs)")
          }
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaLabel}>{bid ? "Retry payment" : "Browse stays"}</Text>
        </Pressable>

        {bid ? (
          <Pressable
            onPress={() => router.replace({ pathname: "/booking-details", params: { bookingId: bid } })}
            style={styles.secondary}
          >
            <Text style={styles.secondaryLabel}>Booking details</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={() => router.replace("/(tabs)")} style={styles.tertiary}>
          <Text style={styles.tertiaryLabel}>Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  kicker: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 8,
  },
  head: {
    color: colors.gold,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  sub: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    fontSize: 15,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 22,
  },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  value: { color: colors.text, fontSize: 15, marginTop: 8, fontWeight: "600" },
  cta: {
    backgroundColor: colors.gold,
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  ctaPressed: { opacity: 0.92 },
  ctaLabel: { fontWeight: "700", color: "#0a0a0a", fontSize: 16 },
  secondary: { paddingVertical: 14, alignItems: "center", marginBottom: 4 },
  secondaryLabel: { color: colors.gold, fontWeight: "700", fontSize: 15 },
  tertiary: { paddingVertical: 12, alignItems: "center" },
  tertiaryLabel: { color: colors.muted, fontWeight: "600", fontSize: 14 },
});
