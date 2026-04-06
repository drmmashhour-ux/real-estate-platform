import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";
import { GoldButton } from "../../../components/ui/GoldButton";
import { ScreenChrome } from "../../../components/ui/ScreenChrome";
import { mobileFetch } from "../../../services/apiClient";
import { colors } from "../../../theme/colors";

type ChecklistResp = {
  hostDeclaredAt?: string | null;
  items: { itemKey: string; label: string | null; confirmed: boolean | null }[];
};

export default function HostReservationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["host-checklist", id],
    queryFn: () => mobileFetch<ChecklistResp>(`/api/mobile/v1/host/bookings/${id}/checklist`),
    enabled: !!id,
  });

  const declareChecklist = useMutation({
    mutationFn: () =>
      mobileFetch<{ ok: boolean }>(`/api/mobile/v1/host/bookings/${id}/checklist`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["host-checklist", id] });
      Alert.alert("Saved", "Guests will see that you confirmed the arrival checklist.");
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  return (
    <ScreenChrome title="Reservation" subtitle={id}>
      <Text style={styles.muted}>Guest arrival checklist (read-only summary).</Text>
      {q.data?.hostDeclaredAt ? (
        <Text style={styles.declared}>Checklist declared {new Date(q.data.hostDeclaredAt).toLocaleString()}</Text>
      ) : (
        <GoldButton
          label={declareChecklist.isPending ? "Saving…" : "Confirm checklist is accurate"}
          onPress={() => declareChecklist.mutate()}
          disabled={declareChecklist.isPending || !id}
        />
      )}
      {q.isLoading ? <Text style={styles.muted}>Loading checklist…</Text> : null}
      {q.error ? <Text style={styles.err}>{(q.error as Error).message}</Text> : null}
      {q.data?.items.map((it) => (
        <View key={it.itemKey} style={styles.row}>
          <Text style={styles.t}>{it.label ?? it.itemKey}</Text>
          <Text style={styles.b}>
            {it.confirmed === true ? "OK" : it.confirmed === false ? "Issue" : "—"}
          </Text>
        </View>
      ))}
      <Link href={`/(host)/reservations/${id}/checkout-report`} style={{ marginTop: 20 }}>
        <Text style={{ color: colors.gold, fontWeight: "700" }}>Host checkout report</Text>
      </Link>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  declared: { color: colors.success, marginBottom: 12, fontWeight: "600", fontSize: 13 },
  muted: { color: colors.textMuted, marginBottom: 10 },
  err: { color: colors.danger, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  t: { color: colors.text },
  b: { color: colors.gold, fontWeight: "600" },
});
