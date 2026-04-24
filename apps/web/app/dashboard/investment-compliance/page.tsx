import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { InvestmentComplianceDashboardClient } from "./investment-compliance-dashboard-client";

export const dynamic = "force-dynamic";

export default async function InvestmentCompliancePage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  return <InvestmentComplianceDashboardClient />;
}
