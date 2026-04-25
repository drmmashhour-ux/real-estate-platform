import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { fetchLeadershipMetrics } from "@/modules/strategy/leadership-metrics.data";
import { evaluateLeadership } from "@/modules/strategy/market-leadership.engine";
import { LeadershipDashboardClient } from "./LeadershipDashboardClient";

export const metadata = {
  title: "Market leadership | LECIPM",
};

type PageProps = {
  searchParams: Promise<{ scope?: string }>;
};

export default async function LeadershipPage({ searchParams }: PageProps) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/leadership");

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (me?.role !== PlatformRole.ADMIN) {
    redirect("/dashboard/admin/command-center");
  }

  const { scope: raw } = await searchParams;
  const mode = raw === "quebec" ? "quebec" : "montreal";
  const metrics = await fetchLeadershipMetrics(prisma, mode);
  const evaluation = evaluateLeadership(metrics);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-3 text-xs text-zinc-500">Admin view · metrics are measured, not market-share rank</div>
      <LeadershipDashboardClient metrics={metrics} evaluation={evaluation} scope={mode} />
    </div>
  );
}
