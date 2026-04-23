import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LecipmLogo } from "../branding/LecipmLogo";
import { colors } from "../../theme/colors";

export function ScreenChrome({
  title,
  subtitle,
  showBrand,
  children,
}: {
  title: string;
  subtitle?: string;
  /** LECIPM mark + wordmark above the screen title. */
  showBrand?: boolean;
  children?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        {showBrand ? (
          <View style={styles.brandWrap}>
            <LecipmLogo size={40} showWordmark tagline="Le Carrefour Immobilier Prestige" centered />
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  brandWrap: { alignItems: "center", marginBottom: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700" },
  sub: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  body: { flex: 1, padding: 20 },
});
