import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { ActionPipelineDashboardClient } from "./action-pipeline-dashboard-client";

export const dynamic = "force-dynamic";

export default async function DealActionPipelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await params;
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  return <ActionPipelineDashboardClient dealId={dealId} />;
}
