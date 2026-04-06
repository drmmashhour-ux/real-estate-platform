import { Stack } from "expo-router";
import { colors } from "../../theme/colors";

/** Tabs stack: soft-launch hub + property + booking (no global auth). */
export default function TabsGroupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
