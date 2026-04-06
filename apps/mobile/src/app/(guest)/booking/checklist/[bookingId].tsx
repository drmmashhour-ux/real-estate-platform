import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { ScreenChrome } from "../../../../components/ui/ScreenChrome";
import { mobileFetch } from "../../../../services/apiClient";
import { colors } from "../../../../theme/colors";

type Item = {
  id: string;
  itemKey: string;
  label: string | null;
  expected: boolean;
  confirmed: boolean | null;
  note: string | null;
};

type Resp = { items: Item[]; hostDeclaredAt?: string | null };

export default function GuestArrivalChecklist() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [reportText, setReportText] = useState("");
  const [reporting, setReporting] = useState(false);

  const q = useQuery({
    queryKey: ["checklist", bookingId],
    queryFn: () => mobileFetch<Resp>(`/api/mobile/v1/bookings/${bookingId}/checklist`),
    enabled: !!bookingId,
  });

  const save = useMutation({
    mutationFn: (updates: { itemKey: string; confirmed: boolean; note?: string | null }[]) =>
      mobileFetch<Resp>(`/api/mobile/v1/bookings/${bookingId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["checklist", bookingId] });
      void qc.invalidateQueries({ queryKey: ["booking", bookingId] });
      Alert.alert("Saved", "Your checklist was updated.");
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  if (q.isLoading) {
    return (
      <ScreenChrome title="Arrival checklist">
        <Text style={styles.muted}>Loading…</Text>
      </ScreenChrome>
    );
  }
  if (q.error) {
    return (
      <ScreenChrome title="Arrival checklist">
        <Text style={styles.err}>{(q.error as Error).message}</Text>
      </ScreenChrome>
    );
  }

  const items = q.data?.items ?? [];
  const hostDeclaredAt = q.data?.hostDeclaredAt ?? null;

  async function submitTrustReport() {
    const msg = reportText.trim();
    if (msg.length < 8) {
      Alert.alert("Details needed", "Please describe the issue in at least 8 characters.");
      return;
    }
    setReporting(true);
    try {
      await mobileFetch(`/api/mobile/v1/bookings/${bookingId}/trust-dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      setReportText("");
      Alert.alert("Report sent", "Support will review. Host payout may be held until resolved.");
    } catch (e) {
      Alert.alert("Could not send", (e as Error).message);
    } finally {
      setReporting(false);
    }
  }

  return (
    <ScreenChrome title="Arrival checklist" subtitle="Confirm what you found on arrival">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {hostDeclaredAt ? (
          <Text style={styles.hostDeclared}>
            Host confirmed this checklist before your arrival ({new Date(hostDeclaredAt).toLocaleString()}).
          </Text>
        ) : (
          <Text style={styles.hostPending}>The host has not confirmed the checklist yet — you can still report issues.</Text>
        )}
        <Text style={styles.lead}>
          Toggle each item and add a short note if something is missing or not as described.
        </Text>
        {items.map((it) => (
          <View key={it.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.title}>{it.label ?? it.itemKey}</Text>
              <Switch
                value={it.confirmed === true}
                onValueChange={(v) => {
                  save.mutate([
                    {
                      itemKey: it.itemKey,
                      confirmed: v,
                      note: notes[it.itemKey] ?? it.note ?? undefined,
                    },
                  ]);
                }}
                trackColor={{ false: colors.border, true: colors.goldDim }}
                thumbColor={it.confirmed === true ? colors.gold : colors.textMuted}
              />
            </View>
            <Text style={styles.hint}>{it.confirmed === false ? "Reported issue" : "OK / present"}</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional note"
              placeholderTextColor={colors.textMuted}
              value={notes[it.itemKey] ?? it.note ?? ""}
              onChangeText={(t) => setNotes((prev) => ({ ...prev, [it.itemKey]: t }))}
            />
            <GoldButton
              label="Save note"
              onPress={() =>
                save.mutate([
                  {
                    itemKey: it.itemKey,
                    confirmed: it.confirmed ?? true,
                    note: notes[it.itemKey] ?? it.note,
                  },
                ])
              }
            />
          </View>
        ))}
        <GoldButton label="Back to booking" onPress={() => router.back()} />
      </ScrollView>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  hostDeclared: {
    color: colors.success,
    marginBottom: 12,
    lineHeight: 20,
    fontSize: 13,
    fontWeight: "600",
  },
  hostPending: { color: colors.textMuted, marginBottom: 12, lineHeight: 20, fontSize: 13 },
  lead: { color: colors.textMuted, marginBottom: 16, lineHeight: 22 },
  reportTitle: { color: colors.text, fontWeight: "800", marginTop: 20, marginBottom: 6 },
  reportHint: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.text, fontWeight: "700", flex: 1, paddingRight: 12 },
  hint: { color: colors.textMuted, fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  muted: { color: colors.textMuted },
  err: { color: colors.danger },
});
