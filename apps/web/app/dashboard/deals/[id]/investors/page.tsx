import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { DealInvestorsDashboardClient } from "./deal-investors-dashboard-client";

export const dynamic = "force-dynamic";

export default async function DealInvestorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await params;
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  return <DealInvestorsDashboardClient dealId={dealId} />;
}
