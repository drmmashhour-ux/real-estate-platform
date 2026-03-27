import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
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

  const mortgageDecision = await safeEvaluateDecision({
    hub: "mortgage",
    userId,
    userRole: user?.role ?? "USER",
    entityType: "platform",
    entityId: null,
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-xl font-semibold">Mortgage specialist hub</h1>
        <p className="mt-2 text-sm text-slate-400">
          Persona: <span className="text-slate-200">{user?.marketplacePersona ?? "UNSET"}</span>. Expert tools
          (profile, leads, inbox, deal tracking) unlock after your mortgage expert profile is active.
        </p>
        <div className="mt-6">
          <DecisionCard
            title="Mortgage — approval readiness & documents"
            result={mortgageDecision}
            actionHref="/onboarding/mortgage"
            actionLabel="Complete onboarding"
          />
        </div>
        <MortgageHubAiSection />

        <ul className="mt-6 space-y-3 text-sm text-slate-300">
          <li>
            <Link href="/expert/terms" className="text-amber-400 hover:text-amber-300">
              Review expert terms
            </Link>{" "}
            — required before the expert dashboard.
          </li>
          <li>
            <Link href="/onboarding/mortgage" className="text-amber-400 hover:text-amber-300">
              Re-run mortgage onboarding
            </Link>
          </li>
          <li>
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-300">
              ← Main dashboard
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
