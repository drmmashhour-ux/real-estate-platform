import { Stack } from "expo-router";
import { AuthRouteGuard } from "../../components/auth/AuthRouteGuard";
import { colors } from "../../theme/colors";

export default function HostLayout() {
  return (
    <AuthRouteGuard variant="host">
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.gold,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </AuthRouteGuard>
  );
}
