import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type { ManagerStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<ManagerStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.kicker}>LECIPM Manager</Text>
      <Text style={styles.title}>Stays & real estate</Text>
      <Text style={styles.subtitle}>AI-managed marketplace — browse, book, manage your profile.</Text>

      <View style={styles.actions}>
        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={() => navigation.navigate("Listings")}>
          <Text style={styles.primaryBtnText}>Browse listings</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]} onPress={() => navigation.navigate("Profile")}>
          <Text style={styles.secondaryBtnText}>Profile</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]} onPress={() => navigation.navigate("AIAssistant")}>
          <Text style={styles.secondaryBtnText}>AI Assistant</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]} onPress={() => router.push("/(tabs)")}>
          <Text style={styles.ghostBtnText}>Classic hub (tabs)</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  kicker: {
    color: colors.primary,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
  },
  actions: { gap: 14 },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#0b0b0b", fontSize: 16, fontWeight: "600" },
  secondaryBtn: {
    backgroundColor: colors.card,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.primary, fontSize: 16, fontWeight: "600" },
  ghostBtn: { paddingVertical: 12, alignItems: "center" },
  ghostBtnText: { color: colors.muted, fontSize: 15 },
  pressed: { opacity: 0.88 },
});
