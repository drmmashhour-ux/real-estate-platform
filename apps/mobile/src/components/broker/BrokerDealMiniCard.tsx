import { View, Text, Pressable, StyleSheet } from "react-native";

export function BrokerDealMiniCard(props: { dealCode: string | null; status: string; onOpen?: () => void }) {
  return (
    <Pressable style={styles.card} onPress={props.onOpen}>
      <Text style={styles.code}>{props.dealCode ?? "Deal"}</Text>
      <Text style={styles.st}>{props.status}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 12, backgroundColor: "#18181b", marginBottom: 8 },
  code: { color: "#fafafa", fontWeight: "600" },
  st: { color: "#a1a1aa", fontSize: 12, marginTop: 4 },
});
