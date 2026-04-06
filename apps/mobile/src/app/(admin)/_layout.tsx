import { Stack } from "expo-router";
import { AuthRouteGuard } from "../../components/auth/AuthRouteGuard";
import { colors } from "../../theme/colors";

export default function AdminLayout() {
  return (
    <AuthRouteGuard variant="admin">
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
