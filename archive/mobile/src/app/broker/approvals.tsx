import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mobileFetch } from "../../services/apiClient";
import { BrokerApprovalCard } from "../../components/broker/BrokerApprovalCard";
import { colors } from "../../theme/colors";

type Approvals = {
  kind: "mobile_broker_approvals_v1";
  communicationDrafts: { id: string; actionId: string; channel: string; subject: string | null }[];
  negotiationSuggestions: { id: string; actionId: string; title: string }[];
};

export default function BrokerApprovalsScreen() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["brokerApprovals"],
    queryFn: () => mobileFetch<Approvals>("/api/mobile/broker/approvals"),
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
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>Approvals</Text>
        <Text style={{ color: "#71717a", marginVertical: 8 }}>Drafts & negotiation items — sending still happens in workflow.</Text>
        {d.communicationDrafts.map((x) => (
          <View key={x.id}>
            <BrokerApprovalCard title={`Draft (${x.channel})`} subtitle={x.subject ?? "(no subject)"} />
            <Pressable
              style={{ marginBottom: 12, padding: 10, backgroundColor: "#27272a", borderRadius: 8, alignSelf: "flex-start" }}
              onPress={async () => {
                const actionId = `dac:draft:${x.id}`;
                await mobileFetch(`/api/mobile/broker/approvals/${encodeURIComponent(actionId)}/approve`, {
                  method: "POST",
                });
                await qc.invalidateQueries({ queryKey: ["brokerApprovals"] });
              }}
            >
              <Text style={{ color: "#fff" }}>Approve draft</Text>
            </Pressable>
          </View>
        ))}
        {d.negotiationSuggestions.map((x) => (
          <View key={x.id}>
            <BrokerApprovalCard title={x.title} subtitle="Negotiation suggestion" />
            <Pressable
              style={{ marginBottom: 12, padding: 10, backgroundColor: "#27272a", borderRadius: 8, alignSelf: "flex-start" }}
              onPress={async () => {
                await mobileFetch(`/api/mobile/broker/approvals/${encodeURIComponent(x.actionId)}/approve`, {
                  method: "POST",
                });
                await qc.invalidateQueries({ queryKey: ["brokerApprovals"] });
              }}
            >
              <Text style={{ color: "#fff" }}>Approve for desktop</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
