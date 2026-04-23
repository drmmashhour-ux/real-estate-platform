import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

const GOLD = "#D4AF37";

/**
 * Primary tab shell — luxury black/gold (`#0D0D0D` tab bar).
 * Hidden: `property`, `booking` (deep-link / legacy listing flows).
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0D0D0D",
          borderTopColor: "#222222",
          height: Platform.OS === "ios" ? 84 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
        },
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: "rgba(255,255,255,0.5)",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen name="property" options={{ href: null }} />
      <Tabs.Screen name="booking" options={{ href: null }} />
    </Tabs>
  );
}
