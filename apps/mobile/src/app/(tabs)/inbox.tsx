import { AppScreen } from "@/components/AppScreen";
import { EmptyState } from "@/components/EmptyState";

export default function InboxTab() {
  return (
    <AppScreen>
      <EmptyState
        title="Inbox"
        subtitle="Messages, support threads, and booking conversations will appear here."
      />
    </AppScreen>
  );
}
