import { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, ScrollView } from "react-native";

export default function Copilot() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState("");

  async function ask() {
    const r = await fetch("https://api.lecipm.com/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: q }),
    }).then(r => r.json());

    setRes(r.answer);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        value={q}
        onChangeText={setQ}
        placeholder="Ask AI anything..."
      />
      <Button title="Ask AI" onPress={ask} />
      <Text style={styles.response}>{res}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, justifyContent: "center" },
  input: { borderBottomWidth: 1, marginBottom: 20, padding: 10 },
  response: { marginTop: 20, fontSize: 16 }
});
