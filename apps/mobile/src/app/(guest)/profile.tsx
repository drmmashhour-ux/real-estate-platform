import { router } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { GoldButton } from "../../components/ui/GoldButton";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { useAuth } from "../../hooks/useAuth";
import { colors } from "../../theme/colors";

export default function GuestProfile() {
  const { me, signOut } = useAuth();
  return (
    <ScreenChrome title="Profile" subtitle="Account & sessions">
      <Text style={styles.t}>{me?.user.email}</Text>
      <Text style={styles.m}>Role · {me?.appRole}</Text>
      <GoldButton label="Sign out" onPress={() => void signOut().then(() => router.replace("/auth/sign-in"))} />
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  t: { color: colors.text, fontSize: 18, fontWeight: "700" },
  m: { color: colors.textMuted, marginVertical: 12 },
});
