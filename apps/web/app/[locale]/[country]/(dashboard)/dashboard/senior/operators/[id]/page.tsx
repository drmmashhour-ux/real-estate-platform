import Link from "next/link";
import { PlatformRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export default async function SeniorOperatorAiResidencePage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { locale, country, id: residenceId } = await params;
  const dash = `/${locale}/${country}/dashboard`;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const isAdmin = user?.role === PlatformRole.ADMIN;

  const residence = await prisma.seniorResidence.findUnique({
    where: { id: residenceId },
    select: { id: true, name: true, city: true, operatorId: true },
  });
  if (!residence) notFound();

  if (!isAdmin && residence.operatorId !== userId) {
    redirect(dash);
  }

  const perf =
    (await prisma.seniorOperatorPerformance.findUnique({
      where: { residenceId },
      include: { residence: { select: { name: true, city: true, verified: true } } },
    })) ?? null;

  const suggestions: string[] = [];
  if (perf?.responseTimeAvg != null && perf.responseTimeAvg > 12) {
    suggestions.push("Respond faster to rank higher when families compare options.");
  }
  if (perf?.profileCompleteness != null && perf.profileCompleteness < 0.72) {
    suggestions.push("Complete services and amenities on your profile to improve match rate.");
  }
  if (perf?.visitRate != null && perf.visitRate < 0.25) {
    suggestions.push("Families who visit often choose — invite visits promptly and follow up.");
  }
  if (suggestions.length === 0) {
    suggestions.push("Keep response times low and profiles complete — the AI favors reliable operators.");
  }

  return (
    <div className="space-y-8 p-4 text-sm text-slate-100">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-400">Residence AI</p>
        <h1 className="mt-1 text-2xl font-bold">{residence.name}</h1>
        <p className="mt-2 text-slate-400">{residence.city}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Operator score (AI blend)" value={fmt(perf?.operatorScore)} />
        <Metric label="Avg. response time (hrs)" value={fmt(perf?.responseTimeAvg)} />
        <Metric label="Lead acceptance rate" value={pct(perf?.leadAcceptanceRate)} />
        <Metric label="Visit rate" value={pct(perf?.visitRate)} />
        <Metric label="Conversion rate" value={pct(perf?.conversionRate)} />
        <Metric label="Profile completeness" value={pct(perf?.profileCompleteness)} />
        <Metric label="Trust score" value={pct(perf?.trustScore)} />
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
        <h2 className="text-lg font-semibold text-teal-200">Suggestions to improve ranking</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
          {suggestions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-4">
        <Link href={`/${locale}/${country}/dashboard/senior`} className="font-semibold text-teal-400 underline">
          ← Senior operator dashboard
        </Link>
        <Link href={`/${locale}/${country}/senior-living/${residence.id}`} className="font-semibold text-teal-400 underline">
          Public residence page
        </Link>
      </div>
    </div>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
      <p className="text-xs text-slate-500">{props.label}</p>
      <p className="mt-1 text-xl font-semibold text-teal-300">{props.value}</p>
    </div>
  );
}

function fmt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n > 10 ? String(Math.round(n)) : n.toFixed(2);
}

function pct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  const v = n <= 1 ? n * 100 : n;
  return `${Math.round(v)}%`;
}
