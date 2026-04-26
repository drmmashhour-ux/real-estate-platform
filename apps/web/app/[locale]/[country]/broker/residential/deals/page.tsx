import Link from "next/link";
import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { brokerResidentialFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export default async function BrokerResidentialDealsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/broker/residential`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${base}/deals`)}`);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    redirect(`/${locale}/${country}/broker`);
  }

  if (!brokerResidentialFlags.residentialDealWorkspaceV1 && !brokerResidentialFlags.brokerResidentialDashboardV1) {
    return (
      <div className="rounded-2xl border border-ds-border bg-ds-card/60 p-8 text-center text-sm text-ds-text-secondary">
        Enable <code className="text-ds-gold/90">FEATURE_RESIDENTIAL_DEAL_WORKSPACE_V1</code> or the main residential dashboard flag.
      </div>
    );
  }

  const deals = await prisma.deal.findMany({
    where: { brokerId: userId, status: { notIn: ["closed", "cancelled"] } },
    orderBy: { updatedAt: "desc" },
    take: 80,
    include: {
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-ds-text">Residential deals</h2>
        <p className="mt-1 text-sm text-ds-text-secondary">Pipeline for your assigned files — statuses are operational, not legal conclusions.</p>
      </div>
      <ul className="space-y-3">
        {deals.map((d) => (
          <li key={d.id}>
            <Link
              href={`${base}/deals/${d.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ds-border bg-ds-card/70 px-4 py-3 shadow-ds-soft transition hover:border-ds-gold/30"
            >
              <div>
                <p className="font-medium text-ds-text">
                  {(d.priceCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })} · {d.status}
                </p>
                <p className="text-xs text-ds-text-secondary">
                  {d.buyer.name ?? d.buyer.email} ↔ {d.seller.name ?? d.seller.email}
                </p>
              </div>
              <span className="text-sm text-ds-gold">Open →</span>
            </Link>
          </li>
        ))}
      </ul>
      {deals.length === 0 ? <p className="text-sm text-ds-text-secondary">No active deals assigned to you.</p> : null}
    </div>
  );
}
