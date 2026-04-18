import { View, Text, FlatList } from "react-native";
import { DailyActionCard } from "./DailyActionCard";

type Row = {
  id: string;
  title: string;
  summary: string;
  urgency: string;
  approvalRequired?: boolean;
};

export function DailyActionList(props: {
  actions: Row[];
  onComplete?: (id: string) => void;
  onSnooze?: (id: string) => void;
}) {
  if (props.actions.length === 0) {
    return (
      <Text style={{ color: "#71717a", paddingVertical: 12 }}>No actions in this bucket.</Text>
    );
  }
  return (
    <FlatList
      data={props.actions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <DailyActionCard
          action={item}
          onComplete={props.onComplete ? () => props.onComplete!(item.id) : undefined}
          onSnooze={props.onSnooze ? () => props.onSnooze!(item.id) : undefined}
        />
      )}
      scrollEnabled={false}
    />
  );
}
