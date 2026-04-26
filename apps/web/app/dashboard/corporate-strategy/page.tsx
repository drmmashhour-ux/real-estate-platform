import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { CorporateStrategyDashboard } from "@/components/corporate-strategy/CorporateStrategyDashboard";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const metadata: Metadata = {
  title: "Corporate strategy (advisory)",
  description: "Hiring, budget, product, bottlenecks — internal decision support only, not auto-execution.",
};

export const dynamic = "force-dynamic";

const ALLOW = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

export default async function CorporateStrategyPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || !ALLOW.has(user.role)) {
    redirect("/dashboard");
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Corporate strategy (AI layer)</h1>
        <p className="mt-1 text-sm text-slate-600">
          Uses the same data traces as capital &amp; investor intelligence. Nothing here approves headcount, writes budgets, or
          changes systems automatically.
        </p>
        <p className="mt-1 text-xs text-amber-800">Enable with FEATURE_CORPORATE_STRATEGY_V1. Broker and admin only.</p>
      </header>
      <CorporateStrategyDashboard />
    </div>
  );
}
