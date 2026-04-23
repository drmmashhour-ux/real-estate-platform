import { Pressable, StyleSheet, Text, View } from "react-native";

export function EmptyCard(props: { title: string; subtitle: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.cardTitle}>{props.title}</Text>
      <Text style={styles.cardSubtle}>{props.subtitle}</Text>
    </View>
  );
}

export function MetricCard(props: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{props.value}</Text>
      <Text style={styles.metricLabel}>{props.label}</Text>
    </View>
  );
}

export function TabButton(props: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={props.onPress} style={[styles.tabButton, props.active ? styles.tabButtonActive : null]}>
      <Text style={[styles.tabButtonText, props.active ? styles.tabButtonTextActive : null]}>{props.label}</Text>
    </Pressable>
  );
}

export const mobileUiStyles = StyleSheet.create({
  emptyCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderStyle: "dashed",
    backgroundColor: "#0c0d10",
    gap: 8,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  cardSubtle: {
    color: "#c4c7ce",
    lineHeight: 20,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#17181d",
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },
  metricLabel: {
    color: "#a1a1aa",
    marginTop: 6,
    fontSize: 12,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#111111",
  },
  tabButtonActive: {
    backgroundColor: "#d4af37",
    borderColor: "#d4af37",
  },
  tabButtonText: {
    color: "#e5e7eb",
    fontWeight: "600",
  },
  tabButtonTextActive: {
    color: "#050505",
  },
});

const styles = mobileUiStyles;
