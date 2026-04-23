import { Stack } from "expo-router";
import { AuthRouteGuard } from "../../components/auth/AuthRouteGuard";
import { colors } from "../../theme/colors";

/** Authenticated BNHub host routes at `/host/*` (bookings + instructions). */
export default function HostBookingsLayout() {
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
      >
        <Stack.Screen name="dashboard" options={{ title: "Host dashboard" }} />
        <Stack.Screen name="bookings/[id]" options={{ title: "Host booking" }} />
      </Stack>
    </AuthRouteGuard>
  );
}
