import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config";
import { devGetDebugSnapshot } from "../lib/devDebug";
import { supabase } from "../lib/supabase";
import { colors } from "../theme/colors";

/**
 * Dev-only diagnostics (no secrets). Open from home when __DEV__ or navigate to /dev-debug.
 */
export default function DevDebugScreen() {
  const router = useRouter();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!__DEV__) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.pad}>
          <Text style={styles.muted}>Debug panel is only available in development builds.</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const snap = devGetDebugSnapshot();
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "(not set)";
  const supabaseAnonSet = Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.length);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.kicker}>DEV</Text>
        <Text style={styles.head}>BNHub debug</Text>
        <Text style={styles.muted}>No secret keys shown. tick={tick}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>API base URL</Text>
          <Text style={styles.mono} selectable>
            {API_BASE_URL}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Supabase URL</Text>
          <Text style={styles.mono} selectable numberOfLines={3}>
            {supabaseUrl}
          </Text>
          <Text style={styles.hint}>Anon key present: {supabaseAnonSet ? "yes" : "no"}</Text>
          <Text style={styles.hint}>Client initialized: {supabase ? "yes" : "no"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Last booking (session)</Text>
          <Text style={styles.mono} selectable>
            {snap.lastBookingId ?? "—"}
          </Text>
          <Text style={styles.labelSp}>Last Stripe session</Text>
          <Text style={styles.mono} selectable numberOfLines={2}>
            {snap.lastStripeSessionId ?? "—"}
          </Text>
          <Text style={styles.labelSp}>Last payment status (poll)</Text>
          <Text style={styles.mono}>{snap.lastPaymentStatus ?? "—"}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 24, paddingBottom: 40 },
  back: { color: colors.gold, fontWeight: "600", marginBottom: 16 },
  kicker: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 8 },
  head: { color: colors.gold, fontSize: 24, fontWeight: "800", marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 20, fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  labelSp: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 12 },
  mono: { color: colors.text, fontSize: 13, marginTop: 6, fontFamily: "System" },
  hint: { color: colors.muted, fontSize: 12, marginTop: 8 },
});
