import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { API_BASE_URL } from "../config";
import { buildAuthHeaders } from "../lib/authHeaders";
import { colors } from "../theme/colors";

type AutonomyPayload = {
  normalizedMode?: string;
  globalKillSwitch?: boolean;
  autonomyPausedUntil?: string | null;
  metrics24h?: { runs?: number; actionsExecuted?: number; actionsFailed?: number };
  error?: string;
};

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${path}`;
  const headers = await buildAuthHeaders({ Accept: "application/json" });
  const res = await fetch(url, { headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : `HTTP ${res.status}`);
  }
  return data as T;
}

export function AIControlScreenContent() {
  const [data, setData] = useState<AutonomyPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const j = await fetchJson<AutonomyPayload>("/api/ai/autonomy/status");
      setData(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <ActivityIndicator color={colors.gold} style={{ marginVertical: 24 }} />;
  }
  if (err) {
    return <Text style={styles.err}>{err}</Text>;
  }
  if (!data) {
    return <Text style={styles.muted}>No data.</Text>;
  }

  return (
    <View style={styles.box}>
      <Text style={styles.label}>Autonomy mode</Text>
      <Text style={styles.value}>{data.normalizedMode ?? "—"}</Text>
      <Text style={styles.label}>Kill switch</Text>
      <Text style={styles.value}>{data.globalKillSwitch ? "ON" : "off"}</Text>
      {data.autonomyPausedUntil ? (
        <>
          <Text style={styles.label}>Paused until</Text>
          <Text style={styles.value}>{data.autonomyPausedUntil}</Text>
        </>
      ) : null}
      {data.metrics24h ? (
        <>
          <Text style={[styles.label, { marginTop: 16 }]}>24h (admin session only)</Text>
          <Text style={styles.muted}>
            Runs: {data.metrics24h.runs ?? "—"} · Executed: {data.metrics24h.actionsExecuted ?? "—"} · Failed:{" "}
            {data.metrics24h.actionsFailed ?? "—"}
          </Text>
        </>
      ) : (
        <Text style={[styles.muted, { marginTop: 12 }]}>
          Sign in with a platform admin web session to see full metrics on this endpoint.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 6 },
  label: { fontSize: 12, color: colors.muted, textTransform: "uppercase", letterSpacing: 1 },
  value: { fontSize: 18, color: colors.text, fontWeight: "600", marginBottom: 8 },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 20 },
  err: { color: "#f87171", fontSize: 14 },
});
