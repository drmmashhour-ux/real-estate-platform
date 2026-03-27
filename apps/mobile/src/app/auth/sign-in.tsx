import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { GoldButton } from "../../components/ui/GoldButton";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { supabase } from "../../lib/supabase";
import { colors } from "../../theme/colors";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSignIn() {
    if (!supabase) {
      Alert.alert("Configuration", "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      Alert.alert("Sign in failed", error.message);
      return;
    }
    router.replace("/");
  }

  return (
    <ScreenChrome title="BNHub" subtitle="Sign in to continue">
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••••"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <GoldButton label={busy ? "Signing in…" : "Sign in"} onPress={() => void onSignIn()} />
      <Link href="/auth/sign-up" style={styles.link}>
        <Text style={styles.linkText}>Create account</Text>
      </Link>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textMuted, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  link: { marginTop: 24, alignSelf: "center" },
  linkText: { color: colors.gold, fontSize: 15 },
});
