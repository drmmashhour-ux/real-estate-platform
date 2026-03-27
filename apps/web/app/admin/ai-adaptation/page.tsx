import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { getCrmSuggestionQuality } from "@/modules/ai-training/application/crmSuggestionQualityService";
import { getSeoPerformanceFeedback } from "@/modules/ai-training/application/seoPerformanceFeedbackService";
import { getSeoTemplateOptimizationSuggestions } from "@/modules/ai-training/application/seoTemplateOptimizationService";

export const dynamic = "force-dynamic";

export default async function AiAdaptationPage() {
  const uid = await getGuestId();
  const admin = await requireAdminUser(uid);
  if (!admin) redirect("/admin");

  const [copilotFeedback, crmQuality, seoFeedback, seoOpt, evalRuns] = await Promise.all([
    prisma.aiFeedbackEvent.findMany({
      where: { subsystem: "copilot" },
      orderBy: { createdAt: "desc" },
      take: 120,
      select: { accepted: true, rating: true, createdAt: true },
    }),
    getCrmSuggestionQuality(prisma, 30),
    getSeoPerformanceFeedback(prisma, 30),
    getSeoTemplateOptimizationSuggestions(prisma, 60),
    prisma.aiEvalRun.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: { id: true, subsystem: true, name: true, status: true, metrics: true, createdAt: true, completedAt: true } }),
  ]);

  const copilotAccepted = copilotFeedback.filter((f) => f.accepted === true).length;
  const copilotAcceptanceRate = copilotFeedback.length ? copilotAccepted / copilotFeedback.length : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A646]">AI Adaptation</p>
      <h1 className="mt-2 text-3xl font-semibold">RAG, feedback, and eval quality dashboard</h1>
      <Link href="/admin" className="mt-3 inline-block text-sm text-emerald-400 hover:text-emerald-300">
        ← Back to admin
      </Link>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Copilot feedback" value={String(copilotFeedback.length)} />
        <Kpi label="Copilot acceptance" value={`${(copilotAcceptanceRate * 100).toFixed(1)}%`} />
        <Kpi label="CRM accepted rate" value={`${(crmQuality.acceptedRate * 100).toFixed(1)}%`} />
        <Kpi label="SEO accepted rate" value={`${(seoFeedback.acceptedRate * 100).toFixed(1)}%`} />
      </section>

      <section className="mt-8 rounded-xl border border-white/10 bg-black/30 p-5">
        <h2 className="text-lg font-medium">SEO optimization suggestions</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
          {seoOpt.suggestions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-xl border border-white/10 bg-black/30 p-5">
        <h2 className="text-lg font-medium">Recent eval runs</h2>
        {evalRuns.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No eval runs yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2 pr-4">Subsystem</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {evalRuns.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="py-2 pr-4">{r.subsystem}</td>
                    <td className="py-2 pr-4">{r.name}</td>
                    <td className="py-2 pr-4">{r.status}</td>
                    <td className="py-2 pr-4 text-slate-400">{r.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
  );
}
