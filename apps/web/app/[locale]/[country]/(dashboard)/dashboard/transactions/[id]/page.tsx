import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SdTransactionWorkspace } from "@/components/transactions/sd-transaction-workspace";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { canAccessTransaction } from "@/modules/transactions/transaction-policy";
import { getTransactionById } from "@/modules/transactions/transaction.service";
import { toTransactionWire } from "@/modules/transactions/transaction.types";
import { evaluateCompliance } from "@/modules/transactions/transaction-compliance.service";
import { getDocuments } from "@/modules/transactions/transaction-document.service";
import { getFinancial } from "@/modules/transactions/transaction-financial.service";
import { getNotaryPackage } from "@/modules/transactions/transaction-notary.service";
import { listSignaturePackets } from "@/modules/transactions/transaction-signature.service";
import { listParties } from "@/modules/transactions/transaction-party.service";
import { listTimeline } from "@/modules/transactions/transaction-timeline.service";
import { TransactionPrivacyPanel } from "@/modules/privacy/components/TransactionPrivacyPanel";
import { MandatoryPrivacyWarnings } from "@/modules/privacy/components/MandatoryPrivacyWarnings";

export const dynamic = "force-dynamic";

export default async function SdTransactionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const { locale, country, id } = await params;
  const dash = `/${locale}/${country}/dashboard`;

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    redirect(dash);
  }

  const base = `/${locale}/${country}/dashboard/transactions`;

  const row = await getTransactionById(id);
  if (!row) notFound();
  if (!canAccessTransaction(user.role, userId, row.brokerId)) {
    redirect(base);
  }

  const [parties, events, sdDocs, financial, notaryPkg] = await Promise.all([
    listParties(id),
    listTimeline(id),
    getDocuments(id),
    getFinancial(id),
    getNotaryPackage(id),
  ]);

  const w = toTransactionWire(row);

  return (
    <div className="space-y-6 p-4 text-sm">
      <div>
        <Link className="text-primary underline" href={base}>
          ← Back
        </Link>
      </div>
      <div>
        <h1 className="text-lg font-semibold font-mono">{w.transactionNumber}</h1>
        <p className="text-muted-foreground">Status: {w.status}</p>
        <p>Title: {w.title ?? "—"}</p>
        <p>Type: {w.transactionType}</p>
        {row.listing?.title ?
          <p>Listing: {row.listing.listingCode} — {row.listing.title}</p>
        : null}
        {row.property ?
          <p>Property: {row.property.address}, {row.property.city}</p>
        : null}
        <p>
          <Link className="text-primary underline" href={`${base}/${id}/credit`}>
            Tenant credit verification (Trustii)
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SdTransactionWorkspace
        transactionId={id}
        transactionNumber={w.transactionNumber}
        initialDocs={sdDocs.map((d) => ({
          id: d.id,
          documentType: d.documentType,
          title: d.title,
          status: d.status,
          versionNumber: d.versionNumber,
          transactionNumber: d.transactionNumber,
          fileUrl: d.fileUrl,
          requiredForClosing: d.requiredForClosing,
        }))}
        initialFinancial={
          financial ?
            {
              lenderName: financial.lenderName,
              approvalStatus: financial.approvalStatus,
              approvedAmount: financial.approvedAmount,
              interestRate: financial.interestRate,
              conditionsJson: financial.conditionsJson,
            }
          : null
        }
        initialNotary={
          notaryPkg ?
            {
              packageStatus: notaryPkg.packageStatus,
              notaryName: notaryPkg.notaryName,
              notaryEmail: notaryPkg.notaryEmail,
              sentAt: notaryPkg.sentAt?.toISOString() ?? null,
            }
          : null
        }
        initialPackets={sigPackets.map((p) => ({
          id: p.id,
          status: p.status,
          documentId: p.documentId,
          sentAt: p.sentAt?.toISOString() ?? null,
          completedAt: p.completedAt?.toISOString() ?? null,
          signers: p.signers.map((s) => ({
            id: s.id,
            role: s.role,
            name: s.name,
            email: s.email,
            status: s.status,
            signedAt: s.signedAt?.toISOString() ?? null,
          })),
          document: p.document ?
            {
              id: p.document.id,
              title: p.document.title,
              status: p.document.status,
              transactionNumber: p.document.transactionNumber,
            }
          : null,
        }))}
        initialCompliance={{
          blockingIssues: compliance.blockingIssues,
          warnings: compliance.warnings,
        }}
      />
        </div>

        <div className="space-y-6">
          <TransactionPrivacyPanel transactionId={id} />
          <MandatoryPrivacyWarnings />
        </div>
      </div>

      <section>
        <h2 className="font-medium">Parties</h2>
        {parties.length === 0 ?
          <p className="text-muted-foreground">No parties yet.</p>
        : <ul className="list-inside list-disc">
            {parties.map((p) => (
              <li key={p.id}>
                {p.role} — {p.displayName}
                {p.email ? ` (${p.email})` : ""}
              </li>
            ))}
          </ul>
        }
      </section>
      <section>
        <h2 className="font-medium">Timeline</h2>
        <ul className="space-y-1">
          {events.map((e) => (
            <li key={e.id}>
              <span className="font-mono text-xs text-muted-foreground">{e.createdAt.toISOString()}</span>{" "}
              <span className="font-medium">{e.eventType}</span> — {e.summary}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
