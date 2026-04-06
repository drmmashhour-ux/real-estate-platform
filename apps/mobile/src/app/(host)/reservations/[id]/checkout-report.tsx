import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { ScreenChrome } from "../../../../components/ui/ScreenChrome";
import { mobileFetch } from "../../../../services/apiClient";
import { colors } from "../../../../theme/colors";

export default function HostCheckoutReport() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [damage, setDamage] = useState(false);
  const [missing, setMissing] = useState("");
  const [notes, setNotes] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      mobileFetch<{ ok: boolean }>(`/api/mobile/v1/host/bookings/${id}/checkout-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          damageReported: damage,
          missingItemsNote: missing.trim() || undefined,
          hostNotes: notes.trim() || undefined,
        }),
      }),
    onSuccess: () => {
      Alert.alert("Submitted", "Checkout report was recorded.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  return (
    <ScreenChrome title="Checkout report" subtitle="Damage & missing items">
      <View style={styles.row}>
        <Text style={styles.label}>Damage reported</Text>
        <Switch value={damage} onValueChange={setDamage} trackColor={{ true: colors.goldDim }} />
      </View>
      <Text style={styles.label}>Missing items / issues</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe anything missing or broken"
        placeholderTextColor={colors.textMuted}
        multiline
        value={missing}
        onChangeText={setMissing}
      />
      <Text style={styles.label}>Internal notes</Text>
      <TextInput
        style={styles.input}
        placeholder="Optional"
        placeholderTextColor={colors.textMuted}
        multiline
        value={notes}
        onChangeText={setNotes}
      />
      <GoldButton label={submit.isPending ? "Sending…" : "Submit report"} onPress={() => submit.mutate()} />
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  label: { color: colors.text, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 14,
  },
});
