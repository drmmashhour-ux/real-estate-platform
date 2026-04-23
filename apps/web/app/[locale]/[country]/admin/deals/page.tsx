import Link from "next/link";
import { AdminDealsKanban, DealInsightsStrip, type KanbanDeal } from "@/components/admin/AdminDealsKanban";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { prisma } from "@repo/db";
import { getDealLegalTimeline } from "@/lib/deals/legal-timeline";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const LINKS = [
  { label: "Mortgage deals (admin)", desc: "Pipeline & broker-attached mortgage opportunities.", href: "/admin/mortgage-deals" },
  { label: "Offers (platform)", desc: "Listing offers and negotiation oversight.", href: "/admin/offers" },
  { label: "RE transactions", desc: "Residential transaction monitor.", href: "/admin/transactions" },
  { label: "Disputes", desc: "Escalations and refunds.", href: "/admin/disputes" },
  { label: "Commissions", desc: "Rules and accruals.", href: "/admin/commissions" },
];

export default async function AdminDealsHubPage() {
  await requireAdminControlUserId();

  const dealsRaw = await prisma.deal.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
      broker: { select: { name: true, email: true } },
      lead: { select: { id: true } },
    },
  });

  const kanbanDeals: KanbanDeal[] = dealsRaw.map((d) => ({
    id: d.id,
    dealCode: d.dealCode,
    status: d.status,
    priceCents: d.priceCents,
    updatedAt: d.updatedAt.toISOString(),
    buyer: d.buyer,
    seller: d.seller,
    broker: d.broker,
  }));

  const closed = dealsRaw.filter((d) => d.status === "closed").length;
  const highValue = dealsRaw.filter((d) => d.priceCents >= 500_000_00).length;
  const withLead = dealsRaw.filter((d) => d.leadId).length;

  const dealSummaries = await Promise.all(
    dealsRaw.slice(0, 12).map(async (deal) => ({
      deal,
      legalTimeline: await getDealLegalTimeline(deal.id).catch(() => null),
    }))
  );

  const riskAlerts = await getAdminRiskAlerts();
  const alerts = riskAlerts.slice(0, 12).map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={alerts}>
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-white">Deals</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Kanban by pipeline stage, legal-stage monitor, and deep links for mortgage and offers.
          </p>
        </div>

        <DealInsightsStrip total={dealsRaw.length} closed={closed} highValue={highValue} withLead={withLead} />

        <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <h2 className="text-lg font-semibold text-white">Pipeline board</h2>
          <p className="mt-1 text-sm text-zinc-500">Last 200 deals by recency — columns follow `Deal.status`.</p>
          <div className="mt-4">
            <AdminDealsKanban deals={kanbanDeals} />
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          {LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-zinc-800 bg-[#111] p-5 transition hover:border-zinc-600"
            >
              <p className="text-sm font-semibold" style={{ color: "#D4AF37" }}>
                {item.label}
              </p>
              <p className="mt-2 text-xs text-zinc-500">{item.desc}</p>
              <span className="mt-3 inline-block text-xs text-zinc-400">Open →</span>
            </Link>
          ))}
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent legal-stage monitor</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Quick compliance scan for active deals, Immo attribution, and current legal stage.
              </p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-zinc-300">
              <thead className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">Deal</th>
                  <th className="py-2 pr-3">Parties</th>
                  <th className="py-2 pr-3">Legal stage</th>
                  <th className="py-2 pr-3">Flags</th>
                </tr>
              </thead>
              <tbody>
                {dealSummaries.map(({ deal, legalTimeline }) => (
                  <tr key={deal.id} className="border-b border-zinc-800/80 align-top">
                    <td className="py-3 pr-3">
                      <p className="font-mono text-xs text-zinc-500">{deal.dealCode ?? deal.id.slice(0, 8)}</p>
                      <p className="mt-1 text-white">${(deal.priceCents / 100).toLocaleString()}</p>
                      <p className="text-xs text-zinc-500">{deal.status}</p>
                    </td>
                    <td className="py-3 pr-3 text-xs text-zinc-400">
                      <p>{deal.buyer.name ?? deal.buyer.email}</p>
                      <p>{deal.seller.name ?? deal.seller.email}</p>
                      <p>{deal.broker?.name ?? deal.broker?.email ?? "No broker"}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <p className="text-sm font-medium text-white">
                        {legalTimeline?.currentStage.replace(/_/g, " ") ?? "No legal timeline"}
                      </p>
                      {legalTimeline?.events.at(-1) ? (
                        <p className="mt-1 text-xs text-zinc-500">
                          Last update {new Date(legalTimeline.events.at(-1)!.createdAt).toLocaleString()}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      {deal.leadId ? <p className="text-amber-400">Lead linked</p> : <p className="text-zinc-500">No linked lead</p>}
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
    </LecipmControlShell>
  );
}
