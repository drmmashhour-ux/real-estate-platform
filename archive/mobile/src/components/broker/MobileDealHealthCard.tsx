import { View, Text, StyleSheet } from "react-native";

export function MobileDealHealthCard(props: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.l}>{props.label}</Text>
      <Text style={styles.v}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  l: { color: "#a1a1aa", fontSize: 13 },
  v: { color: "#e4e4e7", fontSize: 13, fontWeight: "500" },
});
