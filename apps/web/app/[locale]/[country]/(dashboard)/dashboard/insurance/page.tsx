import { redirect } from "next/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { InsuranceDashboardClient } from "./insurance-dashboard-client";

export const dynamic = "force-dynamic";

export default async function InsuranceBrokerDashboardPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN" && user?.role !== "INSURANCE_BROKER") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <InsuranceDashboardClient />
    </main>
  );
}
