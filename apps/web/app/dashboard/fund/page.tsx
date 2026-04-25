import { getGuestId } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { FundService } from "@/modules/fund/fund.service";
import { prisma } from "@/lib/db";
import { FundDashboardClient } from "./FundDashboardClient";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";

export const dynamic = "force-dynamic";

export default async function FundDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/dashboard/fund");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  const isAdmin = user?.role === "ADMIN";

  const funds = await FundService.listFunds(userId, isAdmin);

  return (
    <HubLayout title="Autonomous Fund" hubKey="investments" navigation={hubNavigation.investments}>
      <div className="space-y-8">
        <FundDashboardClient initialFunds={funds} isAdmin={isAdmin} />
      </div>
    </HubLayout>
  );
}
