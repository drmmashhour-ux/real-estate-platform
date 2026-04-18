import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { fetchBrokerMobileHome, completeBrokerAction, snoozeBrokerAction } from "../../modules/broker-mobile/broker-mobile.service";
import { cacheBrokerActionsJson } from "../../modules/offline/cached-actions.service";
import { QuickStatsBar } from "./QuickStatsBar";
import { DailyActionList } from "./DailyActionList";

export function MobileBrokerHome() {
  const router = useRouter();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["brokerMobileHome"],
    queryFn: async () => {
      const h = await fetchBrokerMobileHome();
      try {
        cacheBrokerActionsJson(JSON.stringify(h.topActions));
      } catch {
        /* offline cache best-effort */
      }
      return h;
    },
  });

  if (q.isLoading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }
  if (q.isError) {
    return (
      <Text style={{ color: "#f87171", padding: 16 }}>
        {(q.error as Error).message || "Broker workspace unavailable (check flags + role)."}
      </Text>
    );
  }
  const data = q.data!;
  const actions = (data.topActions ?? []) as Parameters<typeof DailyActionList>[0]["actions"];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", color: "#fafafa" }}>Broker · Today</Text>
      <Text style={{ color: "#71717a", marginTop: 6, marginBottom: 8 }}>
        Residential pipeline — actions are server-ranked from real deal state.
      </Text>
      <QuickStatsBar activeDeals={data.stats.activeResidentialDeals} unread={data.stats.unreadBrokerMobileNotifications} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <Pressable
          style={{ padding: 10, backgroundColor: "#27272a", borderRadius: 8 }}
          onPress={() => router.push("/broker/actions")}
        >
          <Text style={{ color: "#fff" }}>All actions</Text>
        </Pressable>
        <Pressable
          style={{ padding: 10, backgroundColor: "#27272a", borderRadius: 8 }}
          onPress={() => router.push("/broker/crm")}
        >
          <Text style={{ color: "#fff" }}>CRM</Text>
        </Pressable>
        <Pressable
          style={{ padding: 10, backgroundColor: "#27272a", borderRadius: 8 }}
          onPress={() => router.push("/broker/notifications")}
        >
          <Text style={{ color: "#fff" }}>Inbox</Text>
        </Pressable>
        <Pressable
          style={{ padding: 10, backgroundColor: "#27272a", borderRadius: 8 }}
          onPress={() => router.push("/broker/approvals")}
        >
          <Text style={{ color: "#fff" }}>Approvals</Text>
        </Pressable>
      </View>
      <Text style={{ fontSize: 16, fontWeight: "600", color: "#e4e4e7", marginBottom: 8 }}>Top actions</Text>
      <DailyActionList
        actions={actions}
        onComplete={async (id) => {
          await completeBrokerAction(id);
          await qc.invalidateQueries({ queryKey: ["brokerMobileHome"] });
        }}
        onSnooze={async (id) => {
          const until = new Date(Date.now() + 86400000).toISOString();
          await snoozeBrokerAction(id, until);
          await qc.invalidateQueries({ queryKey: ["brokerMobileHome"] });
        }}
      />
    </ScrollView>
  );
}
