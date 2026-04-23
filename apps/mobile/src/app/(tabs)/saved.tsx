import { AppScreen } from "@/components/AppScreen";
import { EmptyState } from "@/components/EmptyState";

export default function SavedTab() {
  return (
    <AppScreen>
      <EmptyState title="Saved items" subtitle="Saved properties, stays, and alerts will appear here." />
    </AppScreen>
  );
}
