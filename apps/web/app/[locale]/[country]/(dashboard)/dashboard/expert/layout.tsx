import type { ReactNode } from "react";
import Link from "next/link";
import { LecipmBrandLockup } from "@/components/brand/LecipmBrandLockup";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { isMortgageExpertRole } from "@/lib/marketplace/mortgage-role";
import { mortgagePlanTierRank } from "@/modules/mortgage/services/subscription-plans";
import { ExpertAlertBanner } from "./expert-alert-banner";
import { ExpertNotificationBell } from "./expert-notification-bell";
import { ensureDynamicAuthRequest } from "@/lib/auth/ensure-dynamic-request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const GOLD = "var(--color-premium-gold)";

export default async function ExpertDashboardLayout({ children }: { children: ReactNode }) {
  await ensureDynamicAuthRequest();
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/dashboard/expert");
  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  const isAdmin = user?.role === "ADMIN";
  let subPlan: string;
  let verificationStatus = "verified";

  if (isAdmin) {
    subPlan = "ambassador";
  } else {
    if (!isMortgageExpertRole(user?.role)) {
      redirect("/dashboard/real-estate");
    }

    const expert = await prisma.mortgageExpert.findUnique({
      where: { userId: id },
      select: {
        acceptedTerms: true,
        expertVerificationStatus: true,
        expertSubscription: { select: { plan: true, isActive: true } },
      },
    });
    if (!expert?.acceptedTerms) {
      redirect("/expert/terms");
    }
    verificationStatus = expert.expertVerificationStatus ?? "profile_incomplete";
    subPlan = expert.expertSubscription?.isActive
      ? expert.expertSubscription.plan.toLowerCase().trim()
      : "basic";
  }

  const navMuted = "text-slate-400 hover:text-sky-100 hover:underline";
  const needsVerification = verificationStatus !== "verified";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(14,116,184,0.18),transparent)] text-white">
      <header className="border-b border-premium-gold/20 bg-[#111111]/95 backdrop-blur-md">
        <div className="h-1 w-full bg-premium-gold/90" aria-hidden />
        <div className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
            <LecipmBrandLockup
              href="/"
              variant="dark"
              density="compact"
              logoClassName="[&_img]:max-h-8 sm:[&_img]:max-h-9"
            />
            <div className="min-w-0 border-l-0 sm:border-l sm:border-white/10 sm:pl-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-premium-gold/90">Financing desk</p>
            <p className="text-[9px] text-slate-500">Licensed mortgage partners · AMF-aligned onboarding</p>
            <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link href="/dashboard/expert" className="font-semibold text-premium-gold hover:underline">
                Desk
              </Link>
              <Link
                href="/dashboard/expert/verification"
                className={needsVerification ? "font-semibold text-amber-200 hover:underline" : navMuted}
              >
                Verification{needsVerification ? " · required" : ""}
              </Link>
              <Link href="/dashboard/expert/ai-tools" className={`${navMuted} text-sky-300/90`}>
                AI tools
              </Link>
              <Link href="/dashboard/expert/leads" className={navMuted}>
                Leads
              </Link>
              <Link href="/dashboard/expert/inbox" className={navMuted}>
                Immo inbox
              </Link>
              <Link href="/dashboard/expert/marketplace" className={navMuted}>
                Marketplace
              </Link>
              <Link href="/dashboard/expert/analytics" className={navMuted}>
                Analytics
              </Link>
              <Link href="/dashboard/expert/billing" className={navMuted}>
                Billing
              </Link>
              <Link href="/mortgage" className="text-slate-600 hover:text-slate-400">
                Public
              </Link>
              <Link href="/experts" className="text-slate-600 hover:text-slate-400">
                Directory
              </Link>
            </nav>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ExpertNotificationBell />
            <Link href="/" className="text-xs text-[#737373] hover:text-white">
              ← Home
            </Link>
          </div>
        </div>
      </header>
      <ExpertAlertBanner />
      {mortgagePlanTierRank(subPlan) < mortgagePlanTierRank("ambassador") ? (
        <div
          className="border-b border-premium-gold/30 bg-premium-gold/[0.07] px-4 py-2 text-center text-xs text-[#E5E5E5]"
          role="region"
          aria-label="Partner tier upgrade"
        >
          <strong style={{ color: GOLD }}>Upgrade your partner tier</strong> for higher lead caps and priority on
          high-intent assignments.{" "}
          <Link href="/dashboard/expert/billing" className="font-semibold underline" style={{ color: GOLD }}>
            View Gold · Platinum · Ambassador
          </Link>
          {" · "}
          <Link href="/mortgage/for-brokers" className="font-semibold underline" style={{ color: GOLD }}>
            Compare plans
          </Link>
        </div>
      ) : null}
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
