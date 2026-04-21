import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PlatformRole } from "@prisma/client";
import { AutonomyDashboard } from "@/components/autonomy/AutonomyDashboard";

export const metadata = {
  title: "Autonomy operations",
  description: "Governed autonomous brokerage queue, approvals, and policies.",
};

export default async function AutonomyOpsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login?next=/dashboard/autonomy");

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (me?.role !== PlatformRole.BROKER && me?.role !== PlatformRole.ADMIN) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Brokerage OS</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Autonomous operations</h1>
        <div className="mt-8">
          <AutonomyDashboard isAdmin={me.role === PlatformRole.ADMIN} />
        </div>
      </div>
    </main>
  );
}
