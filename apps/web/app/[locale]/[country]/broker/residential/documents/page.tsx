import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { brokerResidentialFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BrokerResidentialDocumentsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/broker/residential`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${base}/documents`)}`);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) redirect(`/${locale}/${country}/broker`);

  if (!brokerResidentialFlags.residentialDocumentWorkspaceV1) {
    return (
      <p className="text-sm text-ds-text-secondary">
        Set <code className="text-ds-gold/90">FEATURE_RESIDENTIAL_DOCUMENT_WORKSPACE_V1=1</code> for the dedicated document hub (uses same APIs as deal workspaces).
      </p>
    );
  }

  const deals = await prisma.deal.findMany({
    where: { brokerId: userId },
    select: { id: true },
  });
  const ids = deals.map((d) => d.id);
  const docs =
    ids.length === 0
      ? []
      : await prisma.dealDocument.findMany({
          where: { dealId: { in: ids } },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, dealId: true, type: true, workflowStatus: true, templateKey: true },
        });

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl text-ds-text">Document queue</h2>
      <p className="text-sm text-ds-text-secondary">Cross-deal drafting rows — open a deal for prefill, checks, and export.</p>
      <ul className="space-y-2">
        {docs.map((d) => (
          <li key={d.id} className="rounded-xl border border-ds-border bg-ds-card/60 px-4 py-2 text-sm">
            <a className="text-ds-gold hover:text-amber-200" href={`${base}/deals/${d.dealId}`}>
              {d.type} · {d.workflowStatus ?? "—"} {d.templateKey ? `· ${d.templateKey}` : ""}
            </a>
          </li>
        ))}
      </ul>
      {docs.length === 0 ? <p className="text-sm text-ds-text-secondary">No document rows.</p> : null}
    </div>
  );
}
