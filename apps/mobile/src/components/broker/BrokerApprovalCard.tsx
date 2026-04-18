import { View, Text, StyleSheet } from "react-native";

export function BrokerApprovalCard(props: { title: string; subtitle: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.t}>{props.title}</Text>
      <Text style={styles.s}>{props.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 12, backgroundColor: "#1c1917", borderWidth: 1, borderColor: "#44403c", marginBottom: 8 },
  t: { color: "#fafaf9", fontWeight: "600" },
  s: { color: "#a8a29e", fontSize: 13, marginTop: 4 },
});
