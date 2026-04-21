import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PlatformRole } from "@prisma/client";
import { DealLifecycleKanbanClient } from "@/components/deals/DealLifecycleKanbanClient";

export const metadata = {
  title: "Deal lifecycle pipeline",
  description: "LECIPM deal stages from lead to close.",
};

export default async function BrokerDealLifecyclePage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login?next=/dashboard/broker/deal-lifecycle");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== PlatformRole.BROKER && user?.role !== PlatformRole.ADMIN) {
    redirect("/dashboard");
  }

  return <DealLifecycleKanbanClient />;
}
