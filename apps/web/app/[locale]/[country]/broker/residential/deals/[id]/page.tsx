import Link from "next/link";
import { PlatformRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { brokerResidentialFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { requireBrokerDealAccess } from "@/lib/broker/residential-access";
import { prisma } from "@/lib/db";
import { DealIntelligencePanel } from "@/components/deals/DealIntelligencePanel";
import { BrokerDealDraftingWorkspace } from "@/components/broker-residential/deals/BrokerDealDraftingWorkspace";
import { ResidentialDealWorkspaceClient } from "@/components/broker-residential/deals/ResidentialDealWorkspaceClient";
import { OaciqEngineDealPanel } from "@/components/broker-residential/deals/OaciqEngineDealPanel";
import { getFormPackageByKey } from "@/modules/form-packages/form-package.service";
import { runResidentialDealWorkspaceEngine } from "@/modules/broker-residential-copilot/broker-residential-copilot.engine";

export const dynamic = "force-dynamic";

export default async function BrokerResidentialDealDetailPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const { locale, country, id } = await params;
  const base = `/${locale}/${country}/broker/residential`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${base}/deals/${id}`)}`);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    redirect(`/${locale}/${country}/broker`);
  }

  if (!brokerResidentialFlags.residentialDealWorkspaceV1 && !brokerResidentialFlags.brokerResidentialDashboardV1) {
    return (
      <p className="text-sm text-ds-text-secondary">
        Residential deal workspace disabled — enable feature flags in environment.
      </p>
    );
  }

  const dealAccess = await requireBrokerDealAccess(userId, id, user.role === PlatformRole.ADMIN);
  if (!dealAccess) notFound();

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
      documents: { orderBy: { createdAt: "desc" }, take: 30 },
      dealParties: true,
      milestones: true,
    },
  });
  if (!deal) notFound();

  const workspace = await runResidentialDealWorkspaceEngine(deal);
  const pkg = deal.assignedFormPackageKey ? getFormPackageByKey(deal.assignedFormPackageKey) : null;
  const executionHref = `/${locale}/${country}/dashboard/deals/${id}/execution`;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap gap-4">
          <Link href={`${base}/deals`} className="text-sm text-ds-gold hover:text-amber-200">
            ← Deals
          </Link>
          <Link href={`${base}/deals/${id}/contract`} className="text-sm text-ds-gold hover:text-amber-200">
            AI Contract Engine →
          </Link>
          <Link href={`${base}/deals/${id}/autopilot`} className="text-sm text-ds-gold hover:text-amber-200">
            Deal autopilot →
          </Link>
          <Link href={`${base}/deals/${id}/negotiation`} className="text-sm text-ds-gold hover:text-amber-200">
            Negotiation assist →
          </Link>
        </div>
        <h2 className="mt-4 font-serif text-2xl text-ds-text">Residential deal file</h2>
        <p className="mt-1 text-sm text-ds-text-secondary">
          Status: {deal.status} · {(deal.priceCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}
        </p>
      </div>

      <DealIntelligencePanel dealId={id} />

      <BrokerDealDraftingWorkspace
        dealId={id}
        executionHref={executionHref}
        documents={deal.documents.map((d) => ({ id: d.id, type: d.type, workflowStatus: d.workflowStatus }))}
      />

      <ResidentialDealWorkspaceClient dealId={id} executionHref={executionHref} />

      <OaciqEngineDealPanel dealId={id} locale={locale} country={country} />

      <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
        <h3 className="font-medium text-ds-text">Parties</h3>
        <p className="mt-2 text-sm text-ds-text-secondary">Buyer: {deal.buyer.name ?? deal.buyer.email}</p>
        <p className="text-sm text-ds-text-secondary">Seller: {deal.seller.name ?? deal.seller.email}</p>
      </section>

      <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
        <h3 className="font-medium text-ds-text">Form package (assistance)</h3>
        <p className="mt-2 text-sm text-ds-text-secondary">{workspace.workflowHint.disclaimer}</p>
        <p className="mt-2 text-sm text-ds-gold">Suggested: {workspace.workflowHint.packageKey}</p>
        {pkg && (
          <ul className="mt-3 list-inside list-disc text-sm text-ds-text-secondary">
            <li>Required: {pkg.requiredDocuments.join("; ")}</li>
            <li>Optional: {pkg.optionalDocuments.join("; ") || "—"}</li>
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
        <h3 className="font-medium text-ds-text">Checklist prompts</h3>
        <ul className="mt-2 space-y-1 text-sm text-ds-text-secondary">
          {workspace.checklist.map((c) => (
            <li key={c.id}>{c.label}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
        <h3 className="font-medium text-ds-text">Drafting / intelligence issues</h3>
        <p className="text-xs text-ds-text-secondary">{workspace.intelligence.disclaimer}</p>
        <ul className="mt-3 space-y-2">
          {workspace.intelligence.issues.slice(0, 12).map((issue, i) => (
            <li key={i} className="rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-sm">
              <span className="text-[10px] font-semibold uppercase text-ds-gold/80">{issue.severity}</span> {issue.title}
              <p className="text-xs text-ds-text-secondary">{issue.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
        <h3 className="font-medium text-ds-text">Documents on file</h3>
        <ul className="mt-2 space-y-1 text-sm text-ds-text-secondary">
          {deal.documents.length === 0 ? (
            <li>No document rows yet.</li>
          ) : (
            deal.documents.map((doc) => (
              <li key={doc.id}>
                {doc.type} — {doc.workflowStatus ?? "no workflow status"}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
