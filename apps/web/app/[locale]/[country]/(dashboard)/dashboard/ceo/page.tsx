import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { PlatformRole } from "@prisma/client";
import { CeoSubnav } from "@/components/ceo-ai/CeoSubnav";
import { CeoDashboardHomeClient } from "@/components/ceo-ai/CeoDashboardHomeClient";

export const metadata = {
  title: "AI CEO",
  description: "Policy-bound executive automation for LECIPM — growth, pricing, outreach, retention.",
};

export default async function CeoDashboardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login?next=/dashboard/ceo");

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (me?.role !== PlatformRole.BROKER && me?.role !== PlatformRole.ADMIN) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#050508] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">LECIPM Executive</p>
        <h1 className="mt-2 text-3xl font-bold text-white">AI CEO</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Supervised marketplace strategy — proposals, approval gates, and audited execution. No autonomous bulk outreach
          or homepage changes without review.
        </p>
        <div className="mt-8">
          <CeoSubnav />
          <CeoDashboardHomeClient />
        </div>
      </div>
    </main>
  );
}
