import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { isLiveDebugDashboardEnabled } from "@/src/modules/analytics/liveDebugGate";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminLiveDebugUserPage({ params }: Props) {
  if (!isLiveDebugDashboardEnabled()) {
    redirect("/admin");
  }
  const { id } = await params;
  if (!id || id.length < 8) notFound();

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) notFound();

  const [events, errors] = await Promise.all([
    prisma.userEvent.findMany({
      where: { userId: id },
      orderBy: { createdAt: "asc" },
      take: 500,
      select: { id: true, eventType: true, createdAt: true, metadata: true },
    }),
    prisma.errorEvent.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/admin/live-debug" className="text-sm text-emerald-400 hover:underline">
          ← Live debug
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Session trace</h1>
          <p className="mt-1 font-mono text-sm text-slate-400">{user.email ?? user.id}</p>
          <p className="text-xs text-slate-500">
            {user.name} · {user.role}
          </p>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="text-sm font-semibold text-white">Journey ({events.length} events)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-300">
            {events.map((e) => (
              <li key={e.id}>
                <span className="text-slate-500">{e.createdAt.toISOString()}</span> —{" "}
                <span className="text-emerald-400">{e.eventType}</span>
                {e.metadata ? (
                  <pre className="mt-1 max-h-24 overflow-auto rounded bg-slate-950 p-2 text-xs text-slate-500">
                    {JSON.stringify(e.metadata, null, 0).slice(0, 400)}
                  </pre>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        {errors.length > 0 ? (
          <section className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4">
            <h2 className="text-sm font-semibold text-rose-200">Errors ({errors.length})</h2>
            <ul className="mt-2 space-y-2 text-xs text-rose-100/90">
              {errors.map((e) => (
                <li key={e.id}>
                  <span className="font-mono">{e.errorType}</span> — {e.message.slice(0, 200)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
