import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { colors } from "../../theme/colors";

export default function HostLayout() {
  const { ready, me } = useAuth();
  if (!ready) return null;
  if (!me) return <Redirect href="/auth/sign-in" />;
  if (me.appRole !== "host" && me.appRole !== "admin") {
    return <Redirect href="/(guest)/home" />;
  }
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.gold,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
