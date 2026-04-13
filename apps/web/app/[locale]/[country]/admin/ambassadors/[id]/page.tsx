import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { LegalPacketAppendixSection } from "@/components/admin/LegalPacketAppendixSection";
import { LegalPacketControlStateSection } from "@/components/admin/LegalPacketControlStateSection";
import { LegalPacketEvidenceTimelineSection } from "@/components/admin/LegalPacketEvidenceTimelineSection";
import { LegalPacketHeader } from "@/components/admin/LegalPacketHeader";
import { LegalPacketOverviewSection } from "@/components/admin/LegalPacketOverviewSection";
import { LegalPacketRecordListSection } from "@/components/admin/LegalPacketRecordListSection";

export const dynamic = "force-dynamic";

export default async function AdminAmbassadorLegalPacketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewerId = await getGuestId();
  if (!viewerId) redirect("/auth/login?next=/admin/ambassadors");

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN") redirect("/admin");

  const { id } = await params;
  const ambassador = await prisma.ambassador.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      isActive: true,
      commission: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      commissions: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          amount: true,
          sourceType: true,
          sourceId: true,
          createdAt: true,
        },
      },
      payouts: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });
  if (!ambassador) notFound();

  const totalCommissions = ambassador.commissions.reduce((sum, row) => sum + row.amount, 0);
  const pendingPayouts = ambassador.payouts.filter((row) => row.status !== "paid");
  const packetData = {
    generatedAt: new Date().toISOString(),
    ambassador: {
      id: ambassador.id,
      userId: ambassador.userId,
      isActive: ambassador.isActive,
      commission: ambassador.commission,
      createdAt: ambassador.createdAt.toISOString(),
      user: ambassador.user,
    },
    commissions: ambassador.commissions.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    payouts: ambassador.payouts.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
  };
  const packetJsonHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(packetData, null, 2))}`;
  const packetHtmlHref = `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Ambassador Legal Packet ${ambassador.id}</title></head>
  <body style="font-family:Arial,sans-serif;background:#0f172a;color:#e5e7eb;padding:24px;">
    <h1>Ambassador Legal Packet</h1>
    <pre>${JSON.stringify(packetData, null, 2)}</pre>
  </body>
</html>`)}`;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <LegalPacketHeader
          backHref="/admin/ambassadors"
          backLabel="← Ambassador management"
          title="Ambassador legal packet"
          description="Single-case printable record for one ambassador, including commission settings, earned commissions, and payout traceability."
          jsonHref={packetJsonHref}
          jsonDownload={`ambassador-${ambassador.id}-legal-packet.json`}
          htmlHref={packetHtmlHref}
          htmlDownload={`ambassador-${ambassador.id}-legal-packet.html`}
        />

        <LegalPacketOverviewSection
          heading={`Ambassador overview: ${ambassador.user.name ?? ambassador.user.email}`}
          cards={[
            {
              title: "Ambassador",
              primary: ambassador.user.name ?? ambassador.user.email,
              secondary: ambassador.user.email,
              meta: [`Ambassador ID: ${ambassador.id}`, `User ID: ${ambassador.userId}`],
            },
            {
              title: "Program terms",
              primary: `${(ambassador.commission * 100).toFixed(0)}% commission`,
              secondary: ambassador.isActive ? "Active" : "Inactive",
              meta: [`Created: ${ambassador.createdAt.toLocaleString()}`],
            },
          ]}
        />

        <LegalPacketControlStateSection
          heading="Control State"
          cards={[
            {
              items: [
                `Ambassador active: ${ambassador.isActive ? "Yes" : "No"}`,
                `Commission rate: ${(ambassador.commission * 100).toFixed(0)}%`,
                `Commissions tracked: ${ambassador.commissions.length}`,
                `Payouts tracked: ${ambassador.payouts.length}`,
              ],
            },
            {
              items: [
                `Total commissions: $${totalCommissions.toFixed(2)}`,
                `Pending payouts: ${pendingPayouts.length}`,
                `Latest payout state: ${ambassador.payouts[0]?.status ?? "none"}`,
                `Latest commission source: ${ambassador.commissions[0]?.sourceType ?? "none"}`,
              ],
            },
          ]}
          annotation={
            pendingPayouts.length
              ? {
                  label: "Pending payout review",
                  body: pendingPayouts
                    .map((row) => `${row.status} · $${row.amount.toFixed(2)} · ${row.createdAt.toLocaleString()}`)
                    .join("\n"),
                }
              : null
          }
        />

        <LegalPacketRecordListSection
          heading="Commission Records"
          emptyText="No commission records found."
          items={ambassador.commissions.map((row) => ({
            id: row.id,
            badges: [
              <span key="sourceType" className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300">
                {row.sourceType}
              </span>,
            ],
            title: `$${row.amount.toFixed(2)}`,
            body: `Source ID: ${row.sourceId}`,
            footer: row.createdAt.toLocaleString(),
          }))}
        />

        <LegalPacketEvidenceTimelineSection
          heading="Payout Timeline"
          emptyText="No payout records found."
          items={ambassador.payouts.map((row) => ({
            id: row.id,
            badges: [
              <span key="status" className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300">
                {row.status}
              </span>,
            ],
            timestamp: row.createdAt.toLocaleString(),
            body: `Payout amount: $${row.amount.toFixed(2)}`,
          }))}
        />

        <LegalPacketAppendixSection
          heading="Appendix Snapshot"
          content={JSON.stringify(packetData, null, 2)}
        />
      </div>
    </main>
  );
}
