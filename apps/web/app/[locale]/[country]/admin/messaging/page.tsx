import Link from "next/link";
import { prisma } from "@repo/db";
import { MessagingAdminClient } from "./MessagingAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminMessagingPage() {
  const [logs, stats] = await Promise.all([
    prisma.messageLog.findMany({
      orderBy: { sentAt: "desc" },
      take: 40,
      select: {
        id: true,
        userId: true,
        status: true,
        subject: true,
        triggerEvent: true,
        sentAt: true,
      },
    }),
    prisma.messageLog.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">Growth</p>
            <h1 className="font-serif text-2xl font-semibold text-white">Messaging system</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Templates in <code className="text-slate-400">message_templates</code>, logs in{" "}
              <code className="text-slate-400">message_logs</code>. Enable automation with{" "}
              <code className="text-slate-400">MESSAGING_AUTOMATION_ENABLED=1</code>. Cron:{" "}
              <code className="text-slate-400">POST /api/cron/messaging-worker</code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/admin/ai-inbox" className="text-emerald-400 hover:text-emerald-300">
              AI auto-reply inbox →
            </Link>
            <Link href="/admin/growth-funnel-data" className="text-emerald-400 hover:text-emerald-300">
              Funnel dashboard →
            </Link>
          </div>
        </header>

        <div className="flex flex-wrap gap-4 text-sm">
          {stats.map((s) => (
            <span key={s.status} className="rounded-full border border-slate-700 px-3 py-1 text-slate-400">
              {s.status}: {s._count.id}
            </span>
          ))}
        </div>

        <MessagingAdminClient />

        <section className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
          <h2 className="text-sm font-semibold text-slate-300">Recent sends</h2>
          <ul className="mt-3 divide-y divide-slate-800 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex flex-wrap gap-2 py-2 text-slate-400">
                <span className="text-slate-500">{l.sentAt.toISOString().slice(0, 19)}</span>
                <span className="text-amber-200/80">{l.triggerEvent ?? "—"}</span>
                <span>{l.status}</span>
                <span className="truncate text-slate-500">{l.subject}</span>
                <code className="text-xs text-slate-600">{l.userId.slice(0, 8)}…</code>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
