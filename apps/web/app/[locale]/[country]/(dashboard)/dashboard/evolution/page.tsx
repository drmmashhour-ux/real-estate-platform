import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { EvolutionDashboardClient } from "@/components/evolution/EvolutionDashboardClient";

export const metadata = {
  title: "Evolution loop",
  description: "Outcome tracking, safe experiments, and bounded strategy learning for BNHub / LECIPM.",
};

export default async function EvolutionDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login?next=/dashboard/evolution");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (
    user?.role !== PlatformRole.ADMIN &&
    user?.role !== PlatformRole.BROKER &&
    user?.role !== PlatformRole.INVESTOR
  ) {
    redirect("/dashboard");
  }

  const isAdmin = user.role === PlatformRole.ADMIN;

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <EvolutionDashboardClient isAdmin={isAdmin} />
      </div>
    </main>
  );
}
