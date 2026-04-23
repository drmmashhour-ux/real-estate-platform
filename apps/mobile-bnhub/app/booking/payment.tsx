import { View, Button, StyleSheet } from "react-native";

export default function Payment() {
  return (
    <View style={styles.container}>
      <Button title="Pay Now" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" }
});
