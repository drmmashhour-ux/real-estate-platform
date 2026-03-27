import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { AICommandCenter } from "@/src/modules/ai-operator/ui/AICommandCenter";

export const dynamic = "force-dynamic";

export default async function AiOperatorDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/ai-operator");

  return (
    <HubLayout title="AI Operator" hubKey="broker" navigation={hubNavigation.broker} showAdminInSwitcher={false}>
      <AICommandCenter />
    </HubLayout>
  );
}
