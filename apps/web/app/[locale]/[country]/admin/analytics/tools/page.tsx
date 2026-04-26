import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export default async function AdminToolAnalyticsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/");

  const since = new Date(Date.now() - 90 * 86400000);
  const [byTool, leads, cities] = await Promise.all([
    prisma.toolUsageEvent.groupBy({
      by: ["toolKey"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["leadSource"],
      where: {
        createdAt: { gte: since },
        leadSource: { in: ["investor_lead", "first_home_buyer_lead", "welcome_tax_lead"] },
      },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["purchaseRegion"],
      where: {
        createdAt: { gte: since },
        leadSource: "investor_lead",
        purchaseRegion: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { purchaseRegion: "desc" } },
      take: 10,
    }),
  ]);

  const best = [...leads].sort((a, b) => b._count._all - a._count._all)[0];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/admin/analytics" className="text-sm text-amber-400 hover:text-amber-300">
          ← Ads analytics
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Tool usage &amp; leads</h1>
        <p className="mt-2 text-sm text-slate-400">Last 90 days. Internal reporting only.</p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-500">Best converting tool (leads)</p>
            <p className="mt-2 text-lg font-semibold text-white">{best?.leadSource ?? "—"}</p>
            <p className="text-sm text-slate-400">{best?._count._all ?? 0} leads</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-500">First-time buyer leads</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {leads.find((l) => l.leadSource === "first_home_buyer_lead")?._count._all ?? 0}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-medium text-white">Tool usage counts</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {byTool.map((t) => (
              <li key={t.toolKey} className="flex justify-between rounded border border-slate-800 bg-slate-900/40 px-3 py-2">
                <span>{t.toolKey}</span>
                <span className="text-slate-400">{t._count._all}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-medium text-white">Top cities (investor tool leads)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {cities.map((c) => (
              <li key={c.purchaseRegion ?? "?"} className="flex justify-between rounded border border-slate-800 bg-slate-900/40 px-3 py-2">
                <span>{c.purchaseRegion}</span>
                <span className="text-slate-400">{c._count._all}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-medium text-white">Leads by tool</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {leads.map((l) => (
              <li key={l.leadSource ?? "?"} className="flex justify-between rounded border border-slate-800 bg-slate-900/40 px-3 py-2">
                <span>{l.leadSource}</span>
                <span className="text-slate-400">{l._count._all}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
