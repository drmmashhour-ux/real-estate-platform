import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { PlatformRole } from "@prisma/client";
import { GamificationSubnav } from "@/components/gamification/GamificationSubnav";
import { GamificationRewardsClient } from "@/components/gamification/GamificationRewardsClient";

export const metadata = {
  title: "Gamification · Rewards",
};

export default async function GamificationRewardsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login?next=/dashboard/gamification/rewards");

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (me?.role !== PlatformRole.BROKER) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#07060a] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400/90">Broker motivation</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Rewards</h1>
        <p className="mt-1 text-sm text-slate-400">
          Monthly perks for top performers — redemption still respects compliance gates for featured exposure.
        </p>
        <div className="mt-8">
          <GamificationSubnav />
          <GamificationRewardsClient />
        </div>
      </div>
    </main>
  );
}
