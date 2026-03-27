import { Stack } from "expo-router";
import { colors } from "../../theme/colors";

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
