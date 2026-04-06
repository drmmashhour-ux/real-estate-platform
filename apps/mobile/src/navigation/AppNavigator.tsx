import { DarkTheme, type Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import { ListingDetailsScreen } from "../screens/ListingDetailsScreen";
import { ListingsScreen } from "../screens/ListingsScreen";
import { BookingScreen } from "../screens/BookingScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { AIAssistantScreen } from "../screens/AIAssistantScreen";
import { colors } from "../theme/colors";
import type { ManagerStackParamList } from "./types";

const Stack = createNativeStackNavigator<ManagerStackParamList>();

const managerTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

const screenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.text, fontWeight: "600" as const },
  contentStyle: { backgroundColor: colors.background },
};

/**
 * LECIPM Manager stack — mount inside `NavigationContainer` (see `app/manager.tsx`).
 */
export function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "LECIPM Manager" }} />
      <Stack.Screen name="Listings" component={ListingsScreen} options={{ title: "Listings" }} />
      <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} options={{ title: "Details" }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: "Book" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
      <Stack.Screen name="AIAssistant" component={AIAssistantScreen} options={{ title: "AI Assistant" }} />
    </Stack.Navigator>
  );
}

export { managerTheme };
