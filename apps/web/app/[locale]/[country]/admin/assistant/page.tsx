import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdminSurface } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
import { flags } from "@/lib/flags";
import { AdminAiAssistantClient } from "@/components/admin/AdminAiAssistantClient";

export const dynamic = "force-dynamic";

export default async function AdminAssistantPage() {
  const guestId = await getGuestId();
  if (!guestId || !(await isPlatformAdminSurface(guestId))) {
    redirect("/admin");
  }

  if (!flags.AI_ASSISTANT) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-slate-200">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Control tower · AI assistant</p>
        <h1 className="mt-2 text-xl font-semibold text-white">AI assistant is disabled</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-400">
          Stabilization default: the admin AI assistant and <code className="text-slate-300">/api/admin-ai/*</code> are off.
          Set <code className="font-mono text-amber-200/90">FEATURE_AI_ASSISTANT=1</code> when you are ready to re-enable.
        </p>
        <Link
          href="/admin/overview"
          className="mt-6 inline-block rounded-xl border border-amber-500/40 px-4 py-2 text-sm text-amber-200 hover:bg-amber-500/10"
        >
          ← Overview
        </Link>
      </main>
    );
  }

  const prisma = getLegacyDB();
  const user = await prisma.user.findUnique({
    where: { id: guestId },
    select: { role: true },
  });
  const canMutate = user?.role === "ADMIN";

  const [insights, runs] = await Promise.all([
    prisma.adminAiInsight.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.adminAiRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const initialInsights = insights.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
  }));
  const initialRuns = runs.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    startedAt: r.startedAt?.toISOString() ?? null,
    completedAt: r.completedAt?.toISOString() ?? null,
  }));

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="border-b border-white/10 bg-slate-900/80 px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Control tower · AI assistant</p>
            <p className="text-sm text-slate-300">
              Review stored insights and runs — use for platform summaries and next-step recommendations.
            </p>
          </div>
          <Link
            href="/admin/overview"
            className="shrink-0 rounded-xl border border-amber-500/40 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/10"
          >
            ← Overview
          </Link>
        </div>
      </div>
      <AdminAiAssistantClient
        initialInsights={initialInsights}
        initialRuns={initialRuns}
        canMutate={canMutate}
      />
    </main>
  );
}
