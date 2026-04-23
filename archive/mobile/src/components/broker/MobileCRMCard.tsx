import { View, Text, StyleSheet, Pressable } from "react-native";

export function MobileCRMCard(props: { name: string; subtitle: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.card} onPress={props.onPress}>
      <Text style={styles.n}>{props.name}</Text>
      <Text style={styles.s}>{props.subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 12, backgroundColor: "#18181b", marginBottom: 8 },
  n: { color: "#fafafa", fontWeight: "600" },
  s: { color: "#a1a1aa", fontSize: 12, marginTop: 4 },
});
