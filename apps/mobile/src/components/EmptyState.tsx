import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/lib/theme";

export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
});
