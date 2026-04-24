import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { DealCapitalDashboardClient } from "./deal-capital-dashboard-client";

export const dynamic = "force-dynamic";

export default async function DealCapitalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await params;
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  return <DealCapitalDashboardClient dealId={dealId} />;
}
