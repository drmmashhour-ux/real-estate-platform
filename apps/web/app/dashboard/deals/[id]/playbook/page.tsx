import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { PlaybookDashboardClient } from "./playbook-dashboard-client";

export const dynamic = "force-dynamic";

export default async function DealPlaybookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await params;
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  return <PlaybookDashboardClient dealId={dealId} />;
}
