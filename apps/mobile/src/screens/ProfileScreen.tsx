import { useEffect, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppAuth } from "../hooks/useAuth";
import type { ManagerStackParamList } from "../navigation/types";
import { REALTIME_URL } from "../config";
import { login, signup } from "../services/api";
import { subscribeLecipmBookingEvents } from "../services/socket";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<ManagerStackParamList, "Profile">;

export function ProfileScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const { ready, me, signOut, refreshMe } = useAppAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [liveFeed, setLiveFeed] = useState<string | null>(null);

  useEffect(() => {
    if (!REALTIME_URL || !me?.user?.id) return;
    const uid = me.user.id;
    return subscribeLecipmBookingEvents((ev, data) => {
      if (data.hostId !== uid && data.guestId !== uid) return;
      setLiveFeed(
        `${ev.replace(/_/g, " ")} · ${data.bookingId?.slice(0, 8) ?? "?"}${data.status ? ` · ${data.status}` : ""}`
      );
    });
  }, [me?.user?.id]);

  const onLogin = async () => {
    setBusy(true);
    try {
      const res = await login(email, password);
      if (!res.ok) {
        Alert.alert("Sign-in failed", res.error);
        return;
      }
      await refreshMe();
      Alert.alert("Signed in", res.email ?? res.userId);
    } finally {
      setBusy(false);
    }
  };

  const onSignup = async () => {
    setBusy(true);
    try {
      const res = await signup(email, password);
      if (!res.ok) {
        Alert.alert("Sign-up failed", res.error);
        return;
      }
      await refreshMe();
      if (res.needsEmailConfirm) {
        Alert.alert("Check your email", "Confirm your address to finish sign-up.");
      } else {
        Alert.alert("Welcome", res.email ?? res.userId);
      }
    } finally {
      setBusy(false);
    }
  };

  const onSignOut = async () => {
    await signOut();
  };

  if (!ready) {
    return (
      <View style={[styles.centered, { paddingBottom: insets.bottom }]}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (me?.user) {
    const u = me.user;
    return (
      <View style={[styles.container, { paddingTop: 16, paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.section}>Signed in</Text>
        <Text style={styles.value}>{u.email ?? u.id}</Text>
        {u.name ? <Text style={styles.meta}>{u.name}</Text> : null}
        <Text style={styles.meta}>Role: {me.appRole}</Text>
        {liveFeed ? (
          <View style={styles.liveBox}>
            <Text style={styles.liveBoxLabel}>Bookings (live)</Text>
            <Text style={styles.liveBoxText}>{liveFeed}</Text>
          </View>
        ) : null}
        <Pressable style={({ pressed }) => [styles.signOut, pressed && styles.pressed]} onPress={() => void onSignOut()}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: 16, paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.section}>Account</Text>
      <Text style={styles.hint}>Uses Supabase — same session as mobile API bookings.</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor={colors.muted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••••"
        placeholderTextColor={colors.muted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable style={({ pressed }) => [styles.primary, busy && styles.pressed]} onPress={() => void onLogin()} disabled={busy}>
        <Text style={styles.primaryText}>Sign in</Text>
      </Pressable>
      <Pressable style={({ pressed }) => [styles.secondary, busy && styles.pressed]} onPress={() => void onSignup()} disabled={busy}>
        <Text style={styles.secondaryText}>Create account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  section: { color: colors.primary, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 },
  hint: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 20 },
  label: { color: colors.muted, fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  value: { color: colors.text, fontSize: 20, fontWeight: "600" },
  meta: { color: colors.muted, fontSize: 15, marginTop: 8 },
  liveBox: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  liveBoxLabel: { color: colors.primary, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  liveBoxText: { color: colors.text, fontSize: 14 },
  primary: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: { color: "#0b0b0b", fontWeight: "700", fontSize: 16 },
  secondary: {
    marginTop: 12,
    backgroundColor: colors.card,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: { color: colors.primary, fontWeight: "600", fontSize: 16 },
  signOut: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.danger,
  },
  signOutText: { color: colors.danger, fontWeight: "600", fontSize: 16 },
  muted: { color: colors.muted },
  pressed: { opacity: 0.88 },
});
