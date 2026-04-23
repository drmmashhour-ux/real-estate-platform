import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/lib/theme";

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {!!sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  label: {
    color: theme.colors.gold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  value: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 10,
  },
  sub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
});
