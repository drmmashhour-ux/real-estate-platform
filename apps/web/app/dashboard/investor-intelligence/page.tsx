import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { InvestorDashboard } from "@/components/investor/InvestorDashboard";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { prisma } from "@repo/db";

export const metadata: Metadata = {
  title: "Investor intelligence (internal)",
  description: "Assumption-based operational metrics for board and strategy — not audited financials.",
};

export const dynamic = "force-dynamic";

const ALLOW = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

export default async function InvestorIntelligencePage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || !ALLOW.has(user.role)) {
    redirect("/dashboard");
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Investor intelligence</h1>
        <p className="mt-1 text-sm text-slate-600">
          Capital allocation, ROI, and expansion views are assumption-based. Do not use as a valuation, guarantee, or public offering narrative.
        </p>
        <p className="mt-1 text-xs text-amber-800">Enable with FEATURE_INVESTOR_INTELLIGENCE_V1. Retail investor account types do not have access here.</p>
      </header>
      <InvestorDashboard />
    </div>
  );
}
