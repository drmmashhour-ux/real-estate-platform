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

export default function FeedbackScreen() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [screenHint] = useState("feedback");
  const [sending, setSending] = useState(false);

  if (!isSoftLaunchEnabled()) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.pad}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.muted}>Feedback is available when soft launch mode is enabled.</Text>
        </View>
      </SafeAreaView>
    );
  }

  async function submit() {
    const m = message.trim();
    if (m.length < 3) {
      Alert.alert("Message", "Please enter a few words about your experience.");
      return;
    }
    setSending(true);
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/api/bnhub/feedback`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          message: m,
          email: email.trim() || undefined,
          screen: screenHint,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        Alert.alert("Could not send", typeof data.error === "string" ? data.error : "Try again later.");
        return;
      }
      Alert.alert("Thank you", "Your feedback helps us improve BNHub.", [
        { text: "OK", onPress: () => router.back() },
      ]);
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
        <Text style={styles.kicker}>FEEDBACK</Text>
        <Text style={styles.head}>Send feedback</Text>
        <Text style={styles.lead}>Tell us what works and what does not. No payment data is collected here.</Text>

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Your message"
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
          maxLength={4000}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email (optional)"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.inputSingle}
        />

        <Pressable
          onPress={() => void submit()}
          disabled={sending}
          style={({ pressed }) => [styles.cta, sending && styles.ctaDisabled, pressed && !sending && styles.ctaPressed]}
        >
          {sending ? (
            <ActivityIndicator color="#0a0a0a" />
          ) : (
            <Text style={styles.ctaLabel}>Submit</Text>
          )}
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
  input: {
    minHeight: 140,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    marginBottom: 14,
    textAlignVertical: "top",
  },
  inputSingle: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    marginBottom: 20,
  },
  cta: {
    backgroundColor: colors.gold,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  ctaDisabled: { opacity: 0.6 },
  ctaPressed: { opacity: 0.92 },
  ctaLabel: { fontWeight: "800", color: "#0a0a0a", fontSize: 16 },
  muted: { color: colors.muted, padding: 24 },
});
