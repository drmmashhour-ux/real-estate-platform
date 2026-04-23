import { Stack } from "expo-router";

export default function DashboardStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#000000" },
      }}
    />
  );
}
