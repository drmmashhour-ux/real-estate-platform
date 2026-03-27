import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput } from "react-native";
import { GoldButton } from "../../components/ui/GoldButton";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { supabase } from "../../lib/supabase";
import { colors } from "../../theme/colors";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSignUp() {
    if (!supabase) {
      Alert.alert("Configuration", "Set Supabase env vars in .env");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      Alert.alert("Sign up failed", error.message);
      return;
    }
    Alert.alert("Check email", "Confirm your email if required, then sign in.");
    router.replace("/auth/sign-in");
  }

  return (
    <ScreenChrome title="Create account" subtitle="Join BNHub stays">
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
        placeholder="Min 8 characters"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <GoldButton label={busy ? "Creating…" : "Sign up"} onPress={() => void onSignUp()} />
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
});
