import Link from "next/link";
import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { brokerResidentialFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildDealExecutionTimeline } from "@/modules/deals/deal-timeline.service";

export const dynamic = "force-dynamic";

export default async function BrokerResidentialTimelinePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/broker/residential`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${base}/timeline`)}`);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) redirect(`/${locale}/${country}/broker`);

  if (!brokerResidentialFlags.brokerResidentialDashboardV1) {
    return (
      <p className="text-sm text-ds-text-secondary">
        Enable <code className="text-ds-gold/90">FEATURE_BROKER_RESIDENTIAL_DASHBOARD_V1</code> for this view.
      </p>
    );
  }

  const deals = await prisma.deal.findMany({
    where: { brokerId: userId },
    orderBy: { updatedAt: "desc" },
    take: 15,
    select: { id: true, status: true, updatedAt: true },
  });

  const timelines = await Promise.all(
    deals.map(async (d) => ({
      dealId: d.id,
      status: d.status,
      events: await buildDealExecutionTimeline(d.id).catch(() => []),
    })),
  );

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl text-ds-text">Deal timelines</h2>
      <p className="text-sm text-ds-text-secondary">
        Operational ordering only — not a juridical timeline. Open a deal for full execution workspace.
      </p>
      <ul className="space-y-6">
        {timelines.map((t) => (
          <li key={t.dealId} className="rounded-2xl border border-ds-border bg-ds-card/60 p-4 shadow-ds-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-ds-text">Deal {t.dealId.slice(0, 8)}…</span>
              <span className="text-xs text-ds-text-secondary">{t.status}</span>
              <Link href={`${base}/deals/${t.dealId}`} className="text-xs text-ds-gold hover:text-amber-200">
                Open →
              </Link>
            </div>
            <ul className="mt-3 space-y-2 border-t border-white/5 pt-3 text-sm text-ds-text-secondary">
              {t.events.length === 0 ? <li>No timeline rows.</li> : null}
              {t.events.slice(0, 12).map((ev, i) => (
                <li key={i}>
                  <span className="text-ds-gold/80">{ev.at}</span> — [{ev.kind}] {ev.title}
                  {ev.detail ? ` — ${ev.detail}` : ""}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
