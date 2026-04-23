import { router } from "expo-router";
import { Text, View } from "react-native";
import { VerifiedUserBadge } from "../../components/VerifiedUserBadge";
import { GoldButton } from "../../components/ui/GoldButton";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { useAppAuth } from "../../hooks/useAuth";
import { colors } from "../../theme/colors";

export default function HostProfile() {
  const { me, signOut } = useAppAuth();
  return (
    <ScreenChrome title="Host profile" subtitle={me?.user.email ?? ""}>
      {me?.identityVerification?.isVerified ? (
        <View style={{ marginBottom: 14 }}>
          <VerifiedUserBadge />
        </View>
      ) : null}
      <Text style={{ color: colors.textMuted, marginBottom: 20 }}>Stripe Connect status: check web host dashboard.</Text>
      <GoldButton label="Sign out" onPress={() => void signOut().then(() => router.replace("/(guest)/home"))} />
    </ScreenChrome>
  );
}
