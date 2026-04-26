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
import { LegalPacketRecordListSection } from "@/components/admin/LegalPacketRecordListSection";
import { getRequirementsForListingId } from "@/lib/bnhub/verification";

type Params = { id: string };

export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default async function AdminModerationLegalPacketPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/moderation");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/admin");

  const { id } = await params;
  const packed = await getRequirementsForListingId(id);
  if (!packed) notFound();

  const listing = await prisma.shortTermListing.findUnique({
    where: { id },
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      address: true,
      country: true,
      listingAuthorityType: true,
      submittedForVerificationAt: true,
      rejectionReason: true,
      verificationStatus: true,
      listingStatus: true,
      nightPriceCents: true,
      verificationDocUrl: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      _count: {
        select: {
          reviews: true,
          bookings: true,
        },
      },
      verificationLogs: {
        select: {
          id: true,
          step: true,
          status: true,
          notes: true,
          createdBy: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!listing) notFound();

  const packetData = {
    generatedAt: new Date().toISOString(),
    listing: {
      id: listing.id,
      listingCode: listing.listingCode,
      title: listing.title,
      city: listing.city,
      address: listing.address,
      country: listing.country,
      authorityType: listing.listingAuthorityType,
      verificationStatus: listing.verificationStatus,
      listingStatus: listing.listingStatus,
      submittedForVerificationAt: listing.submittedForVerificationAt?.toISOString() ?? null,
      rejectionReason: listing.rejectionReason,
      verificationDocUrl: listing.verificationDocUrl,
      nightPriceCents: listing.nightPriceCents,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    },
    host: {
      id: listing.owner.id,
      name: listing.owner.name,
      email: listing.owner.email,
      phone: listing.owner.phone,
    },
    demandSignals: {
      reviews: listing._count.reviews,
      bookings: listing._count.bookings,
    },
    requirements: packed.requirements,
    verificationLogs: listing.verificationLogs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
  };

  const packetJsonHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(packetData, null, 2))}`;
  const packetHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>BNHUB Moderation Legal Packet ${escapeHtml(listing.id)}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #0f172a; color: #e5e7eb; margin: 0; padding: 24px; }
      .wrap { max-width: 1100px; margin: 0 auto; }
      h1, h2 { margin: 0 0 12px; }
      .section { border: 1px solid #334155; background: #111827; border-radius: 16px; padding: 20px; margin-top: 20px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
      .card { border: 1px solid #334155; background: #020617; border-radius: 12px; padding: 14px; }
      .item { border: 1px solid #334155; background: #020617; border-radius: 12px; padding: 14px; margin-top: 12px; }
      .muted { color: #94a3b8; font-size: 12px; }
      .annotation { border: 1px solid rgba(251, 191, 36, 0.4); background: rgba(245, 158, 11, 0.12); border-radius: 12px; padding: 12px; margin-top: 10px; }
      .badge { display: inline-block; padding: 4px 8px; border-radius: 999px; background: #1e293b; color: #f8fafc; font-size: 11px; margin-right: 6px; }
      pre { white-space: pre-wrap; word-break: break-word; color: #e5e7eb; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>BNHUB Moderation Legal Packet</h1>
      <p class="muted">Generated ${escapeHtml(new Date(packetData.generatedAt).toLocaleString())}</p>

      <div class="section">
        <h2>Listing Overview</h2>
        <div class="grid">
          <div class="card">
            <div class="muted">Listing</div>
            <div>${escapeHtml(listing.title)}</div>
            <div>${escapeHtml(listing.listingCode)}</div>
            <div class="muted">Listing ID: ${escapeHtml(listing.id)}</div>
          </div>
          <div class="card">
            <div class="muted">Host</div>
            <div>${escapeHtml(listing.owner.name || listing.owner.email)}</div>
            <div>${escapeHtml(listing.owner.email)}</div>
            <div class="muted">${escapeHtml(listing.owner.phone || "No phone")}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Control State</h2>
        <div class="grid">
          <div class="card">
            <div class="muted">Verification</div>
            <div>Status: ${escapeHtml(listing.verificationStatus)}</div>
            <div>Listing status: ${escapeHtml(listing.listingStatus)}</div>
            <div>Authority: ${escapeHtml(listing.listingAuthorityType || "OWNER")}</div>
            <div>Submitted: ${escapeHtml(listing.submittedForVerificationAt?.toISOString() || "—")}</div>
          </div>
          <div class="card">
            <div class="muted">Commercial context</div>
            <div>Night price: $${escapeHtml((listing.nightPriceCents / 100).toFixed(2))}</div>
            <div>Reviews: ${escapeHtml(String(listing._count.reviews))}</div>
            <div>Bookings: ${escapeHtml(String(listing._count.bookings))}</div>
            <div>Verification doc: ${escapeHtml(listing.verificationDocUrl || "—")}</div>
          </div>
        </div>
        ${
          listing.rejectionReason
            ? `<div class="annotation"><div class="muted">Rejection reason</div><pre>${escapeHtml(listing.rejectionReason)}</pre></div>`
            : ""
        }
      </div>

      <div class="section">
        <h2>Requirement Checklist</h2>
        ${packed.requirements
          .map(
            (requirement) => `<div class="item">
              <div><span class="badge">${escapeHtml(requirement.status)}</span> ${escapeHtml(requirement.label)}</div>
              <div class="muted">${escapeHtml(requirement.hint || "No additional note")}</div>
            </div>`
          )
          .join("")}
      </div>

      <div class="section">
        <h2>Verification Evidence Timeline</h2>
        ${listing.verificationLogs.length
          ? listing.verificationLogs
              .map(
                (log) => `<div class="item">
                  <div><span class="badge">${escapeHtml(log.step)}</span> ${escapeHtml(log.status)}</div>
                  <div class="muted">${escapeHtml(log.createdAt.toISOString())} · actor ${escapeHtml(log.createdBy || "system")}</div>
                  <pre>${escapeHtml(log.notes || "No note.")}</pre>
                </div>`
              )
              .join("")
          : '<div class="card">No verification logs recorded.</div>'}
      </div>
    </div>
  </body>
</html>`;
  const packetHtmlHref = `data:text/html;charset=utf-8,${encodeURIComponent(packetHtml)}`;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl space-y-6">
        <LegalPacketHeader
          backHref="/admin/moderation"
          backLabel="← Moderation queue"
          title="Moderation legal packet"
          description="Single-case printable record for one BNHUB listing verification review, including checklist state and evidence logs."
          jsonHref={packetJsonHref}
          jsonDownload={`bnhub-moderation-${listing.id}-legal-packet.json`}
          htmlHref={packetHtmlHref}
          htmlDownload={`bnhub-moderation-${listing.id}-legal-packet.html`}
        />

        <LegalPacketOverviewSection
          heading={`Listing overview: ${listing.title}`}
          cards={[
            {
              title: "Listing",
              primary: listing.title,
              secondary: listing.listingCode,
              meta: [
                `Listing ID: ${listing.id}`,
                `${listing.city}, ${listing.address}, ${listing.country}`,
              ],
            },
            {
              title: "Host",
              primary: listing.owner.name ?? listing.owner.email,
              secondary: listing.owner.email,
              meta: [listing.owner.phone ?? "No phone"],
            },
          ]}
        />

        <LegalPacketControlStateSection
          heading="Control State"
          cards={[
            {
              items: [
                `Verification status: ${listing.verificationStatus}`,
                `Listing status: ${listing.listingStatus}`,
                `Authority type: ${listing.listingAuthorityType ?? "OWNER"}`,
                `Submitted: ${listing.submittedForVerificationAt ? listing.submittedForVerificationAt.toLocaleString() : "—"}`,
              ],
            },
            {
              items: [
                `Night price: $${(listing.nightPriceCents / 100).toFixed(2)}`,
                `Reviews: ${listing._count.reviews}`,
                `Bookings: ${listing._count.bookings}`,
                `Verification doc: ${listing.verificationDocUrl ?? "—"}`,
              ],
            },
          ]}
          annotation={
            listing.rejectionReason
              ? {
                  label: "Rejection reason",
                  body: listing.rejectionReason,
                }
              : null
          }
        />

        <LegalPacketRecordListSection
          heading="Requirement Checklist"
          emptyText="No checklist requirements recorded."
          items={packed.requirements.map((requirement) => ({
            id: requirement.key,
            badges: [
              <span key="status" className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300">
                {requirement.status}
              </span>,
            ],
            title: requirement.label,
            body: requirement.hint ?? "No additional note.",
          }))}
        />

        <LegalPacketEvidenceTimelineSection
          heading="Evidence Timeline"
          emptyText="No verification logs recorded."
          items={listing.verificationLogs.map((log) => ({
            id: log.id,
            badges: [
              <span key="step" className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300">
                {log.step}
              </span>,
            ],
            timestamp: `${log.createdAt.toLocaleString()} · actor ${log.createdBy ?? "system"}`,
            body: log.notes ?? "No note.",
            footer: log.status,
          }))}
        />

        <LegalPacketAppendixSection
          heading="Appendix Snapshot"
          content={JSON.stringify(
            {
              listing: packetData.listing,
              host: packetData.host,
              requirements: packetData.requirements,
            },
            null,
            2
          )}
        />
      </div>
    </main>
  );
}
