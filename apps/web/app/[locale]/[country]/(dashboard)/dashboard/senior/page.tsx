import Link from "next/link";
import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { prisma } from "@repo/db";
import { listLeadsForAdmin, listLeadsForOperator } from "@/modules/senior-living/lead.service";
import {
  compareLeadsByPriority,
  getLatestScoresForLeads,
  type LeadBand,
} from "@/modules/senior-living/lead-scoring.service";
import { getLeadPricingQuote } from "@/modules/monetization/dynamic-market-pricing.service";
import { canAccessSeniorCommandCenter } from "@/lib/senior-command/access";
import { resolveSeniorHubAccess } from "@/lib/senior-dashboard/role";

export const dynamic = "force-dynamic";

export default async function SeniorOperatorDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { locale, country } = await params;
  const dash = `/${locale}/${country}/dashboard`;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) redirect(`${dash}`);

  const isAdmin = user.role === PlatformRole.ADMIN;
  const showCommandCenter = canAccessSeniorCommandCenter(user.role);
  const canOperate =
    isAdmin ||
    user.role === PlatformRole.HOST ||
    user.role === PlatformRole.BROKER;

  if (!canOperate) {
    redirect(dash);
  }

  const [residences, leads] = await Promise.all([
    prisma.seniorResidence.findMany({
      where: isAdmin ? {} : { operatorId: userId },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { _count: { select: { leads: true } } },
    }),
    isAdmin ? listLeadsForAdmin() : listLeadsForOperator(userId),
  ]);

  const scoreMap = await getLatestScoresForLeads(leads.map((l) => l.id));
  const sortedLeads = [...leads].sort((a, b) => {
    const ra = scoreMap.get(a.id);
    const rb = scoreMap.get(b.id);
    return compareLeadsByPriority(
      { band: (ra?.band as LeadBand) ?? "LOW", score: ra?.score ?? 0 },
      { band: (rb?.band as LeadBand) ?? "LOW", score: rb?.score ?? 0 }
    );
  });

  function bandBadgeClass(band: string | undefined): string {
    if (!band) return "bg-slate-700/40 text-slate-500 ring-1 ring-slate-600/40";
    const b = band.toUpperCase();
    if (b === "HIGH") return "bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-500/40";
    if (b === "MEDIUM") return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35";
    return "bg-slate-700/60 text-slate-400 ring-1 ring-slate-600/50";
  }

  function rowClass(band: string | undefined): string {
    if (!band) return "";
    const b = band.toUpperCase();
    if (b === "HIGH") return "bg-emerald-950/25";
    if (b === "LOW") return "opacity-85";
    return "";
  }

  const pricingMap = new Map<string, Awaited<ReturnType<typeof getLeadPricingQuote>>>();
  await Promise.all(
    sortedLeads.slice(0, 120).map(async (l) => {
      try {
        const q = await getLeadPricingQuote({
          leadId: l.id,
          city: l.residence.city,
          recordEvent: false,
        });
        pricingMap.set(l.id, q);
      } catch {
        /* dynamic pricing optional if tables missing */
      }
    })
  );

  const totalLeads = leads.length;
  const closed = leads.filter((l) => l.status === "CLOSED").length;
  const conversionApprox = totalLeads > 0 ? Math.round((closed / totalLeads) * 1000) / 10 : 0;

  return (
    <div className="space-y-8 p-4 text-sm text-slate-100">
      <section className="rounded-xl border border-zinc-600/50 bg-zinc-900/60 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/90">Role workspaces</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {hubAccess.kind === "residence_operator" || hubAccess.kind === "platform_admin" ?
            <Link
              className="rounded-lg bg-zinc-100 px-4 py-2 font-semibold text-zinc-900 hover:bg-white"
              href={`/${locale}/${country}/dashboard/residence`}
            >
              Residence dashboard
            </Link>
          : null}
          {hubAccess.kind === "residence_manager" || hubAccess.kind === "platform_admin" ?
            <Link
              className="rounded-lg border border-amber-400/40 px-4 py-2 font-semibold text-amber-100 hover:bg-amber-500/10"
              href={`/${locale}/${country}/dashboard/management`}
            >
              Management dashboard
            </Link>
          : null}
          {hubAccess.kind === "platform_admin" ?
            <Link
              className="rounded-lg border border-teal-400/40 px-4 py-2 font-semibold text-teal-200 hover:bg-teal-500/10"
              href={`/${locale}/${country}/dashboard/admin`}
            >
              Platform operations
            </Link>
          : null}
        </div>
      </section>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-400">Operator</p>
        <h1 className="mt-1 text-2xl font-bold">Senior Living</h1>
        <p className="mt-2 max-w-xl text-slate-400">
          Residences you operate on LECIPM and inbound family requests. Monetization: pay-per-lead and operator
          subscriptions are configured in billing — leads are attributed here.
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          {showCommandCenter ?
            <>
              {isAdmin ?
                <Link
                  className="inline-block text-sm font-semibold text-teal-300 underline"
                  href={`/${locale}/${country}/dashboard/admin`}
                >
                  Platform operations
                </Link>
              : (
                <Link
                  className="inline-block text-sm font-semibold text-teal-300 underline"
                  href={`/${locale}/${country}/dashboard/senior/command-center`}
                >
                  Ops tools (legacy)
                </Link>
              )}
              <Link
                className="inline-block text-sm font-semibold text-teal-300 underline"
                href={`/${locale}/${country}/dashboard/senior/expansion`}
              >
                City expansion
              </Link>
            </>
          : null}
          {isAdmin ?
            <Link
              className="inline-block text-sm font-semibold text-amber-200/90 underline"
              href={`/${locale}/${country}/dashboard/analytics/senior`}
            >
              AI layer analytics (admin)
            </Link>
          : null}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
          <p className="text-xs text-slate-500">Listings</p>
          <p className="mt-1 text-2xl font-semibold text-teal-300">{residences.length}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
          <p className="text-xs text-slate-500">Leads (visible)</p>
          <p className="mt-1 text-2xl font-semibold text-teal-300">{totalLeads}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
          <p className="text-xs text-slate-500">Closed / approx. conversion</p>
          <p className="mt-1 text-2xl font-semibold text-teal-300">
            {closed} / {conversionApprox}%
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Your residences</h2>
        <ul className="mt-3 divide-y divide-slate-800 rounded-xl border border-slate-800">
          {residences.length === 0 ?
            <li className="px-4 py-8 text-slate-500">No residences yet — create via API or admin tooling.</li>
          : residences.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <span className="font-medium">{r.name}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {r.city} · {r._count.leads} leads
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    className="text-teal-400 hover:underline"
                    href={`/${locale}/${country}/senior-living/${r.id}`}
                  >
                    View public page
                  </Link>
                  <Link
                    className="text-amber-200/90 hover:underline"
                    href={`/${locale}/${country}/dashboard/senior/operators/${r.id}`}
                  >
                    AI performance
                  </Link>
                </div>
              </li>
            ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Incoming leads</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[880px] text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Score</th>
                <th className="px-3 py-2 font-medium">Est. fee</th>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Residence</th>
                <th className="px-3 py-2 font-medium">Family</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.map((l) => {
                const sc = scoreMap.get(l.id);
                const bandLabel = sc?.band ?? "—";
                const pq = pricingMap.get(l.id);
                return (
                  <tr key={l.id} className={`border-b border-slate-800/80 ${rowClass(sc?.band)}`}>
                    <td className="px-3 py-2">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${bandBadgeClass(sc?.band)}`}>
                        {bandLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-300">
                      {sc?.score != null ? `${Math.round(sc.score)} · ${(sc.probability * 100).toFixed(0)}%` : "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-300">
                      {pq ?
                        <>
                          <span className="font-semibold text-amber-200">${pq.finalPrice} CAD</span>
                          <p className="mt-1 max-w-[14rem] text-[10px] leading-snug text-slate-500">
                            {pq.leadBand === "HIGH" ?
                              "High-quality lead — higher fee within min/max (transparent rules)."
                            : pq.leadBand === "LOW" ?
                              "Lighter engagement — discounted fee within guardrails."
                            : "Demand + conversion signals applied; see /api/pricing/lead."}
                          </p>
                        </>
                      : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{l.createdAt.toISOString().slice(0, 10)}</td>
                    <td className="px-3 py-2">{l.residence.name}</td>
                    <td className="px-3 py-2">{l.requesterName}</td>
                    <td className="px-3 py-2">{l.email}</td>
                    <td className="px-3 py-2 font-mono text-teal-400">{l.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
