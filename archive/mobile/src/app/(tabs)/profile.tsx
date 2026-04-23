import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/AppScreen";
import { SectionCard } from "@/components/SectionCard";
import { theme } from "@/lib/theme";

export default function ProfileTab() {
  return (
    <AppScreen>
      <SectionCard>
        <Text style={styles.name}>LECIPM User</Text>
        <Text style={styles.email}>user@lecipm.com</Text>

        <View style={styles.links}>
          <Link href="/dashboard/admin" style={styles.link}>
            Admin dashboard
          </Link>
          <Link href="/dashboard/investor" style={styles.link}>
            Investor dashboard
          </Link>
          <Link href="/dashboard/broker" style={styles.link}>
            Broker dashboard
          </Link>
        </View>
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  name: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  email: {
    color: theme.colors.textMuted,
    marginTop: 6,
  },
  links: {
    marginTop: 18,
    gap: 10,
  },
  link: {
    color: theme.colors.gold,
  },
});
