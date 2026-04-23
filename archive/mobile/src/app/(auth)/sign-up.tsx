import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput } from "react-native";
import { useAuthedEntryRedirect } from "../../components/auth/AuthRouteGuard";
import { GoldButton } from "../../components/ui/GoldButton";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { useAppAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { colors } from "../../theme/colors";
import { decodeBookingResume } from "../../lib/bookingResume";

export default function SignUpScreen() {
  const authedRedirect = useAuthedEntryRedirect();
  const { returnBooking, invite, ref } = useLocalSearchParams<{
    returnBooking?: string | string[];
    invite?: string | string[];
    ref?: string | string[];
  }>();
  const returnBookingRaw = Array.isArray(returnBooking) ? returnBooking[0] : returnBooking;
  const inviteRaw = (Array.isArray(invite) ? invite[0] : invite) || (Array.isArray(ref) ? ref[0] : ref);
  const inviteCode =
    typeof inviteRaw === "string" ? inviteRaw.trim().slice(0, 64) : "";
  const { refreshMe } = useAppAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  if (authedRedirect) return authedRedirect;

  async function onSignUp() {
    if (!supabase) {
      Alert.alert("Configuration", "Set Supabase env vars in .env");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      ...(inviteCode ? { options: { data: { invite_code: inviteCode } } } : {}),
    });
    setBusy(false);
    if (error) {
      Alert.alert("Sign up failed", error.message);
      return;
    }
    Alert.alert("Check email", "Confirm your email if your project requires it.");
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
    <ScreenChrome title="Create account" subtitle="Join BNHub stays" showBrand>
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
      <Text style={styles.label}>Confirm password</Text>
      <TextInput
        style={styles.input}
        placeholder="Re-enter password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <Text style={styles.label}>Phone (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="+1 …"
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      {inviteCode ? (
        <Text style={styles.note}>Invite code will be saved to your profile metadata.</Text>
      ) : null}
      <Text style={styles.note}>
        Email verification is required before some actions (e.g. reviews). Complete the link Supabase sends you.
      </Text>
      <GoldButton label={busy ? "Creating…" : "Sign up"} onPress={() => void onSignUp()} />
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 8 },
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
