import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { isTrustGraphAdminQueueEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { TrustGraphCaseActions } from "@/components/trust/TrustGraphCaseActions";
import { ReadinessBadge } from "@/lib/trustgraph/ui/components/ReadinessBadge";
import { TrustBadge } from "@/lib/trustgraph/ui/components/TrustBadge";

export const dynamic = "force-dynamic";

export default async function AdminTrustGraphCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");

  if (!isTrustGraphEnabled()) {
    return (
      <div className="p-8 text-slate-400">
        TrustGraph disabled. Set TRUSTGRAPH_ENABLED=true.{" "}
        <Link href="/admin/trustgraph" className="text-[#C9A646] hover:underline">
          Back
        </Link>
      </div>
    );
  }

  if (!isTrustGraphAdminQueueEnabled()) {
    return (
      <div className="p-8 text-slate-400">
        Admin queue disabled. Set TRUSTGRAPH_ENABLED=true and do not set TRUSTGRAPH_ADMIN_QUEUE_ENABLED=false.{" "}
        <Link href="/admin/dashboard" className="text-[#C9A646] hover:underline">
          Admin dashboard
        </Link>
      </div>
    );
  }

  const { id } = await params;
  const c = await prisma.verificationCase.findUnique({
    where: { id },
    include: {
      signals: { orderBy: { createdAt: "desc" } },
      ruleResults: { orderBy: { createdAt: "desc" } },
      nextBestActions: { orderBy: { createdAt: "desc" } },
      reviewActions: {
        orderBy: { createdAt: "desc" },
        include: { reviewer: { select: { email: true } } },
      },
    },
  });
  if (!c) notFound();

  const role = await getUserRole();
  const summary = c.summary as Record<string, unknown> | null;

  return (
    <HubLayout
      title="TrustGraph case"
      hubKey="admin"
      navigation={hubNavigation.admin}
      showAdminInSwitcher={role === "admin"}
    >
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">Verification case</h1>
            <p className="mt-1 font-mono text-xs text-slate-500">{c.id}</p>
          </div>
          <Link href="/admin/trustgraph" className="text-sm text-[#C9A646] hover:underline">
            ← Queue
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs uppercase text-slate-500">Score</p>
            <p className="mt-1 text-3xl font-bold text-white">{c.overallScore}</p>
            <p className="mt-2 flex flex-wrap gap-2">
              <TrustBadge level={c.trustLevel} />
              <ReadinessBadge level={c.readinessLevel} />
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs uppercase text-slate-500">Entity</p>
            <p className="mt-1 text-sm text-white">
              {c.entityType} · {c.entityId}
            </p>
            <p className="text-xs text-slate-500">Status: {c.status}</p>
          </div>
        </div>

        {c.explanation ? (
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-500">Explanation</p>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{c.explanation}</p>
          </div>
        ) : null}

        {summary?.riskSummary ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-sm text-amber-100/90">
            <p className="text-xs font-semibold uppercase text-amber-200/80">Risk summary</p>
            <p className="mt-2">{String(summary.riskSummary)}</p>
          </div>
        ) : null}

        {Array.isArray(summary?.missingItems) && (summary!.missingItems as unknown[]).length > 0 ? (
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-500">Missing items</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-slate-300">
              {(summary!.missingItems as string[]).slice(0, 20).map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <TrustGraphCaseActions caseId={c.id} />

        <section>
          <h2 className="text-sm font-semibold text-white">Signals</h2>
          <ul className="mt-2 space-y-2">
            {c.signals.length === 0 ? (
              <li className="text-sm text-slate-500">No signals.</li>
            ) : (
              c.signals.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-200"
                >
                  <span className="text-xs text-slate-500">{s.severity}</span> · {s.signalName}
                  {s.message ? <p className="mt-1 text-xs text-slate-400">{s.message}</p> : null}
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-white">Rule results</h2>
          <ul className="mt-2 space-y-2">
            {c.ruleResults.map((r) => (
              <li key={r.id} className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 text-xs text-slate-300">
                {r.ruleCode} v{r.ruleVersion} — {r.passed ? "passed" : "failed"} (Δ{r.scoreDelta})
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-white">Next best actions</h2>
          <ul className="mt-2 space-y-2">
            {c.nextBestActions.length === 0 ? (
              <li className="text-sm text-slate-500">None.</li>
            ) : (
              c.nextBestActions.map((a) => (
                <li key={a.id} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200">
                  <span className="text-xs text-slate-500">{a.priority}</span> · {a.title}
                  <p className="text-xs text-slate-400">{a.description}</p>
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-white">Human review log</h2>
          <ul className="mt-2 space-y-2">
            {c.reviewActions.map((h) => (
              <li key={h.id} className="text-xs text-slate-400">
                {h.createdAt.toLocaleString()} · {h.actionType} · {h.reviewer.email ?? h.reviewerId}
                {h.notes ? ` — ${h.notes}` : ""}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </HubLayout>
  );
}
