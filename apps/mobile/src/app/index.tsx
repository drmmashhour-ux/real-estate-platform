import { Redirect, router } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { GoldButton } from "../components/ui/GoldButton";
import { useAuth } from "../hooks/useAuth";
import { colors } from "../theme/colors";

export default function Index() {
  const { ready, session, me, profileLoadFailed, signOut } = useAuth();
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }
  if (!session) return <Redirect href="/auth/sign-in" />;
  if (profileLoadFailed) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.bg }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Can’t load profile</Text>
        <Text style={{ color: colors.textMuted, marginBottom: 20 }}>
          Check EXPO_PUBLIC_API_BASE_URL, the platform Supabase service role key, and that your Supabase user exists in the Prisma User table.
        </Text>
        <GoldButton label="Sign out" onPress={() => void signOut().then(() => router.replace("/auth/sign-in"))} />
      </View>
    );
  }
  if (!me) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }
  if (me.appRole === "admin") return <Redirect href="/(admin)/dashboard" />;
  if (me.appRole === "host") return <Redirect href="/(host)/dashboard" />;
  return <Redirect href="/(guest)/home" />;
}
