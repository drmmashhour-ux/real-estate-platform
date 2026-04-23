import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthedEntryRedirect } from "../../components/auth/AuthRouteGuard";
import { useAppAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { LecipmLogo } from "../../components/branding/LecipmLogo";
import { colors } from "../../theme/colors";
import { decodeBookingResume } from "../../lib/bookingResume";

export default function SignInScreen() {
  const router = useRouter();
  const { returnBooking } = useLocalSearchParams<{ returnBooking?: string | string[] }>();
  const returnBookingRaw = Array.isArray(returnBooking) ? returnBooking[0] : returnBooking;
  const { refreshMe } = useAppAuth();
  const authedRedirect = useAuthedEntryRedirect();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (authedRedirect) return authedRedirect;

  async function handleLogin() {
    if (!supabase) {
      Alert.alert("Configuration", "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);

    if (error) {
      Alert.alert("Sign in", error.message);
      return;
    }

    await refreshMe();
    const resume = decodeBookingResume(returnBookingRaw);
    if (resume) {
      router.replace({
        pathname: "/booking-summary",
        params: {
          listingId: resume.listingId,
          price: resume.price,
          title: resume.title,
          checkIn: resume.checkIn,
          checkOut: resume.checkOut,
          guests: resume.guests,
          coverUrl: resume.coverUrl ?? "",
        },
      });
      return;
    }
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.wrap}>
        <View style={styles.logoHero}>
          <LecipmLogo size={56} showWordmark tagline="Le Carrefour Immobilier Prestige" centered />
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Optional — browse and book as a guest anytime.</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <Pressable
          onPress={() => void handleLogin()}
          disabled={busy}
          style={({ pressed }) => [styles.primary, busy && styles.disabled, pressed && !busy && styles.primaryPressed]}
        >
          <Text style={styles.primaryLabel}>{busy ? "Signing in…" : "Sign in"}</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(auth)/sign-up",
              params: returnBookingRaw ? { returnBooking: returnBookingRaw } : {},
            })
          }
          style={styles.secondary}
        >
          <Text style={styles.secondaryLabel}>Create account</Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.ghost}>
          <Text style={styles.ghostLabel}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  wrap: { flex: 1, justifyContent: "center", padding: 24 },
  logoHero: { alignItems: "center", marginBottom: 20 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  sub: { color: colors.muted, marginBottom: 28, lineHeight: 20, fontSize: 14 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    marginBottom: 16,
    backgroundColor: colors.card,
    fontSize: 16,
  },
  primary: {
    backgroundColor: colors.gold,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    alignItems: "center",
  },
  primaryPressed: { opacity: 0.92 },
  disabled: { opacity: 0.55 },
  primaryLabel: { fontWeight: "700", color: "#0a0a0a" },
  secondary: { marginTop: 16, alignItems: "center" },
  secondaryLabel: { color: colors.gold, fontWeight: "600" },
  ghost: { marginTop: 20, alignItems: "center", padding: 8 },
  ghostLabel: { color: colors.muted, fontWeight: "600" },
});
