import Link from "next/link";
import { redirect } from "next/navigation";
import { NewLegalDraftButton } from "@/components/forms/NewLegalDraftButton";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAuthenticatedUser } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set(["BROKER", "ADMIN", "MORTGAGE_BROKER"]);

export default async function DashboardLegalFormsPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || !BROKER_LIKE.has(user.role)) {
    redirect("/dashboard");
  }

  const [drafts, stuck] = await Promise.all([
    prisma.legalFormDraft.findMany({
      where: { brokerUserId: userId },
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: { template: { select: { name: true, key: true } } },
    }),
    prisma.legalFormDraft.groupBy({
      by: ["status"],
      where: { brokerUserId: userId },
      _count: { _all: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 text-slate-100">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Legal drafting</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">OACIQ-style form workspace</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          AI-assisted prefill and clause suggestions are <strong>assistive only</strong>. You must review and approve
          before export. Nothing here is guaranteed compliant with OACIQ or provincial law.
        </p>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold text-slate-200">Support snapshot (your drafts)</h2>
        <ul className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
          {stuck.map((s) => (
            <li key={s.status}>
              {s.status}: <span className="font-mono text-slate-200">{s._count._all}</span>
            </li>
          ))}
          {stuck.length === 0 && <li>No drafts yet.</li>}
        </ul>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Your drafts</h2>
          <NewLegalDraftButton />
        </div>
        <ul className="mt-4 space-y-2">
          {drafts.map((d) => (
            <li key={d.id}>
              <Link
                href={`/dashboard/forms/${d.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-3 hover:border-amber-500/30"
              >
                <span className="text-slate-200">{d.template.name}</span>
                <span className="text-xs text-slate-500">{d.status}</span>
              </Link>
            </li>
          ))}
          {drafts.length === 0 && <li className="text-sm text-slate-500">No drafts yet — create one to begin.</li>}
        </ul>
      </section>
    </div>
  );
}
