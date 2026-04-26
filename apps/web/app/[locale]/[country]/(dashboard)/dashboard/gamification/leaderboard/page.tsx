import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { PlatformRole } from "@prisma/client";
import { GamificationSubnav } from "@/components/gamification/GamificationSubnav";
import { GamificationLeaderboardClient } from "@/components/gamification/GamificationLeaderboardClient";

export const metadata = {
  title: "Gamification · Leaderboard",
};

export default async function GamificationLeaderboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login?next=/dashboard/gamification/leaderboard");

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
        <h1 className="mt-2 text-3xl font-bold text-white">Leaderboards</h1>
        <p className="mt-1 text-sm text-slate-400">
          Quality-normalized scores — filters for window and city. Agency boards use verified brokerage company match.
        </p>
        <div className="mt-8">
          <GamificationSubnav />
          <GamificationLeaderboardClient />
        </div>
      </div>
    </main>
  );
}
