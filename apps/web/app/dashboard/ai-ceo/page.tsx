import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AiCeoInsightsDashboardClient } from "./AiCeoInsightsDashboardClient";

export const metadata = {
  title: "AI CEO — Strategic insights | LECIPM / BNHub",
};

export default async function AiCeoStrategicDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/ai-ceo");

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (me?.role !== PlatformRole.ADMIN) {
    redirect("/dashboard/admin/command-center");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-5">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">AI CEO — Strategic decision support</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Internal metrics only. Recommendations are <strong className="text-amber-200/90">advisory</strong>; critical
          actions are not executed from this layer. Every insight includes traceable signals.
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/dashboard/admin/command-center" className="text-amber-400/90 hover:underline">
            ← Command center
          </Link>
          <Link href="/dashboard/ceo" className="text-zinc-400 hover:text-zinc-200 hover:underline">
            CEO hub
          </Link>
          <Link href="/api/ai-ceo/insights" className="text-zinc-500 hover:text-zinc-300 hover:underline">
            Raw JSON API
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-5xl p-6">
        <AiCeoInsightsDashboardClient />
      </div>
    </div>
  );
}
