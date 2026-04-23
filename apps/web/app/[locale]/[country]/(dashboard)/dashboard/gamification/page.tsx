import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { PlatformRole } from "@prisma/client";
import { GamificationSubnav } from "@/components/gamification/GamificationSubnav";
import { GamificationOverviewClient } from "@/components/gamification/GamificationOverviewClient";

export const metadata = {
  title: "Gamification",
};

export default async function GamificationPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login?next=/dashboard/gamification");

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
        <h1 className="mt-2 text-3xl font-bold text-white">Gamification</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Points reward speed, quality, and compliance — not noise. Leaderboards normalize for trust so top spots stay
          earned.
        </p>
        <div className="mt-8">
          <GamificationSubnav />
          <GamificationOverviewClient />
        </div>
      </div>
    </main>
  );
}
