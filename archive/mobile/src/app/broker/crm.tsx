import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { mobileFetch } from "../../services/apiClient";
import { MobileCRMCard } from "../../components/broker/MobileCRMCard";
import { colors } from "../../theme/colors";

type Crm = {
  kind: "mobile_broker_crm_v1";
  followUpsDue: { id: string; displayName: string; listing?: { title: string } | null }[];
  hotLeads: { id: string; displayName: string }[];
  kpis: Record<string, number>;
};

export default function BrokerCrmScreen() {
  const q = useQuery({
    queryKey: ["brokerCrm"],
    queryFn: () => mobileFetch<Crm>("/api/mobile/broker/crm"),
  });

  if (q.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }
  if (q.isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
        <Text style={{ color: "#f87171" }}>{(q.error as Error).message}</Text>
      </SafeAreaView>
    );
  }

  const d = q.data!;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>CRM</Text>
        <Text style={{ color: "#71717a", marginVertical: 8 }}>Follow-ups due & hot leads (real CRM rows).</Text>
        <Text style={{ color: "#a1a1aa", marginBottom: 12 }}>{JSON.stringify(d.kpis)}</Text>
        {d.followUpsDue.map((r) => (
          <MobileCRMCard key={r.id} name={r.displayName} subtitle={r.listing?.title ?? "Follow-up"} />
        ))}
        {d.hotLeads.map((r) => (
          <MobileCRMCard key={`h-${r.id}`} name={r.displayName} subtitle="High priority" />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
