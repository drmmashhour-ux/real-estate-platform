import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { LegalPacketAppendixSection } from "@/components/admin/LegalPacketAppendixSection";
import { LegalPacketControlStateSection } from "@/components/admin/LegalPacketControlStateSection";
import { LegalPacketHeader } from "@/components/admin/LegalPacketHeader";
import { LegalPacketOverviewSection } from "@/components/admin/LegalPacketOverviewSection";
import { LegalPacketRecordListSection } from "@/components/admin/LegalPacketRecordListSection";
import { getSellHubLegalChecklist } from "@/lib/fsbo/sell-hub-legal-checklist";
import { getQuebecComplianceAdminView } from "@/modules/legal/compliance/listing-publish-compliance.service";
import { QuebecComplianceChecklistCard } from "@/components/legal/compliance/QuebecComplianceChecklistCard";
import { brokerAiFlags } from "@/config/feature-flags";
import { CertificateOfLocationHelperPanel } from "@/components/broker-ai/CertificateOfLocationHelperPanel";
import { getCertificateOfLocationBlockerImpact } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-blocker.service";
import { loadCertificateOfLocationPresentation } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-view-model.service";
import { getListingTransactionFlag } from "@/lib/fsbo/listing-transaction-flag";
import { ListingTransactionFlag } from "@/components/listings/ListingTransactionFlag";

export const dynamic = "force-dynamic";

export default async function AdminFsboLegalChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?returnUrl=${encodeURIComponent(`/admin/fsbo/${id}`)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") redirect("/");

  const checklist = await getSellHubLegalChecklist(id);
  if (!checklist) notFound();
  const qcAdmin = await getQuebecComplianceAdminView(id);
  const cl = qcAdmin.checklist;
  const qcCardModel =
    qcAdmin.decision && cl ?
      {
        readinessScore: qcAdmin.decision.readinessScore,
        allowed: qcAdmin.decision.allowed,
        blockingIssueIds: qcAdmin.decision.blockingIssues,
        checklistSummary: cl.items.map((item) => {
          const res = cl.results.find((r) => r.itemId === item.id);
          return {
            itemId: item.id,
            passed: res?.passed ?? false,
            label: item.label,
            severity: item.severity,
            blocking: item.blocking,
          };
        }),
      }
    : null;
  const transactionFlag = await getListingTransactionFlag(id);
  const certificateCol =
    brokerAiFlags.brokerAiCertificateOfLocationV1
      ? await loadCertificateOfLocationPresentation({ listingId: id, brokerFlow: true })
      : null;
  const packetData = {
    generatedAt: new Date().toISOString(),
    checklist,
    transactionFlag,
  };
  const packetJsonHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(packetData, null, 2))}`;
  const packetHtmlHref = `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>FSBO Legal Packet ${checklist.listingId}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #0f172a; color: #e5e7eb; margin: 0; padding: 24px; }
      .wrap { max-width: 1100px; margin: 0 auto; }
      .section { border: 1px solid #334155; background: #111827; border-radius: 16px; padding: 20px; margin-top: 20px; }
      .card { border: 1px solid #334155; background: #020617; border-radius: 12px; padding: 14px; margin-top: 12px; }
      pre { white-space: pre-wrap; word-break: break-word; color: #e5e7eb; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>FSBO Legal Packet</h1>
      <div class="section"><pre>${JSON.stringify(packetData, null, 2)}</pre></div>
    </div>
  </body>
</html>`)}`;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <LegalPacketHeader
          backHref="/admin/fsbo"
          backLabel="← FSBO admin"
          title="FSBO legal packet"
          description="Single-case printable record for one Sell Hub listing, including owner authority, declaration readiness, evidence, and publish approval."
          jsonHref={packetJsonHref}
          jsonDownload={`fsbo-${checklist.listingId}-legal-packet.json`}
          htmlHref={packetHtmlHref}
          htmlDownload={`fsbo-${checklist.listingId}-legal-packet.html`}
        />

        <QuebecComplianceChecklistCard model={qcCardModel} />

        {certificateCol ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/90">
              Broker AI helper — certificate of location
            </p>
            <div className="mt-4">
              <CertificateOfLocationHelperPanel
                listingId={id}
                viewModel={certificateCol.viewModel}
                blockerImpact={getCertificateOfLocationBlockerImpact(certificateCol.summary)}
              />
            </div>
          </div>
        ) : null}

        <LegalPacketOverviewSection
          heading={`Listing overview: ${checklist.title}`}
          cards={[
            {
              title: "Listing",
              primary: checklist.title,
              secondary: checklist.listingCode ?? checklist.listingId,
              meta: [`Listing ID: ${checklist.listingId}`],
            },
            {
              title: "Owner",
              primary: checklist.ownerName ?? "Unknown",
              secondary: checklist.ownerEmail,
              meta: [
                `Owner type: ${checklist.ownerType}`,
                transactionFlag ? `Transaction flag: ${transactionFlag.label}` : "Transaction flag: none",
              ],
            },
          ]}
        />

        <LegalPacketControlStateSection
          heading="Control State"
          cards={[
            {
              items: [
                `Publish ready: ${checklist.publishReady ? "Yes" : "No"}`,
                `Declaration complete: ${checklist.declarationComplete ? "Yes" : "No"}`,
                `Broker verified: ${checklist.brokerVerified ? "Yes" : "No"}`,
                `Owner type: ${checklist.ownerType}`,
              ],
            },
            {
              items: [
                `Checklist pass: ${checklist.counts.pass}`,
                `Checklist warning: ${checklist.counts.warning}`,
                `Checklist block: ${checklist.counts.block}`,
                `Supporting evidence: ${checklist.supportingSummary.total} total / ${checklist.supportingSummary.approved} approved / ${checklist.supportingSummary.pending} pending / ${checklist.supportingSummary.rejected} rejected`,
              ],
            },
          ]}
          annotation={
            checklist.blockingReasons.length
              ? {
                  label: "Blocking reasons",
                  body: checklist.blockingReasons.join("\n"),
                }
              : null
          }
        />

        <LegalPacketRecordListSection
          heading="Requirement Checklist"
          emptyText="No checklist items recorded."
          items={checklist.items.map((item) => ({
            id: item.key,
            badges: [
              <span key="status" className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300">
                {item.status}
              </span>,
            ],
            title: item.label,
            body: item.detail,
          }))}
        />

        <LegalPacketRecordListSection
          heading="Risk and Evidence Signals"
          emptyText="No risk alerts or declaration gaps recorded."
          items={[
            ...checklist.riskAlerts.map((alert, index) => ({
              id: `risk-${index}`,
              badges: [
                <span key="severity" className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300">
                  {alert.severity}
                </span>,
              ],
              title: "Risk alert",
              body: alert.message,
            })),
            ...checklist.missingDeclarationSections.map((section) => ({
              id: `missing-${section}`,
              badges: [
                <span key="missing" className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-200">
                  missing declaration
                </span>,
              ],
              title: section,
            })),
            ...checklist.requiredDocumentMissing.map((doc) => ({
              id: `doc-${doc}`,
              badges: [
                <span key="doc" className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] text-rose-200">
                  required document
                </span>,
              ],
              title: doc,
            })),
          ]}
        />

        <div className="print:hidden flex flex-wrap gap-3 text-sm">
          <Link href={`/admin/fsbo/${id}/edit`} className="rounded-full border border-white/10 px-4 py-2 text-slate-200 hover:border-amber-400/40 hover:text-white">
            Edit listing
          </Link>
          <Link href={`/sell/${id}`} className="rounded-full border border-white/10 px-4 py-2 text-slate-200 hover:border-amber-400/40 hover:text-white">
            Public view
          </Link>
          <Link
            href={`/api/admin/fsbo/${id}/export`}
            target="_blank"
            className="rounded-full border border-white/10 px-4 py-2 text-slate-200 hover:border-amber-400/40 hover:text-white"
          >
            Open compliance export
          </Link>
        </div>

        <LegalPacketAppendixSection
          heading="Appendix Snapshot"
          content={JSON.stringify(packetData, null, 2)}
        />
      </div>
    </main>
  );
}
