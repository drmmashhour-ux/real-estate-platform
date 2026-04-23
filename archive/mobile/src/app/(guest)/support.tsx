import { Link } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { colors } from "../../theme/colors";

export default function GuestSupport() {
  return (
    <ScreenChrome title="Help & safety" subtitle="We never guess neighborhood danger — policy + review">
      <Text style={styles.t}>
        Report issues through BNHub trust & safety. For urgent emergencies, contact local emergency services.
      </Text>
      <Text style={styles.m}>WhatsApp / contact CTAs: add when host listing enables them (same rules as web).</Text>
      <Link href="https://bnhub.example/help" asChild>
        <Text style={styles.link}>Help center (web)</Text>
      </Link>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  t: { color: colors.textMuted, lineHeight: 22, marginBottom: 12 },
  m: { color: colors.textMuted, marginBottom: 16 },
  link: { color: colors.gold, fontWeight: "700" },
});
