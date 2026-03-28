import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isMortgageExpertRole } from "@/lib/marketplace/mortgage-role";
import { ExpertAlertBanner } from "./expert-alert-banner";
import { ExpertNotificationBell } from "./expert-notification-bell";
import { ensureDynamicAuthRequest } from "@/lib/auth/ensure-dynamic-request";

export { dynamic, revalidate } from "@/lib/auth/protected-route-segment";

const GOLD = "var(--color-premium-gold)";
const BG = "#0B0B0B";

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

  if (isAdmin) {
    subPlan = "premium";
  } else {
    if (!isMortgageExpertRole(user?.role)) {
      redirect("/dashboard/real-estate");
    }

    const expert = await prisma.mortgageExpert.findUnique({
      where: { userId: id },
      select: {
        acceptedTerms: true,
        expertSubscription: { select: { plan: true, isActive: true } },
      },
    });
    if (!expert?.acceptedTerms) {
      redirect("/expert/terms");
    }
    subPlan = expert.expertSubscription?.isActive
      ? expert.expertSubscription.plan.toLowerCase().trim()
      : "basic";
  }

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      <header className="border-b border-white/10 bg-black/60">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
              Mortgage expert
            </p>
            <nav className="mt-2 flex flex-wrap gap-3 text-sm">
              <Link href="/dashboard/expert" className="font-medium hover:underline" style={{ color: GOLD }}>
                Profile
              </Link>
              <Link
                href="/dashboard/expert/leads"
                className="text-[#B3B3B3] hover:text-white hover:underline"
              >
                Leads
              </Link>
              <Link
                href="/dashboard/expert/inbox"
                className="text-[#B3B3B3] hover:text-white hover:underline"
              >
                Immo inbox
              </Link>
              <Link
                href="/dashboard/expert/marketplace"
                className="text-[#B3B3B3] hover:text-white hover:underline"
              >
                Marketplace
              </Link>
              <Link
                href="/dashboard/expert/analytics"
                className="text-[#B3B3B3] hover:text-white hover:underline"
              >
                Analytics
              </Link>
              <Link
                href="/dashboard/expert/billing"
                className="text-[#B3B3B3] hover:text-white hover:underline"
              >
                Billing
              </Link>
              <Link href="/mortgage" className="text-[#737373] hover:text-[#B3B3B3]">
                Public page
              </Link>
              <Link href="/experts" className="text-[#737373] hover:text-[#B3B3B3]">
                Directory
              </Link>
            </nav>
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
      {subPlan !== "premium" ? (
        <div
          className="border-b border-premium-gold/30 bg-premium-gold/[0.07] px-4 py-2 text-center text-xs text-[#E5E5E5]"
          role="region"
          aria-label="Revenue optimization"
        >
          <strong style={{ color: GOLD }}>Upgrade to Premium</strong> to receive high-value leads first and unlock
          Premium-only marketplace pool.{" "}
          <Link href="/dashboard/expert/billing" className="font-semibold underline" style={{ color: GOLD }}>
            View plans
          </Link>
        </div>
      ) : null}
      <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
    </div>
  );
}
