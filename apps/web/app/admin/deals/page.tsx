import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";

import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { getDealLegalTimeline } from "@/lib/deals/legal-timeline";

const LINKS = [
  { label: "Mortgage deals (admin)", desc: "Pipeline & broker-attached mortgage opportunities.", href: "/admin/mortgage-deals" },
  { label: "Offers (platform)", desc: "Listing offers and negotiation oversight.", href: "/admin/offers" },
  { label: "RE transactions", desc: "Residential transaction monitor.", href: "/admin/transactions" },
  { label: "Disputes", desc: "Escalations and refunds.", href: "/admin/disputes" },
  { label: "Commissions", desc: "Rules and accruals.", href: "/admin/commissions" },
];

export default async function AdminDealsHubPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/deals");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");
  const role = await getUserRole();
  const deals = await prisma.deal.findMany({
    orderBy: { updatedAt: "desc" },
    take: 12,
    include: {
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
      broker: { select: { name: true, email: true } },
      lead: { select: { id: true } },
    },
  });
  const dealSummaries = await Promise.all(
    deals.map(async (deal) => ({
      deal,
      legalTimeline: await getDealLegalTimeline(deal.id).catch(() => null),
    }))
  );
  return (
    <HubLayout title="Deals" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Deals & transactions</h1>
          <p className="mt-2 text-sm text-slate-400">
            Monitor closings, mortgage-side deals, and offer workflows. Intervention tools live in disputes and
            operational controls.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-premium-gold/30 bg-premium-gold/[0.06] p-5 transition hover:border-premium-gold/50"
            >
              <p className="text-sm font-semibold text-premium-gold">{item.label}</p>
              <p className="mt-2 text-xs text-slate-500">{item.desc}</p>
              <span className="mt-3 inline-block text-xs text-slate-400">Open →</span>
            </Link>
          ))}
        </div>
        <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent legal-stage monitor</h2>
              <p className="mt-1 text-sm text-slate-400">
                Quick compliance scan for active deals, Immo attribution, and current legal stage.
              </p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Deal</th>
                  <th className="py-2 pr-3">Parties</th>
                  <th className="py-2 pr-3">Legal stage</th>
                  <th className="py-2 pr-3">Flags</th>
                </tr>
              </thead>
              <tbody>
                {dealSummaries.map(({ deal, legalTimeline }) => (
                  <tr key={deal.id} className="border-b border-white/5 align-top">
                    <td className="py-3 pr-3">
                      <p className="font-mono text-xs text-slate-500">{deal.dealCode ?? deal.id.slice(0, 8)}</p>
                      <p className="mt-1 text-white">${(deal.priceCents / 100).toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{deal.status}</p>
                    </td>
                    <td className="py-3 pr-3 text-xs text-slate-400">
                      <p>{deal.buyer.name ?? deal.buyer.email}</p>
                      <p>{deal.seller.name ?? deal.seller.email}</p>
                      <p>{deal.broker?.name ?? deal.broker?.email ?? "No broker"}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <p className="text-sm font-medium text-white">
                        {legalTimeline?.currentStage.replace(/_/g, " ") ?? "No legal timeline"}
                      </p>
                      {legalTimeline?.events.at(-1) ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Last update {new Date(legalTimeline.events.at(-1)!.createdAt).toLocaleString()}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      {deal.leadId ? <p className="text-premium-gold">Lead linked</p> : <p className="text-slate-500">No linked lead</p>}
                      {deal.leadContactOrigin === "IMMO_CONTACT" ? <p className="text-amber-300">ImmoContact</p> : null}
                      {deal.commissionEligible ? <p className="text-emerald-300">Commission eligible</p> : null}
                      {deal.possibleBypassFlag ? <p className="text-rose-300">Possible bypass</p> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </HubLayout>
  );
}
