import { Stack } from "expo-router";
import { colors } from "../../theme/colors";

export default function AuthGroupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
