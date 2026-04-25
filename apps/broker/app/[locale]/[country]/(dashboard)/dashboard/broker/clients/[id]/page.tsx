import Link from "next/link";
import { notFound } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@repo/db";
import { getBrokerClientDetailForPage } from "@/modules/crm/services/get-client-detail";
import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";
import { BrokerCrmStagingBadge } from "@/components/crm/broker-crm/BrokerCrmStagingBadge";
import { ClientInteractionForm } from "@/components/crm/broker-crm/ClientInteractionForm";
import { ClientInteractionTimeline } from "@/components/crm/broker-crm/ClientInteractionTimeline";
import { ClientListingLinksPanel } from "@/components/crm/broker-crm/ClientListingLinksPanel";
import { ClientStatusActions } from "@/components/crm/broker-crm/ClientStatusActions";
import { ClientStatusBadge } from "@/components/crm/broker-crm/ClientStatusBadge";
import { DeleteBrokerClientButton } from "./delete-client-button";
import { OpenContextConversationButton } from "@/components/messaging/OpenContextConversationButton";
import { buildIntakeReadinessSummary } from "@/modules/intake/services/build-intake-readiness-summary";
import { calculateChecklistProgress } from "@/modules/intake/services/calculate-checklist-progress";
import { PrintPageButton } from "@/components/ui/PrintPageButton";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function BrokerClientDetailPage(props: PageProps) {
  const { id } = await props.params;
  const user = await requireBrokerOrAdminPage(`/dashboard/broker/clients/${id}`);
  const bundle = await getBrokerClientDetailForPage(id, user);
  if (!bundle.ok) notFound();

  const { client, related } = bundle;

  const crmAppointments = await prisma.appointment.findMany({
    where: { brokerClientId: id },
    orderBy: { startsAt: "desc" },
    take: 24,
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      startsAt: true,
      endsAt: true,
    },
  });

  const intakeRow = await prisma.brokerClient.findUnique({
    where: { id },
    select: {
      intakeProfile: true,
      requiredDocumentItems: {
        where: { deletedAt: null },
        select: { isMandatory: true, status: true, deletedAt: true },
      },
    },
  });
  const intakeSummary = intakeRow
    ? buildIntakeReadinessSummary(intakeRow.intakeProfile, intakeRow.requiredDocumentItems)
    : null;
  const intakeProgress = intakeRow
    ? calculateChecklistProgress(intakeRow.requiredDocumentItems)
    : null;

  const card = "rounded-xl border border-white/10 bg-black/30 p-5";

  const listingRows = client.listingLinks.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <HubLayout
      title={client.fullName}
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={user.role === "ADMIN"}
    >
      <div className="space-y-6 text-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-white">{client.fullName}</h2>
              <ClientStatusBadge status={client.status} />
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {[client.email, client.phone].filter(Boolean).join(" · ") || "No email / phone"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BrokerCrmStagingBadge />
            <Link
              href={`/api/broker/clients/${client.id}/export`}
              target="_blank"
              className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:border-emerald-400/40 hover:text-white"
            >
              Open dossier
            </Link>
            <PrintPageButton
              label="Print client file"
              className="print:hidden rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:border-emerald-400/40 hover:text-white disabled:opacity-60"
            />
            <Link
              href="/dashboard/broker/clients"
              className="text-sm text-emerald-400/90 hover:underline"
            >
              ← All clients
            </Link>
          </div>
        </div>

        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Pipeline</h3>
          <p className="mt-1 text-xs text-slate-500">Move stage with validation; optional note logs on the timeline.</p>
          <div className="mt-4">
            <ClientStatusActions clientId={client.id} current={client.status} />
          </div>
        </section>

        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Client intake</h3>
          <p className="mt-1 text-xs text-slate-500">{intakeSummary?.headline}</p>
          <p className="mt-2 text-sm text-slate-300">
            Checklist {intakeProgress?.percentComplete ?? 0}% · {intakeSummary?.mandatoryMissingCount ?? 0} mandatory
            item(s) still open
          </p>
          <div className="mt-3">
            <Link
              href={`/dashboard/broker/intake/${client.id}`}
              className="inline-flex rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-900/40"
            >
              Open intake workspace
            </Link>
          </div>
        </section>

        {client.userId ? (
          <section className={card}>
            <h3 className="text-sm font-semibold text-white">Messaging</h3>
            <p className="mt-1 text-xs text-slate-500">
              In-app thread with this client when they have a linked platform account.
            </p>
            <div className="mt-3">
              <OpenContextConversationButton
                contextType="client"
                contextId={client.id}
                label="Open client conversation"
                className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-50"
              />
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={card}>
            <h3 className="text-sm font-semibold text-white">Profile</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Source</dt>
                <dd className="text-right text-slate-200">{client.source ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Linked user</dt>
                <dd className="text-right">
                  {client.linkedUser ? (
                    <span className="text-slate-200">
                      {client.linkedUser.name ?? client.linkedUser.email}{" "}
                      <span className="font-mono text-[10px] text-slate-600">{client.linkedUser.id}</span>
                    </span>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Target city</dt>
                <dd className="text-right text-slate-200">{client.targetCity ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Budget</dt>
                <dd className="text-right text-slate-200">
                  {client.budgetMin != null || client.budgetMax != null
                    ? `${client.budgetMin != null ? `$${client.budgetMin.toLocaleString()}` : "—"} – ${client.budgetMax != null ? `$${client.budgetMax.toLocaleString()}` : "—"}`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Tags</dt>
                <dd className="text-right text-slate-200">
                  {client.tags?.length ? client.tags.join(", ") : "—"}
                </dd>
              </div>
            </dl>
            {client.notes ? (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{client.notes}</p>
              </div>
            ) : null}
          </section>

          <section className={card}>
            <h3 className="text-sm font-semibold text-white">Log interaction</h3>
            <div className="mt-3">
              <ClientInteractionForm clientId={client.id} />
            </div>
          </section>
        </div>

        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Timeline</h3>
          <div className="mt-4">
            <ClientInteractionTimeline interactions={client.interactions} />
          </div>
        </section>

        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Linked listings</h3>
          <p className="mt-1 text-xs text-slate-500">Saved, shared, or viewed properties (CRM links only — same listing IDs as the marketplace).</p>
          <div className="mt-4">
            <ClientListingLinksPanel clientId={client.id} links={listingRows} />
          </div>
        </section>

        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Offers (linked user)</h3>
          {client.userId ? (
            <ul className="mt-3 space-y-2 text-sm">
              {related.offers.length === 0 ? (
                <li className="text-slate-500">No offers for this linked account.</li>
              ) : (
                related.offers.map((o) => (
                  <li key={o.id}>
                    <Link href={`/dashboard/offers/${o.id}`} className="text-emerald-300 hover:underline">
                      {o.status.replace(/_/g, " ")} · ${o.offeredPrice.toLocaleString()}
                    </Link>
                    <span className="block font-mono text-[10px] text-slate-600">{o.listingId}</span>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Link a platform user to see their offers.</p>
          )}
        </section>

        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Contracts (linked user)</h3>
          {client.userId ? (
            <ul className="mt-3 space-y-2 text-sm">
              {related.contracts.length === 0 ? (
                <li className="text-slate-500">No contracts for this linked account.</li>
              ) : (
                related.contracts.map((ctr) => (
                  <li key={ctr.id} className="flex flex-wrap justify-between gap-2">
                    <div>
                      <span className="text-slate-200">{ctr.title || ctr.type}</span>
                      <span className="ml-2 text-xs text-slate-500">{ctr.status}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {ctr._count.signatures} sig(s) · updated {ctr.updatedAt.toLocaleDateString()}
                    </span>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Link a platform user to see their contracts.</p>
          )}
          <Link href="/dashboard/contracts" className="mt-3 inline-block text-xs text-emerald-400/90 hover:underline">
            Open contracts workspace →
          </Link>
        </section>

        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Deals (linked user)</h3>
          {client.userId ? (
            <ul className="mt-3 space-y-2 text-sm">
              {related.deals.length === 0 ? (
                <li className="text-slate-500">No deals for this linked account.</li>
              ) : (
                related.deals.map((d) => (
                  <li key={d.id}>
                    <Link href="/dashboard/deals" className="text-emerald-300 hover:underline">
                      {d.status} · ${(d.priceCents / 100).toLocaleString()}
                    </Link>
                    <span className="block font-mono text-[10px] text-slate-600">{d.listingId ?? d.listingCode ?? "—"}</span>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Link a platform user to see saved deal activity.</p>
          )}
        </section>

        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Appointments</h3>
          <p className="mt-1 text-xs text-slate-500">Visits and meetings linked to this CRM client.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {crmAppointments.length === 0 ? (
              <li className="text-slate-500">No appointments linked.</li>
            ) : (
              crmAppointments.map((a) => (
                <li key={a.id}>
                  <Link href={`/dashboard/appointments/${a.id}`} className="text-emerald-300 hover:underline">
                    {a.title}
                  </Link>
                  <span className="text-slate-500">
                    {" "}
                    · {a.type.replace(/_/g, " ")} · {a.status} · {a.startsAt.toLocaleString()}
                  </span>
                </li>
              ))
            )}
          </ul>
          <Link
            href={`/dashboard/broker/calendar?client=${encodeURIComponent(client.id)}`}
            className="mt-3 inline-block text-xs text-emerald-400/90 hover:underline"
          >
            Open calendar →
          </Link>
        </section>

        <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <h3 className="text-sm font-semibold text-red-200">Danger zone</h3>
          <p className="mt-1 text-xs text-slate-500">Permanently removes this CRM record and its timeline.</p>
          <div className="mt-3">
            <DeleteBrokerClientButton clientId={client.id} />
          </div>
        </section>
      </div>
    </HubLayout>
  );
}
