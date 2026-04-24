import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ExpansionAiDashboardClient } from "./ExpansionAiDashboardClient";

export const metadata = {
  title: "AI expansion strategist | LECIPM / BNHub",
};

export default async function ExpansionAiDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/expansion/ai");

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
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">AI expansion strategist</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Ranks LECIPM cities using <strong className="text-amber-200/90">internal</strong> booking, lead, and
          listing telemetry plus launch-readiness proxies. Output is <strong className="text-amber-200/90">advisory</strong>
          — no automatic expansion or config changes.
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/dashboard/admin/command-center" className="text-amber-400/90 hover:underline">
            ← Command center
          </Link>
          <Link href="/dashboard/expansion" className="text-zinc-400 hover:text-zinc-200 hover:underline">
            Expansion control
          </Link>
          <Link href="/dashboard/ai-ceo" className="text-zinc-400 hover:text-zinc-200 hover:underline">
            AI CEO insights
          </Link>
          <Link href="/api/expansion/recommendations" className="text-zinc-500 hover:text-zinc-300 hover:underline">
            Raw JSON API
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-5xl p-6">
        <ExpansionAiDashboardClient />
      </div>
    </div>
  );
}
