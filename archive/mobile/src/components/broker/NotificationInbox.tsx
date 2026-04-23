import { View, Text, FlatList, StyleSheet } from "react-native";

type Row = { id: string; title: string; message: string | null };

export function NotificationInbox(props: { items: Row[] }) {
  if (props.items.length === 0) {
    return <Text style={styles.empty}>No broker notifications.</Text>;
  }
  return (
    <FlatList
      data={props.items}
      keyExtractor={(x) => x.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.t}>{item.title}</Text>
          {item.message ? <Text style={styles.m}>{item.message}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: { color: "#71717a", padding: 12 },
  card: { padding: 12, backgroundColor: "#18181b", borderRadius: 12, marginBottom: 8 },
  t: { color: "#fafafa", fontWeight: "600" },
  m: { color: "#a1a1aa", marginTop: 4, fontSize: 13 },
});
