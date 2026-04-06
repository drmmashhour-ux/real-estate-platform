import { useLocalSearchParams } from "expo-router";
import { ScreenChrome } from "../components/ui/ScreenChrome";
import { ManagerAIAssistantContent } from "../screens/AIAssistantScreen";

export default function AiAssistantRoute() {
  const { listingId, bookingId } = useLocalSearchParams<{
    listingId?: string;
    bookingId?: string;
  }>();
  return (
    <ScreenChrome title="LECIPM Manager AI" subtitle="AI-managed stays — use signed-in web session for full context">
      <ManagerAIAssistantContent
        listingId={typeof listingId === "string" ? listingId : undefined}
        bookingId={typeof bookingId === "string" ? bookingId : undefined}
      />
    </ScreenChrome>
  );
}
