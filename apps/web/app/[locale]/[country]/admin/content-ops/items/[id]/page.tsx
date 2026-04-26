import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { LegalPacketAppendixSection } from "@/components/admin/LegalPacketAppendixSection";
import { LegalPacketControlStateSection } from "@/components/admin/LegalPacketControlStateSection";
import { LegalPacketEvidenceTimelineSection } from "@/components/admin/LegalPacketEvidenceTimelineSection";
import { LegalPacketHeader } from "@/components/admin/LegalPacketHeader";
import { LegalPacketOverviewSection } from "@/components/admin/LegalPacketOverviewSection";

type Params = { id: string };

export const dynamic = "force-dynamic";

function parseActivityNote(note: string | null, fallbackAction: string | null) {
  if (!note) {
    return { actor: null, detail: fallbackAction ?? "Activity recorded" };
  }

  const match = note.match(/^\[(Admin|Broker|Client|System)\]\s*(.+)$/);
  if (!match) {
    return { actor: null, detail: note };
  }

  return { actor: match[1], detail: match[2] || fallbackAction || "Activity recorded" };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default async function AdminContentPackLegalPacketPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/content-ops");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/admin");

  const { id } = await params;
  const row = await prisma.formSubmission.findFirst({
    where: {
      id,
      formType: "broker_content_pack",
    },
    select: {
      id: true,
      assignedTo: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      payloadJson: true,
      activities: {
        select: {
          id: true,
          action: true,
          note: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!row) notFound();

  const broker = row.assignedTo
    ? await prisma.user.findUnique({
        where: { id: row.assignedTo },
        select: { id: true, name: true, email: true },
      })
    : null;

  const payload = (row.payloadJson ?? {}) as Record<string, unknown>;
  const title = typeof payload.title === "string" ? payload.title : "Saved content pack";
  const listingId = typeof payload.listingId === "string" ? payload.listingId : null;
  const listingTitle = typeof payload.listingTitle === "string" ? payload.listingTitle : null;
  const tone = typeof payload.tone === "string" ? payload.tone : null;
  const output = typeof payload.output === "string" ? payload.output : null;
  const language = typeof payload.language === "string" ? payload.language : null;
  const folder = typeof payload.folder === "string" && payload.folder.trim() ? payload.folder : "General";
  const campaignStatus = typeof payload.campaignStatus === "string" ? payload.campaignStatus : "draft";
  const plannedFor = typeof payload.plannedFor === "string" ? payload.plannedFor : null;
  const reminderHoursBefore = typeof payload.reminderHoursBefore === "number" ? payload.reminderHoursBefore : null;
  const reminderDismissedAt = typeof payload.reminderDismissedAt === "string" ? payload.reminderDismissedAt : null;
  const adminReviewedAt = typeof payload.adminReviewedAt === "string" ? payload.adminReviewedAt : null;
  const adminReviewedBy = typeof payload.adminReviewedBy === "string" ? payload.adminReviewedBy : null;
  const adminReviewNote = typeof payload.adminReviewNote === "string" ? payload.adminReviewNote : null;
  const isFavorite = Boolean(payload.isFavorite);
  const lastUsedAt = typeof payload.lastUsedAt === "string" ? payload.lastUsedAt : null;
  const savedAt = typeof payload.savedAt === "string" ? payload.savedAt : null;
  const tags = Array.isArray(payload.tags) ? payload.tags.filter((tag): tag is string => typeof tag === "string") : [];
  const cards = Array.isArray(payload.cards) ? payload.cards : [];
  const reminderAt =
    plannedFor && reminderHoursBefore != null
      ? new Date(new Date(plannedFor).getTime() - reminderHoursBefore * 60 * 60 * 1000)
      : null;

  const packetData = {
    generatedAt: new Date().toISOString(),
    contentPack: {
      id: row.id,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      savedAt,
      title,
      folder,
      listingId,
      listingTitle,
      tone,
      output,
      language,
      campaignStatus,
      plannedFor,
      reminderHoursBefore,
      reminderAt: reminderAt?.toISOString() ?? null,
      reminderDismissedAt,
      isFavorite,
      lastUsedAt,
      adminReviewedAt,
      adminReviewedBy,
      adminReviewNote,
      assignedTo: row.assignedTo,
    },
    broker: {
      id: broker?.id ?? null,
      name: broker?.name ?? null,
      email: broker?.email ?? null,
    },
    tags,
    cards,
    activityHistory: row.activities.map((activity) => ({
      id: activity.id,
      action: activity.action,
      note: activity.note,
      actor: parseActivityNote(activity.note, activity.action).actor,
      detail: parseActivityNote(activity.note, activity.action).detail,
      createdAt: activity.createdAt.toISOString(),
    })),
    rawPayload: payload,
  };

  const packetJsonHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(packetData, null, 2))}`;
  const packetHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Broker Content Pack Legal Packet ${escapeHtml(row.id)}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #0f172a; color: #e5e7eb; margin: 0; padding: 24px; }
      .wrap { max-width: 1100px; margin: 0 auto; }
      h1, h2 { margin: 0 0 12px; }
      .section { border: 1px solid #334155; background: #111827; border-radius: 16px; padding: 20px; margin-top: 20px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
      .card { border: 1px solid #334155; background: #020617; border-radius: 12px; padding: 14px; }
      .item { border: 1px solid #334155; background: #020617; border-radius: 12px; padding: 14px; margin-top: 12px; }
      .muted { color: #94a3b8; font-size: 12px; }
      .badge { display: inline-block; padding: 4px 8px; border-radius: 999px; background: #1e293b; color: #f8fafc; font-size: 11px; margin-right: 6px; }
      .annotation { border: 1px solid rgba(251, 191, 36, 0.4); background: rgba(245, 158, 11, 0.12); border-radius: 12px; padding: 12px; margin-top: 10px; }
      pre { white-space: pre-wrap; word-break: break-word; color: #e5e7eb; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>Broker Content Pack Legal Packet</h1>
      <p class="muted">Generated ${escapeHtml(new Date(packetData.generatedAt).toLocaleString())}</p>

      <div class="section">
        <h2>Pack Overview</h2>
        <div class="grid">
          <div class="card">
            <div class="muted">Pack</div>
            <div>${escapeHtml(title)}</div>
            <div>${escapeHtml(folder)}</div>
            <div class="muted">Submission ID: ${escapeHtml(row.id)}</div>
          </div>
          <div class="card">
            <div class="muted">Broker and listing</div>
            <div>${escapeHtml(broker?.name || broker?.email || "Unknown broker")}</div>
            <div>${escapeHtml(listingTitle || "No listing title")}</div>
            <div class="muted">Listing ID: ${escapeHtml(listingId || "—")}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Compliance State</h2>
        <div class="grid">
          <div class="card">
            <div class="muted">Scheduling</div>
            <div>Campaign: ${escapeHtml(campaignStatus)}</div>
            <div>Publish: ${escapeHtml(plannedFor || "—")}</div>
            <div>Reminder: ${escapeHtml(reminderAt?.toISOString() || "—")}</div>
            <div>Dismissed: ${escapeHtml(reminderDismissedAt || "—")}</div>
          </div>
          <div class="card">
            <div class="muted">Admin review</div>
            <div>Reviewed at: ${escapeHtml(adminReviewedAt || "Pending")}</div>
            <div>Reviewed by: ${escapeHtml(adminReviewedBy || "—")}</div>
            <div>Favorite: ${escapeHtml(isFavorite ? "Yes" : "No")}</div>
            <div>Last used: ${escapeHtml(lastUsedAt || "—")}</div>
          </div>
        </div>
        ${
          adminReviewNote
            ? `<div class="annotation"><div class="muted">Admin review note</div><pre>${escapeHtml(adminReviewNote)}</pre></div>`
            : ""
        }
      </div>

      <div class="section">
        <h2>Tags and Content Cards</h2>
        <div class="card">
          <div class="muted">Tags</div>
          <div>${tags.length ? tags.map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("") : "No tags"}</div>
        </div>
        ${cards
          .map(
            (card, index) => `<div class="item">
              <div class="muted">Card ${index + 1}</div>
              <pre>${escapeHtml(JSON.stringify(card, null, 2))}</pre>
            </div>`
          )
          .join("")}
      </div>

      <div class="section">
        <h2>Activity History</h2>
        ${packetData.activityHistory.length
          ? packetData.activityHistory
              .map(
                (activity) => `<div class="item">
                  <div><span class="badge">${escapeHtml(activity.actor || "Unknown")}</span> ${escapeHtml(activity.detail)}</div>
                  <div class="muted">${escapeHtml(activity.createdAt)} · ${escapeHtml(activity.action)}</div>
                </div>`
              )
              .join("")
          : '<div class="card">No activity history recorded.</div>'}
      </div>

      <div class="section">
        <h2>Raw Payload Snapshot</h2>
        <pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
      </div>
    </div>
  </body>
</html>`;
  const packetHtmlHref = `data:text/html;charset=utf-8,${encodeURIComponent(packetHtml)}`;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl space-y-6">
        <LegalPacketHeader
          backHref="/admin/content-ops"
          backLabel="← Content ops"
          title="Broker content legal packet"
          description="Full compliance snapshot for one broker content pack, including scheduling, review state, cards, tags, and audit history."
          jsonHref={packetJsonHref}
          jsonDownload={`broker-content-pack-${row.id}-legal-packet.json`}
          htmlHref={packetHtmlHref}
          htmlDownload={`broker-content-pack-${row.id}-legal-packet.html`}
        />

        <LegalPacketOverviewSection
          heading={`Pack overview: ${title}`}
          cards={[
            {
              title: "Pack",
              primary: title,
              secondary: folder,
              meta: [`Submission ID: ${row.id}`, `Status: ${row.status}`],
            },
            {
              title: "Broker and listing",
              primary: broker?.name ?? broker?.email ?? "Unknown broker",
              secondary: broker?.email ?? "No email",
              meta: [`Listing title: ${listingTitle ?? "No listing title"}`, `Listing ID: ${listingId ?? "—"}`],
            },
          ]}
        />

        <LegalPacketControlStateSection
          heading="Compliance State"
          cards={[
            {
              items: [
                `Campaign status: ${campaignStatus}`,
                `Publish at: ${plannedFor ?? "—"}`,
                `Reminder at: ${reminderAt?.toISOString() ?? "—"}`,
                `Reminder dismissed: ${reminderDismissedAt ?? "—"}`,
                `Reminder hours before publish: ${reminderHoursBefore ?? "—"}`,
              ],
            },
            {
              items: [
                `Reviewed at: ${adminReviewedAt ?? "Pending"}`,
                `Reviewed by: ${adminReviewedBy ?? "—"}`,
                `Favorite: ${isFavorite ? "Yes" : "No"}`,
                `Saved at: ${savedAt ?? "—"}`,
                `Last used at: ${lastUsedAt ?? "—"}`,
              ],
            },
          ]}
          annotation={
            adminReviewNote
              ? {
                  label: "Admin review note",
                  body: adminReviewNote,
                }
              : null
          }
        />

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">Tags and Cards</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.length ? (
              tags.map((tag) => (
                <span key={tag} className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs text-slate-300">
                  {tag}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">No tags recorded.</p>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {cards.length ? (
              cards.map((card, index) => (
                <div key={`card-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Card {index + 1}</p>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs text-slate-300">
                    {JSON.stringify(card, null, 2)}
                  </pre>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No content cards recorded.</p>
            )}
          </div>
        </section>

        <LegalPacketEvidenceTimelineSection
          heading="Evidence Timeline"
          emptyText="No activity history recorded."
          items={packetData.activityHistory.map((activity) => ({
            id: activity.id,
            badges: [
              <span key="actor" className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300">
                {activity.actor ?? "Unknown"}
              </span>,
            ],
            timestamp: `${new Date(activity.createdAt).toLocaleString()} · ${activity.action}`,
            body: activity.detail,
          }))}
        />

        <LegalPacketAppendixSection
          heading="Appendix Snapshot"
          content={JSON.stringify(payload, null, 2)}
        />
      </div>
    </main>
  );
}
