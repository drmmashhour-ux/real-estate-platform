import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBrokerActions, completeBrokerAction, snoozeBrokerAction } from "../../modules/broker-mobile/broker-mobile.service";
import { DailyActionList } from "../../components/broker/DailyActionList";
import { colors } from "../../theme/colors";

export default function BrokerActionsScreen() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["brokerActions"],
    queryFn: fetchBrokerActions,
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

  const all = (q.data?.feed.all ?? []) as Parameters<typeof DailyActionList>[0]["actions"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 12 }}>Action center</Text>
        <DailyActionList
          actions={all}
          onComplete={async (id) => {
            await completeBrokerAction(id);
            await qc.invalidateQueries({ queryKey: ["brokerActions"] });
          }}
          onSnooze={async (id) => {
            await snoozeBrokerAction(id, new Date(Date.now() + 86400000).toISOString());
            await qc.invalidateQueries({ queryKey: ["brokerActions"] });
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
