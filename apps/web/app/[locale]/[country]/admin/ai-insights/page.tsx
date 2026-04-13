import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";

import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { generateDailyReport, generateWeeklyReport, generateMonthlyReport } from "@/modules/ai/admin-reports";

export const dynamic = "force-dynamic";

export default async function AdminAiInsightsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/ai-insights");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");
  const role = await getUserRole();
  const [daily, weekly, monthly] = await Promise.all([
    generateDailyReport(),
    generateWeeklyReport(),
    generateMonthlyReport(),
  ]);

  return (
    <HubLayout title="AI insights" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-white">AI-style operational reports</h1>
          <p className="mt-2 text-sm text-slate-400">
            Deterministic summaries from live database metrics (no external LLM call). For model-driven alerts use{" "}
            <Link href="/admin/ai" className="text-premium-gold hover:underline">
              AI Control Center
            </Link>
            .
          </p>
        </div>

        {[daily, weekly, monthly].map((r) => (
          <section
            key={r.period}
            className="rounded-2xl border border-premium-gold/25 bg-[#0a0a0a] p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">{r.period}</p>
            <h2 className="mt-2 text-lg font-semibold text-white">{r.headline}</h2>
            {r.kpis && r.kpis.length > 0 ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {r.kpis.map((k) => (
                  <div key={k.label} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                    <p className="text-[10px] uppercase text-slate-500">{k.label}</p>
                    <p className="text-sm font-semibold text-slate-200">{k.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
            {r.financeInsights && r.financeInsights.length > 0 ? (
              <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-amber-200/90">
                {r.financeInsights.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            ) : null}
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-400">
              {r.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            <p className="mt-4 text-[10px] text-slate-600">Generated {r.generatedAt}</p>
          </section>
        ))}
      </div>
    </HubLayout>
  );
}
