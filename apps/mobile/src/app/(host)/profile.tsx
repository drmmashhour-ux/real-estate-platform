import { router } from "expo-router";
import { Text } from "react-native";
import { GoldButton } from "../../components/ui/GoldButton";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { useAuth } from "../../hooks/useAuth";
import { colors } from "../../theme/colors";

export default function HostProfile() {
  const { me, signOut } = useAuth();
  return (
    <ScreenChrome title="Host profile" subtitle={me?.user.email ?? ""}>
      <Text style={{ color: colors.textMuted, marginBottom: 20 }}>Stripe Connect status: check web host dashboard.</Text>
      <GoldButton label="Sign out" onPress={() => void signOut().then(() => router.replace("/auth/sign-in"))} />
    </ScreenChrome>
  );
}
