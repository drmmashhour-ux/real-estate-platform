import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { mobileFetch } from "../../services/apiClient";
import { colors } from "../../theme/colors";

type Q = { queues: Record<string, number>; note: string };

export default function AdminDashboard() {
  const q = useQuery({
    queryKey: ["admin-queues"],
    queryFn: () => mobileFetch<Q>("/api/mobile/v1/admin/queues"),
  });
  const queues = q.data?.queues;
  return (
    <ScreenChrome title="Operations" subtitle="Counts only — evidence on web admin">
      {queues ? (
        <View style={styles.box}>
          {Object.entries(queues).map(([k, v]) => (
            <Text key={k} style={styles.row}>
              {k}: <Text style={styles.num}>{v}</Text>
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.m}>Loading…</Text>
      )}
      <Text style={styles.note}>{q.data?.note}</Text>
      <Link href="/(admin)/approvals" style={styles.link}>
        <Text style={styles.linkT}>Approvals</Text>
      </Link>
      <Link href="/(admin)/operations-map" style={styles.link}>
        <Text style={styles.linkT}>Operations map</Text>
      </Link>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.surface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  row: { color: colors.textMuted, marginVertical: 4 },
  num: { color: colors.gold, fontWeight: "800" },
  m: { color: colors.textMuted },
  note: { color: colors.textMuted, fontSize: 12, marginTop: 12 },
  link: { marginTop: 12 },
  linkT: { color: colors.gold, fontWeight: "700" },
});
