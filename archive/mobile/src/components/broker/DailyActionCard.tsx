import { View, Text, StyleSheet, Pressable } from "react-native";

type Action = {
  id: string;
  title: string;
  summary: string;
  urgency: string;
  approvalRequired?: boolean;
};

export function DailyActionCard(props: {
  action: Action;
  onComplete?: () => void;
  onSnooze?: () => void;
}) {
  const { action } = props;
  return (
    <View style={styles.card}>
      <Text style={styles.badge}>{action.urgency.replace(/_/g, " ")}</Text>
      <Text style={styles.title}>{action.title}</Text>
      <Text style={styles.summary}>{action.summary}</Text>
      <View style={styles.row}>
        {props.onComplete ? (
          <Pressable style={styles.btn} onPress={props.onComplete}>
            <Text style={styles.btnText}>Done</Text>
          </Pressable>
        ) : null}
        {props.onSnooze ? (
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={props.onSnooze}>
            <Text style={styles.btnGhostText}>Snooze</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#18181b",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  badge: { fontSize: 10, color: "#fbbf24", textTransform: "uppercase", marginBottom: 6 },
  title: { fontSize: 16, fontWeight: "600", color: "#fafafa" },
  summary: { fontSize: 13, color: "#a1a1aa", marginTop: 6 },
  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "#3f3f46" },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#52525b" },
  btnGhostText: { color: "#e4e4e7", fontWeight: "600", fontSize: 13 },
});
