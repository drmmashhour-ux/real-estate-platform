import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { InvestorPacketDashboardClient } from "./investor-packet-dashboard-client";

export const dynamic = "force-dynamic";

export default async function InvestorPacketPage({
  params,
}: {
  params: Promise<{ id: string; investorId: string }>;
}) {
  const { id: dealId, investorId } = await params;
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  return <InvestorPacketDashboardClient dealId={dealId} investorId={investorId} />;
}
