import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LeadContactOrigin } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { LegalPacketAppendixSection } from "@/components/admin/LegalPacketAppendixSection";
import { LegalPacketControlStateSection } from "@/components/admin/LegalPacketControlStateSection";
import { LegalPacketEvidenceTimelineSection } from "@/components/admin/LegalPacketEvidenceTimelineSection";
import { LegalPacketHeader } from "@/components/admin/LegalPacketHeader";
import { LegalPacketOverviewSection } from "@/components/admin/LegalPacketOverviewSection";
import { LegalPacketRecordListSection } from "@/components/admin/LegalPacketRecordListSection";
import { getImmoContactRestriction } from "@/lib/immo/immo-contact-enforcement";

type Params = { id: string };

export const dynamic = "force-dynamic";

export default async function AdminImmoContactLegalPacketPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/immocontacts");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: {
      id,
      contactOrigin: LeadContactOrigin.IMMO_CONTACT,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      listingId: true,
      listingCode: true,
      createdAt: true,
      firstPlatformContactAt: true,
      commissionEligible: true,
      commissionSource: true,
      userId: true,
      introducedByBrokerId: true,
      platformConversationId: true,
      deal: {
        select: {
          id: true,
          status: true,
          possibleBypassFlag: true,
          commissionSource: true,
        },
      },
      introducedByBroker: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!lead) notFound();

  const restriction = await getImmoContactRestriction({
    listingId: lead.listingId,
    buyerUserId: lead.userId,
    brokerId: lead.introducedByBrokerId,
    leadId: lead.id,
    conversationId: lead.platformConversationId,
  });

  const logs = await prisma.immoContactLog.findMany({
    where: {
      OR: [
        { metadata: { path: ["leadId"], equals: lead.id } },
        ...(lead.listingId ? [{ listingId: lead.listingId }] : []),
        ...(lead.userId ? [{ userId: lead.userId }] : []),
        ...(lead.introducedByBrokerId ? [{ brokerId: lead.introducedByBrokerId }] : []),
      ],
    },
    orderBy: { actionAt: "desc" },
    take: 50,
    select: {
      id: true,
      contactType: true,
      hub: true,
      actionAt: true,
      adminNote: true,
      metadata: true,
    },
  });

  const evidenceRows = logs.map((log) => {
    const metadata = log.metadata && typeof log.metadata === "object" ? (log.metadata as Record<string, unknown>) : {};
    return {
      id: log.id,
      eventType: typeof metadata.eventType === "string" ? metadata.eventType : log.contactType,
      actionType: typeof metadata.actionType === "string" ? metadata.actionType : null,
      reasonCode: typeof metadata.reasonCode === "string" ? metadata.reasonCode : null,
      note: typeof metadata.note === "string" ? metadata.note : null,
      actorAdminId: typeof metadata.actorAdminId === "string" ? metadata.actorAdminId : null,
      adminNote: log.adminNote,
      hub: log.hub,
      actionAt: log.actionAt,
    };
  });

  const conversationMessages = lead.platformConversationId
    ? await prisma.message.findMany({
        where: {
          conversationId: lead.platformConversationId,
          deletedAt: null,
        },
        orderBy: { createdAt: "asc" },
        take: 100,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    : [];
  const conversationEvents = lead.platformConversationId
    ? await prisma.messageEvent.findMany({
        where: {
          conversationId: lead.platformConversationId,
        },
        orderBy: { createdAt: "asc" },
        take: 100,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    : [];
  const packetData = {
    generatedAt: new Date().toISOString(),
    lead: {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      userId: lead.userId,
      listingId: lead.listingId,
      listingCode: lead.listingCode,
      firstPlatformContactAt: lead.firstPlatformContactAt?.toISOString() ?? null,
      createdAt: lead.createdAt.toISOString(),
      platformConversationId: lead.platformConversationId,
    },
    broker: {
      id: lead.introducedByBroker?.id ?? null,
      name: lead.introducedByBroker?.name ?? null,
      email: lead.introducedByBroker?.email ?? null,
    },
    deal: lead.deal
      ? {
          id: lead.deal.id,
          status: lead.deal.status,
          possibleBypassFlag: lead.deal.possibleBypassFlag,
          commissionSource: lead.deal.commissionSource,
        }
      : null,
    commission: {
      eligible: lead.commissionEligible,
      source: lead.commissionSource,
    },
    restriction,
    evidenceTimeline: evidenceRows.map((row) => ({
      ...row,
      actionAt: row.actionAt.toISOString(),
    })),
    conversationMessages: conversationMessages.map((message) => ({
      id: message.id,
      messageType: message.messageType,
      body: message.body,
      senderId: message.senderId,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        email: message.sender.email,
      },
      createdAt: message.createdAt.toISOString(),
      editedAt: message.editedAt?.toISOString() ?? null,
    })),
    conversationEvents: conversationEvents.map((event) => ({
      id: event.id,
      type: event.type,
      actorId: event.actorId,
      actor: event.actor
        ? {
            id: event.actor.id,
            name: event.actor.name,
            email: event.actor.email,
          }
        : null,
      messageId: event.messageId,
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
    })),
  };
  const packetJsonHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(packetData, null, 2))}`;
  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  const packetHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>ImmoContact Legal Packet ${escapeHtml(lead.id)}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #0f172a; color: #e5e7eb; margin: 0; padding: 24px; }
      .wrap { max-width: 1100px; margin: 0 auto; }
      h1, h2 { margin: 0 0 12px; }
      .section { border: 1px solid #334155; background: #111827; border-radius: 16px; padding: 20px; margin-top: 20px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
      .card { border: 1px solid #334155; background: #020617; border-radius: 12px; padding: 14px; }
      .muted { color: #94a3b8; font-size: 12px; }
      .badge { display: inline-block; padding: 4px 8px; border-radius: 999px; background: #1e293b; color: #f8fafc; font-size: 11px; margin-right: 6px; }
      .item { border: 1px solid #334155; background: #020617; border-radius: 12px; padding: 14px; margin-top: 12px; }
      .annotation { border: 1px solid rgba(251, 191, 36, 0.4); background: rgba(245, 158, 11, 0.12); border-radius: 12px; padding: 12px; margin-top: 10px; }
      .annotation-label { color: #fde68a; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; }
      pre { white-space: pre-wrap; word-break: break-word; color: #e5e7eb; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>ImmoContact Legal Packet</h1>
      <p class="muted">Generated ${escapeHtml(new Date(packetData.generatedAt).toLocaleString())}</p>

      <div class="section">
        <h2>Lead Overview</h2>
        <div class="grid">
          <div class="card">
            <div class="muted">Lead</div>
            <div>${escapeHtml(lead.name)}</div>
            <div>${escapeHtml(lead.email || "No email")}</div>
            <div>${escapeHtml(lead.phone || "No phone")}</div>
            <div class="muted">Lead ID: ${escapeHtml(lead.id)}</div>
          </div>
          <div class="card">
            <div class="muted">Listing and broker</div>
            <div>${escapeHtml(lead.listingCode || lead.listingId || "No listing reference")}</div>
            <div>${escapeHtml(lead.introducedByBroker?.name || lead.introducedByBroker?.email || "No broker linked")}</div>
            <div class="muted">Conversation ID: ${escapeHtml(lead.platformConversationId || "—")}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Restriction State</h2>
        <pre>${escapeHtml(JSON.stringify(restriction, null, 2))}</pre>
      </div>

      <div class="section">
        <h2>Evidence Timeline</h2>
        ${packetData.evidenceTimeline
          .map(
            (row) => `<div class="item">
              <div><span class="badge">${escapeHtml(row.eventType)}</span>${row.actionType ? `<span class="badge">${escapeHtml(row.actionType)}</span>` : ""}${row.reasonCode ? `<span class="badge">${escapeHtml(row.reasonCode)}</span>` : ""}</div>
              <div class="muted">${escapeHtml(new Date(row.actionAt).toLocaleString())}</div>
              <pre>${escapeHtml(row.note || "No event note")}</pre>
              ${
                row.adminNote
                  ? `<div class="annotation"><div class="annotation-label">Admin annotation</div><pre>${escapeHtml(row.adminNote)}</pre></div>`
                  : ""
              }
            </div>`
          )
          .join("") || "<p>No evidence rows found.</p>"}
      </div>

      <div class="section">
        <h2>Conversation Messages</h2>
        ${packetData.conversationMessages
          .map(
            (message) => `<div class="item">
              <div><span class="badge">${escapeHtml(message.messageType)}</span></div>
              <div class="muted">${escapeHtml(new Date(message.createdAt).toLocaleString())}</div>
              <pre>${escapeHtml(message.body)}</pre>
              <div class="muted">Sender: ${escapeHtml(message.sender.name || message.sender.email || message.senderId)}</div>
            </div>`
          )
          .join("") || "<p>No conversation messages found.</p>"}
      </div>

      <div class="section">
        <h2>Conversation Events</h2>
        ${packetData.conversationEvents
          .map(
            (event) => `<div class="item">
              <div><span class="badge">${escapeHtml(event.type)}</span></div>
              <div class="muted">${escapeHtml(new Date(event.createdAt).toLocaleString())}</div>
              <div class="muted">Actor: ${escapeHtml(event.actor?.name || event.actor?.email || event.actorId || "system")}</div>
              ${
                event.metadata &&
                typeof event.metadata === "object" &&
                typeof (event.metadata as Record<string, unknown>).note === "string"
                  ? `<div class="annotation"><div class="annotation-label">Event note</div><pre>${escapeHtml((event.metadata as Record<string, unknown>).note as string)}</pre></div>`
                  : ""
              }
              <pre>${escapeHtml(JSON.stringify(event.metadata ?? {}, null, 2))}</pre>
            </div>`
          )
          .join("") || "<p>No conversation events found.</p>"}
      </div>
    </div>
  </body>
</html>`;
  const packetHtmlHref = `data:text/html;charset=utf-8,${encodeURIComponent(packetHtml)}`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <LegalPacketHeader
          backHref="/admin/immocontacts"
          backLabel="← ImmoContact admin"
          title="ImmoContact legal packet"
          description="Single-case printable record for one ImmoContact lead, including legal controls, evidence timeline, and conversation chronology."
          jsonHref={packetJsonHref}
          jsonDownload={`immo-contact-${lead.id.slice(0, 12)}-full-packet.json`}
          htmlHref={packetHtmlHref}
          htmlDownload={`immo-contact-${lead.id.slice(0, 12)}-full-packet.html`}
        />

        <LegalPacketOverviewSection
          heading={`Lead overview: ${lead.name}`}
          cards={[
            {
              title: "Contact identity",
              primary: lead.email || "No email",
              secondary: lead.phone || "No phone",
              meta: [
                `Lead ID: ${lead.id}`,
                `Buyer user ID: ${lead.userId ?? "—"}`,
                `First platform contact: ${new Date(lead.firstPlatformContactAt ?? lead.createdAt).toLocaleString()}`,
              ],
            },
            {
              title: "Listing and broker",
              primary: lead.listingCode || lead.listingId || "No listing reference",
              secondary: lead.introducedByBroker?.name || lead.introducedByBroker?.email || "No broker linked",
              meta: [`Conversation ID: ${lead.platformConversationId ?? "—"}`],
            },
            {
              title: "Commission tracking",
              primary: `Eligible: ${lead.commissionEligible ? "Yes" : "No"}`,
              secondary: `Source: ${lead.commissionSource || "—"}`,
            },
            {
              title: "Deal linkage",
              primary: lead.deal ? `${lead.deal.id} · ${lead.deal.status}` : "No linked deal",
              secondary: `Possible bypass: ${lead.deal?.possibleBypassFlag ? "Yes" : "No"}`,
              meta: [`Deal commission source: ${lead.deal?.commissionSource || "—"}`],
            },
          ]}
        />

        <LegalPacketControlStateSection
          heading="Control State"
          cards={[
            {
              items: [
                `Restriction blocked: ${restriction.blocked ? "Yes" : "No"}`,
                `Reason count: ${restriction.reasons.length}`,
                `Conversation linked: ${lead.platformConversationId ? "Yes" : "No"}`,
              ],
            },
            {
              items: [
                `Commission eligible: ${lead.commissionEligible ? "Yes" : "No"}`,
                `Commission source: ${lead.commissionSource || "—"}`,
                `Deal linked: ${lead.deal ? "Yes" : "No"}`,
              ],
            },
          ]}
          annotation={{
            label: restriction.blocked ? "Restriction reasons" : "Restriction state",
            body: restriction.blocked
              ? restriction.reasons.join("\n")
              : "No active restriction is currently blocking this ImmoContact path.",
          }}
        />

        <LegalPacketEvidenceTimelineSection
          heading="Evidence Timeline"
          emptyText="No related audit events found."
          items={evidenceRows.map((row) => ({
            id: row.id,
            badges: [
              <span key="eventType" className="rounded bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                {row.eventType}
              </span>,
              ...(row.actionType
                ? [
                    <span key="actionType" className="rounded bg-rose-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-rose-200">
                      {row.actionType}
                    </span>,
                  ]
                : []),
              ...(row.reasonCode
                ? [
                    <span key="reasonCode" className="rounded bg-amber-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-amber-200">
                      {row.reasonCode}
                    </span>,
                  ]
                : []),
            ],
            timestamp: row.actionAt.toLocaleString(),
            body: row.note || "No event note",
            annotation: row.adminNote
              ? {
                  label: "Admin annotation",
                  body: row.adminNote,
                }
              : null,
            footer: `Hub: ${row.hub || "unknown"} · Admin actor: ${row.actorAdminId || "—"}`,
          }))}
        />

        <LegalPacketRecordListSection
          heading="Conversation chronology"
          emptyText={
            !lead.platformConversationId
              ? "No platform conversation is linked to this lead."
              : conversationMessages.length === 0
                ? `Conversation ${lead.platformConversationId} exists, but no active messages were found.`
                : "No conversation messages found."
          }
          items={
            lead.platformConversationId
              ? conversationMessages.map((message) => ({
                  id: message.id,
                  badges: [
                    <span key="messageType" className="rounded bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                      {message.messageType}
                    </span>,
                  ],
                  title: message.createdAt.toLocaleString(),
                  body: message.body,
                  footer: `Sender: ${message.sender.name || message.sender.email || message.senderId} · Sender ID: ${message.senderId}`,
                  extra: message.editedAt ? (
                    <div className="text-xs text-amber-200">Edited: {message.editedAt.toLocaleString()}</div>
                  ) : null,
                }))
              : []
          }
        />

        <LegalPacketRecordListSection
          heading="Conversation event chronology"
          emptyText={
            !lead.platformConversationId
              ? "No platform conversation is linked to this lead."
              : conversationEvents.length === 0
                ? `Conversation ${lead.platformConversationId} has no recorded message events.`
                : "No conversation events found."
          }
          items={
            lead.platformConversationId
              ? conversationEvents.map((event) => ({
                  id: event.id,
                  badges: [
                    <span key="type" className="rounded bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                      {event.type}
                    </span>,
                  ],
                  title: event.createdAt.toLocaleString(),
                  body: `Actor: ${event.actor?.name || event.actor?.email || event.actorId || "system"}`,
                  footer: event.messageId ? `Message ID: ${event.messageId}` : undefined,
                  extra: (
                    <>
                      {event.metadata &&
                      typeof event.metadata === "object" &&
                      typeof (event.metadata as Record<string, unknown>).note === "string" ? (
                        <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">Event note</p>
                          <p className="mt-1 text-sm text-amber-100">
                            {(event.metadata as Record<string, unknown>).note as string}
                          </p>
                        </div>
                      ) : null}
                      {event.metadata && typeof event.metadata === "object" ? (
                        <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-800 bg-black/30 p-3 text-[11px] text-slate-300">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      ) : null}
                    </>
                  ),
                }))
              : []
          }
        />

        <LegalPacketAppendixSection
          heading="Appendix Snapshot"
          content={JSON.stringify(
            {
              restriction,
              lead: packetData.lead,
              broker: packetData.broker,
              deal: packetData.deal,
            },
            null,
            2
          )}
        />
      </div>
    </main>
  );
}
