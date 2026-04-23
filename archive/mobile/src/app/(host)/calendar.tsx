import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { mobileFetch } from "../../services/apiClient";
import { colors } from "../../theme/colors";

type Cal = {
  reservations: Array<{ id: string; listingId: string; checkIn: string; checkOut: string; status: string; source: string }>;
  blockedDays: Array<{ listingId: string; date: string }>;
};

export default function HostCalendar() {
  const q = useQuery({
    queryKey: ["host-cal"],
    queryFn: () => mobileFetch<Cal>("/api/mobile/v1/host/calendar"),
  });
  return (
    <ScreenChrome title="Calendar" subtitle="Reservations + blocked days · sync-ready">
      <Text style={styles.m}>Reservations ({q.data?.reservations.length ?? 0})</Text>
      {q.data?.reservations.slice(0, 20).map((r) => (
        <View key={r.id} style={styles.row}>
          <Text style={styles.t}>{r.status}</Text>
          <Text style={styles.m}>
            {r.checkIn.slice(0, 10)} → {r.checkOut.slice(0, 10)} · {r.source}
          </Text>
        </View>
      ))}
      <Text style={[styles.m, { marginTop: 16 }]}>Blocked day slots: {q.data?.blockedDays.length ?? 0}</Text>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  t: { color: colors.text, fontWeight: "700" },
  m: { color: colors.textMuted },
});
