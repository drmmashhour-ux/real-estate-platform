import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { mobileFetch } from "../../../services/apiClient";
import { MobileDealHealthCard } from "../../../components/broker/MobileDealHealthCard";
import { colors } from "../../../theme/colors";

type DealResp = {
  kind: "mobile_broker_deal_summary_v1";
  deal: { dealCode: string | null; status: string; priceCents: number };
  closingConditions: { id: string; type: string; status: string }[];
  signatureSessions: { id: string; status: string }[];
  dealRequests: { id: string; title: string; status: string }[];
  financing: { status: string; institutionName: string | null } | null;
};

export default function BrokerDealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useQuery({
    queryKey: ["brokerDeal", id],
    queryFn: () => mobileFetch<DealResp>(`/api/mobile/broker/deals/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
  });

  if (!id) {
    return null;
  }
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
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>{d.deal.dealCode ?? "Deal"}</Text>
        <MobileDealHealthCard label="Status" value={d.deal.status} />
        <MobileDealHealthCard label="Price (cents)" value={String(d.deal.priceCents)} />
        {d.financing ? <MobileDealHealthCard label="Financing" value={d.financing.status} /> : null}
        <Text style={{ color: "#fff", marginTop: 16, fontWeight: "600" }}>Conditions</Text>
        {d.closingConditions.map((c) => (
          <MobileDealHealthCard key={c.id} label={c.type} value={c.status} />
        ))}
        <Text style={{ color: "#fff", marginTop: 16, fontWeight: "600" }}>Signatures</Text>
        {d.signatureSessions.map((s) => (
          <MobileDealHealthCard key={s.id} label="Session" value={s.status} />
        ))}
        <Text style={{ color: "#fff", marginTop: 16, fontWeight: "600" }}>Requests</Text>
        {d.dealRequests.map((r) => (
          <MobileDealHealthCard key={r.id} label={r.title} value={r.status} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
