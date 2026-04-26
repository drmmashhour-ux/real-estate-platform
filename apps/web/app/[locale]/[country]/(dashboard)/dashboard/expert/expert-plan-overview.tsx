import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isMortgageExpertRole } from "@/lib/marketplace/mortgage-role";
import { mortgageExpertPlanDisplayName } from "@/modules/mortgage/services/broker-platform-plans";
import {
  mortgageBillingUtcMonthKey,
  mortgageExpertMonthlyCap,
  mortgageMonthlyUsedAfterRollover,
} from "@/modules/mortgage/services/billing-usage";

const GOLD = "var(--color-premium-gold)";

export async function ExpertPlanOverview() {
  const id = await getGuestId();
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (!isMortgageExpertRole(user?.role)) return null;

  const expert = await prisma.mortgageExpert.findUnique({
    where: { userId: id },
    select: {
      id: true,
      expertVerificationStatus: true,
      expertSubscription: { select: { plan: true, isActive: true, maxLeadsPerMonth: true } },
      expertBilling: { select: { leadsAssignedThisMonth: true, usageMonthUtc: true } },
    },
  });
  if (!expert) return null;

  const internal = expert.expertSubscription?.isActive
    ? expert.expertSubscription.plan.toLowerCase().trim()
    : "basic";
  const display = mortgageExpertPlanDisplayName(internal);
  const v = expert.expertVerificationStatus ?? "profile_incomplete";
  const monthKey = mortgageBillingUtcMonthKey();
  const { used } = mortgageMonthlyUsedAfterRollover(expert.expertBilling, monthKey);
  const cap = mortgageExpertMonthlyCap(expert);
  const capLabel = cap < 0 ? "Unlimited" : String(cap);

  return (
    <section
      className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
      aria-labelledby="expert-plan-overview-title"
    >
      <h2 id="expert-plan-overview-title" className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">
        Partner tier & leads
      </h2>
      <p className="mt-2 text-lg font-bold text-white">
        Current tier: <span style={{ color: GOLD }}>{display}</span>
        {expert.expertSubscription?.isActive ? null : (
          <span className="ml-2 text-sm font-normal text-amber-200/90">(activate subscription in Billing)</span>
        )}
      </p>
      <p className="mt-2 text-sm text-slate-400">
        Professional status:{" "}
        <strong className="text-white">
          {v === "verified"
            ? "Verified (AMF + ID on file)"
            : v === "pending_review"
              ? "Under review"
              : v === "rejected"
                ? "Needs resubmission"
                : "Complete verification"}
        </strong>
        {v !== "verified" ? (
          <>
            {" "}
            ·{" "}
            <Link href="/dashboard/expert/verification" className="font-medium text-sky-400 hover:underline">
              Open application
            </Link>
          </>
        ) : null}
      </p>
      <p className="mt-2 text-sm text-[#B3B3B3]">
        Leads this month:{" "}
        <span className="font-mono font-semibold text-white">
          {used} / {capLabel}
        </span>
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link
          href="/dashboard/expert/leads"
          className="rounded-lg border border-white/20 px-4 py-2 font-medium text-white hover:bg-white/5"
        >
          Open leads
        </Link>
        <Link
          href="/dashboard/expert/billing"
          className="rounded-lg px-4 py-2 font-semibold text-[#0B0B0B]"
          style={{ background: GOLD }}
        >
          Billing & upgrades
        </Link>
        <Link href="/mortgage/for-brokers" className="text-sm text-[#737373] hover:text-premium-gold hover:underline">
          Compare partner plans
        </Link>
      </div>
    </section>
  );
}
