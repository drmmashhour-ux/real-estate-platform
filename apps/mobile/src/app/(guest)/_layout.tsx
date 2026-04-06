import { Stack } from "expo-router";
import { colors } from "../../theme/colors";

/** Guest stack — public browse. */
export default function GuestLayout() {
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
