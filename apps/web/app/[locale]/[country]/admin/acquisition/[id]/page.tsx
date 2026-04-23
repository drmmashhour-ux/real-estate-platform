import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@repo/db";
import { AcquisitionLeadReviewClient } from "./review-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAcquisitionLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.listingAcquisitionLead.findUnique({
    where: { id },
    include: {
      linkedFsboListing: {
        select: {
          id: true,
          listingCode: true,
          status: true,
          moderationStatus: true,
          supplyPublicationStage: true,
        },
      },
      linkedShortTermListing: { select: { id: true, listingCode: true, listingStatus: true, title: true, city: true } },
    },
  });
  if (!lead) notFound();

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/acquisition" className="text-sm text-[#D4AF37] hover:underline">
          ← Acquisition board
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-[#D4AF37]">{lead.contactName}</h1>
        <p className="text-sm text-white/55">
          {lead.contactEmail}
          {lead.contactPhone ? ` · ${lead.contactPhone}` : ""}
        </p>
        <p className="mt-2 text-sm text-white/60">
          {lead.sourceType} · {lead.city} · {lead.propertyCategory}
        </p>
        <p className="mt-1 text-xs text-white/40">
          Permission: {lead.permissionStatus} · Intake: {lead.intakeStatus}
        </p>
        {lead.sourcePlatformText ? (
          <p className="mt-4 rounded border border-white/10 bg-black/30 p-3 text-sm text-white/70">
            <span className="text-white/45">Internal source note:</span> {lead.sourcePlatformText}
          </p>
        ) : null}
        {lead.description ? (
          <div className="mt-4">
            <h2 className="text-sm font-medium text-white/80">Description</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-white/70">{lead.description}</p>
          </div>
        ) : null}
        {lead.notes ? (
          <div className="mt-4">
            <h2 className="text-sm font-medium text-white/80">Ops notes</h2>
            <p className="mt-1 text-sm text-white/70">{lead.notes}</p>
          </div>
        ) : null}

        <section className="mt-8 rounded border border-amber-500/25 bg-amber-500/5 p-4">
          <h2 className="text-sm font-semibold text-amber-200">Pre-publish checklist</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-100/90">
            <li>Permission confirmed (rights-holder or authorized agent/host)</li>
            <li>Description reviewed — rewritten, factual, not copied from third-party sites</li>
            <li>Images approved — submitted or licensed; placeholders only in test/demo</li>
            <li>Core fields, category, monetization path (FSBO / broker CRM / BNHUB) correct</li>
          </ul>
        </section>

        <AcquisitionLeadReviewClient
          leadId={lead.id}
          fsboId={lead.linkedFsboListing?.id ?? null}
          fsboCode={lead.linkedFsboListing?.listingCode ?? null}
        />
      </div>
    </div>
  );
}
