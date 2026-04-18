import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { mobileFetch } from "../../services/apiClient";
import { NotificationInbox } from "../../components/broker/NotificationInbox";
import { colors } from "../../theme/colors";

type Inbox = { kind: string; notifications: { id: string; title: string; message: string | null }[] };

export default function BrokerNotificationsScreen() {
  const q = useQuery({
    queryKey: ["brokerPushInbox"],
    queryFn: () => mobileFetch<Inbox>("/api/mobile/push/inbox"),
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 12 }}>Broker inbox</Text>
        <NotificationInbox items={q.data?.notifications ?? []} />
      </View>
    </SafeAreaView>
  );
}
