import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

export function QuickStatsBar(props: { activeDeals: number; unread: number }) {
  return (
    <View style={styles.row}>
      <View style={styles.cell}>
        <Text style={styles.num}>{props.activeDeals}</Text>
        <Text style={styles.lbl}>Active deals</Text>
      </View>
      <View style={styles.cell}>
        <Text style={styles.num}>{props.unread}</Text>
        <Text style={styles.lbl}>Unread (broker)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, marginVertical: 12 },
  cell: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  num: { fontSize: 22, fontWeight: "700", color: "#f4f4f5" },
  lbl: { fontSize: 12, color: "#a1a1aa", marginTop: 4 },
});
