import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { isMortgageExpertRole } from "@/lib/marketplace/mortgage-role";
import { MortgageHubAiSection } from "@/components/ai/MortgageHubAiSection";
import { DecisionCard } from "@/components/ai/DecisionCard";
import { safeEvaluateDecision } from "@/modules/ai/decision-engine";

export const dynamic = "force-dynamic";

/**
 * Mortgage specialist entry: users with an expert profile use the expert hub (leads, inbox, billing).
 * Others see how to unlock the mortgage workflow.
 */
export default async function MortgageBrokerDashboardPage() {
  const { userId } = await requireAuthenticatedUser();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, marketplacePersona: true, name: true },
  });

  if (isMortgageExpertRole(user?.role)) {
    const expert = await prisma.mortgageExpert.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (expert) redirect("/dashboard/expert");
  }

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeExperts = await prisma.mortgageExpert.count({
    where: { isActive: true, acceptedTerms: true, isAvailable: true },
  });
  const requests7d = await prisma.mortgageRequest.count({
    where: { createdAt: { gte: since7d } },
  });
  const deals30d = await prisma.mortgageDeal.count({
    where: { createdAt: { gte: since30d }, status: "closed" },
  });
  const unlockRevenue30d = await prisma.mortgageLeadUnlock.aggregate({
    where: { createdAt: { gte: since30d } },
    _sum: { amountCents: true },
  });

  const mortgageDecision = await safeEvaluateDecision({
    hub: "mortgage",
    userId,
    userRole: user?.role ?? "USER",
    entityType: "platform",
    entityId: null,
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h1 className="text-2xl font-semibold">Mortgage specialist hub</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Persona: <span className="text-slate-200">{user?.marketplacePersona ?? "UNSET"}</span>. Use this hub to
            move into mortgage expert onboarding, public lead generation, and marketplace financing visibility.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Active experts</p>
              <p className="mt-1 text-2xl font-semibold text-white">{activeExperts}</p>
              <p className="mt-1 text-xs text-slate-500">Verified and available in the marketplace now.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Requests 7d</p>
              <p className="mt-1 text-2xl font-semibold text-white">{requests7d}</p>
              <p className="mt-1 text-xs text-slate-500">Recent mortgage-intent requests coming into the system.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Closed deals 30d</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">{deals30d}</p>
              <p className="mt-1 text-xs text-slate-500">Closed mortgage deals recorded for the last 30 days.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Lead unlock revenue 30d</p>
              <p className="mt-1 text-2xl font-semibold text-amber-300">
                ${((unlockRevenue30d._sum.amountCents ?? 0) / 100).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">Mortgage marketplace unlock revenue in the last month.</p>
            </div>
          </div>

          <div className="mt-6">
            <DecisionCard
              title="Mortgage — approval readiness & documents"
              result={mortgageDecision}
              actionHref="/onboarding/mortgage"
              actionLabel="Complete onboarding"
            />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Link
              href="/mortgage"
              className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300 transition hover:border-premium-gold/40 hover:bg-black/30"
            >
              <p className="font-medium text-white">Public mortgage page</p>
              <p className="mt-2 text-slate-400">See the expert request page exactly as buyers and borrowers see it.</p>
            </Link>
            <Link
              href="/appraisal-calculator"
              className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300 transition hover:border-premium-gold/40 hover:bg-black/30"
            >
              <p className="font-medium text-white">Appraisal calculator</p>
              <p className="mt-2 text-slate-400">Use the public valuation funnel to attract seller leads into the platform.</p>
            </Link>
            <Link
              href="/admin/mortgage-analytics"
              className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300 transition hover:border-premium-gold/40 hover:bg-black/30"
            >
              <p className="font-medium text-white">Mortgage analytics</p>
              <p className="mt-2 text-slate-400">Review expert rankings, lead conversion, and mortgage revenue snapshots.</p>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">How to unlock the full mortgage workflow</h2>
            <div className="mt-4 grid gap-3">
              {[
                "Complete your mortgage onboarding and marketplace persona setup.",
                "Review and accept expert terms before using live expert tools.",
                "Activate your public specialist profile, lead queue access, and expert dashboard.",
              ].map((step, index) => (
                <div key={step} className="rounded-xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
                  Step {index + 1}: {step}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/onboarding/mortgage"
                className="rounded-full bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Complete onboarding
              </Link>
              <Link
                href="/expert/terms"
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:bg-white/5"
              >
                Review expert terms
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <MortgageHubAiSection />
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li>
                <Link href="/onboarding/mortgage" className="text-amber-400 hover:text-amber-300">
                  Re-run mortgage onboarding
                </Link>
              </li>
              <li>
                <Link href="/mortgage" className="text-amber-400 hover:text-amber-300">
                  Open public mortgage request page
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-500 hover:text-slate-300">
                  ← Main dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
