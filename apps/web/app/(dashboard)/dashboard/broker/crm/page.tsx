import Link from "next/link";
import { prisma } from "@/lib/db";
import { HubLayout } from "@/components/hub/HubLayout";
import { getHubTheme } from "@/lib/hub/themes";
import { hubNavigation } from "@/lib/hub/navigation";
import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";
import { BrokerCrmStagingBadge } from "@/components/crm/broker-crm/BrokerCrmStagingBadge";
import type { BrokerClientStatus } from "@prisma/client";
import { selectBestLeads } from "@/src/modules/ai-selection-engine/application/selectBestLeads";
import { BestLeadCard } from "@/src/modules/ai-selection-engine/ui/BestLeadCard";

export const dynamic = "force-dynamic";

function cardClass(accent: string) {
  return `rounded-xl border border-white/10 bg-black/30 p-4 shadow-sm`;
}

export default async function BrokerCrmDashboardPage() {
  const user = await requireBrokerOrAdminPage("/dashboard/broker/crm");
  const theme = getHubTheme("broker");
  const scope = user.role === "ADMIN" ? {} : { brokerId: user.id };

  const [group, recentInteractions, startOfDay, endOfDay, offerRows, contractCount] = await Promise.all([
    prisma.brokerClient.groupBy({
      by: ["status"],
      where: scope,
      _count: true,
    }),
    prisma.brokerClientInteraction.findMany({
      where: { brokerClient: scope },
      orderBy: { createdAt: "desc" },
      take: 14,
      include: {
        brokerClient: { select: { id: true, fullName: true } },
      },
    }),
    (() => {
      const s = new Date();
      s.setHours(0, 0, 0, 0);
      return s;
    })(),
    (() => {
      const s = new Date();
      s.setHours(0, 0, 0, 0);
      s.setDate(s.getDate() + 1);
      return s;
    })(),
    prisma.offer.findMany({
      where: user.role === "ADMIN" ? {} : { brokerId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        listingId: true,
        status: true,
        offeredPrice: true,
        updatedAt: true,
      },
    }),
    prisma.contract.count({
      where:
        user.role === "ADMIN"
          ? {}
          : {
              OR: [{ userId: user.id }, { createdById: user.id }],
            },
    }),
  ]);

  const dueToday = await prisma.brokerClientInteraction.findMany({
    where: {
      brokerClient: scope,
      completedAt: null,
      type: { in: ["TASK", "FOLLOW_UP"] },
      dueAt: { gte: startOfDay, lt: endOfDay },
    },
    include: { brokerClient: { select: { id: true, fullName: true } } },
    orderBy: { dueAt: "asc" },
    take: 20,
  });

  const listingIds = [...new Set(offerRows.map((o) => o.listingId))];
  const bestLeads = await selectBestLeads(user.id);
  const listingsForOffers =
    listingIds.length > 0
      ? await prisma.listing.findMany({
          where: { id: { in: listingIds } },
          select: { id: true, title: true, listingCode: true },
        })
      : [];
  const titleById = new Map(listingsForOffers.map((l) => [l.id, l.title?.trim() || l.listingCode || l.id]));
  const offerRowsWithTitles = offerRows.map((o) => ({
    ...o,
    listingTitle: titleById.get(o.listingId) ?? o.listingId,
  }));

  const counts: Partial<Record<BrokerClientStatus, number>> = {};
  for (const g of group) {
    counts[g.status] = g._count;
  }

  const n = (s: BrokerClientStatus) => counts[s] ?? 0;

  const summary = [
    { label: "Leads", value: n("LEAD") + n("CONTACTED") + n("VIEWING"), sub: "Early pipeline" },
    { label: "Qualified", value: n("QUALIFIED"), sub: "Screened" },
    { label: "Negotiating", value: n("NEGOTIATING"), sub: "Active deal" },
    { label: "Under contract", value: n("UNDER_CONTRACT"), sub: "Legal / closing" },
    { label: "Closed", value: n("CLOSED"), sub: "Won" },
  ];

  const lost = n("LOST");

  return (
    <HubLayout
      title="Broker CRM"
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={user.role === "ADMIN"}
      showWorkspaceBadge
    >
      <div className="space-y-8 text-slate-100" data-tour="crm-pipeline">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Pipeline workspace</h2>
            <p className="mt-1 text-sm text-slate-400">
              Central view of clients, tasks, and linked deal activity.
            </p>
          </div>
          <BrokerCrmStagingBadge />
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/dashboard/broker/clients"
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
          >
            All clients
          </Link>
          <Link
            href="/dashboard/broker/pipeline"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 font-medium text-white hover:bg-white/10"
          >
            Kanban pipeline
          </Link>
          <Link
            href="/dashboard/broker/tasks"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 font-medium text-white hover:bg-white/10"
          >
            Tasks
          </Link>
          <Link
            href="/dashboard/broker/offers"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 font-medium text-white hover:bg-white/10"
          >
            Offer inbox
          </Link>
        </div>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Summary</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {summary.map((c) => (
              <div key={c.label} className={cardClass(theme.accent)}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{c.value}</p>
                <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Lost: {lost} · Stages roll up conservatively for quick scanning.</p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={cardClass(theme.accent)}>
            <h3 className="text-sm font-semibold text-white">Tasks due today</h3>
            {dueToday.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Nothing due today.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {dueToday.map((t) => (
                  <li key={t.id} className="flex justify-between gap-2 text-sm">
                    <Link href={`/dashboard/broker/clients/${t.brokerClient.id}`} className="text-emerald-300 hover:underline">
                      {t.brokerClient.fullName}
                    </Link>
                    <span className="text-slate-500">{t.type.replace(/_/g, " ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={cardClass(theme.accent)}>
            <h3 className="text-sm font-semibold text-white">Recent interactions</h3>
            {recentInteractions.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No CRM notes yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {recentInteractions.map((t) => (
                  <li key={t.id} className="text-sm">
                    <Link
                      href={`/dashboard/broker/clients/${t.brokerClient.id}`}
                      className="font-medium text-emerald-300 hover:underline"
                    >
                      {t.brokerClient.fullName}
                    </Link>
                    <span className="text-slate-500"> · {t.type.replace(/_/g, " ")}</span>
                    {t.title ? <span className="block text-xs text-slate-400">{t.title}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className={cardClass(theme.accent)}>
          <h3 className="text-sm font-semibold text-white">AI-selected leads</h3>
          <p className="mt-1 text-xs text-slate-500">Deterministic priority by intent, urgency, response, and deal size.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {bestLeads.length === 0 ? (
              <p className="text-sm text-slate-500">No matching lead signals yet.</p>
            ) : (
              bestLeads.slice(0, 4).map((lead) => <BestLeadCard key={lead.id} lead={lead} />)
            )}
          </div>
        </section>

        <section className={cardClass(theme.accent)}>
          <h3 className="text-sm font-semibold text-white">Quick links — offers & contracts</h3>
          <p className="mt-1 text-xs text-slate-500">
            Open workflows you already use; CRM links clients to the same underlying records.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Recent offers (yours)</p>
              <ul className="mt-2 space-y-2 text-sm">
                {offerRowsWithTitles.length === 0 ? (
                  <li className="text-slate-500">No offers in this view.</li>
                ) : (
                  offerRowsWithTitles.map((o) => (
                    <li key={o.id}>
                      <Link href={`/dashboard/offers/${o.id}`} className="text-emerald-300 hover:underline">
                        {o.status.replace(/_/g, " ")} · ${o.offeredPrice.toLocaleString()}
                      </Link>
                      <span className="block truncate text-xs text-slate-300">{o.listingTitle}</span>
                      <span className="block font-mono text-[10px] text-slate-600">{o.listingId}</span>
                    </li>
                  ))
                )}
              </ul>
              <Link href="/dashboard/broker/offers" className="mt-2 inline-block text-xs text-emerald-400/90 hover:underline">
                All offers →
              </Link>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Contracts (workspace)</p>
              <p className="mt-2 text-2xl font-semibold text-white">{contractCount}</p>
              <Link href="/dashboard/contracts" className="mt-2 inline-block text-xs text-emerald-400/90 hover:underline">
                Open contracts →
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Counts by stage</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
            {(
              [
                "LEAD",
                "CONTACTED",
                "QUALIFIED",
                "VIEWING",
                "NEGOTIATING",
                "UNDER_CONTRACT",
                "CLOSED",
                "LOST",
              ] as BrokerClientStatus[]
            ).map((s) => (
              <span key={s}>
                <span className="text-slate-500">{s.replace(/_/g, " ")}:</span> {n(s)}
              </span>
            ))}
          </div>
        </section>
      </div>
    </HubLayout>
  );
}
