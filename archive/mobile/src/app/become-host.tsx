import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config";
import { isSoftLaunchEnabled } from "../lib/softLaunch";
import { colors } from "../theme/colors";

export default function BecomeHostScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [location, setLocation] = useState("");
  const [sending, setSending] = useState(false);

  if (!isSoftLaunchEnabled()) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.pad}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.muted}>Host interest is available when soft launch mode is enabled.</Text>
        </View>
      </SafeAreaView>
    );
  }

  async function submit() {
    const n = name.trim();
    const e = email.trim().toLowerCase();
    if (n.length < 2) {
      Alert.alert("Name", "Please enter your name.");
      return;
    }
    if (!e.includes("@")) {
      Alert.alert("Email", "Please enter a valid email.");
      return;
    }
    setSending(true);
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/api/bnhub/host-leads`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: n,
          email: e,
          propertyType: propertyType.trim() || undefined,
          location: location.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        Alert.alert("Could not submit", typeof data.error === "string" ? data.error : "Try again later.");
        return;
      }
      Alert.alert("Thanks", "We will reach out about hosting on BNHub.", [{ text: "OK", onPress: () => router.back() }]);
    } catch {
      Alert.alert("Network error", "Check EXPO_PUBLIC_API_BASE_URL and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.kicker}>HOSTS</Text>
        <Text style={styles.head}>Become a host</Text>
        <Text style={styles.lead}>
          Early access — tell us about your place. Full host tools roll out after launch.
        </Text>

        <Text style={styles.label}>Name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Your name" placeholderTextColor={colors.muted} />
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Property type</Text>
        <TextInput
          value={propertyType}
          onChangeText={setPropertyType}
          style={styles.input}
          placeholder="e.g. condo, entire home"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.label}>Location</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          style={styles.input}
          placeholder="City or area"
          placeholderTextColor={colors.muted}
        />

        <Pressable
          onPress={() => void submit()}
          disabled={sending}
          style={({ pressed }) => [styles.cta, sending && styles.ctaDisabled, pressed && !sending && styles.ctaPressed]}
        >
          {sending ? <ActivityIndicator color="#0a0a0a" /> : <Text style={styles.ctaLabel}>Submit interest</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 24, paddingBottom: 40 },
  back: { color: colors.gold, fontWeight: "600", marginBottom: 16 },
  kicker: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 8 },
  head: { color: colors.gold, fontSize: 24, fontWeight: "800", marginBottom: 10 },
  lead: { color: colors.muted, lineHeight: 22, marginBottom: 20, fontSize: 14 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    marginBottom: 14,
  },
  cta: {
    backgroundColor: colors.gold,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    minHeight: 52,
    justifyContent: "center",
  },
  ctaDisabled: { opacity: 0.6 },
  ctaPressed: { opacity: 0.92 },
  ctaLabel: { fontWeight: "800", color: "#0a0a0a", fontSize: 16 },
  muted: { color: colors.muted, padding: 24 },
});
