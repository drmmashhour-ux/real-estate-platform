import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildChecklistForPackage } from "@/modules/deals/deal-checklist.service";

export const dynamic = "force-dynamic";

export default async function BrokerResidentialChecklistsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/broker/residential`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${base}/checklists`)}`);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) redirect(`/${locale}/${country}/broker`);

  const deals = await prisma.deal.findMany({
    where: { brokerId: userId, status: { notIn: ["closed", "cancelled"] } },
    take: 15,
    select: { id: true, assignedFormPackageKey: true },
  });

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl text-ds-text">Checklist board</h2>
      <p className="text-sm text-ds-text-secondary">Per-deal brokerage checklist prompts — confirm against your office standards.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {deals.map((d) => {
          const items = buildChecklistForPackage(d.assignedFormPackageKey);
          return (
            <div key={d.id} className="rounded-2xl border border-ds-border bg-ds-card/60 p-4 shadow-ds-soft">
              <p className="text-xs font-semibold uppercase text-ds-gold/80">Deal {d.id.slice(0, 8)}…</p>
              <ul className="mt-2 list-inside list-disc text-sm text-ds-text-secondary">
                {items.map((i) => (
                  <li key={i.id}>{i.label}</li>
                ))}
              </ul>
              <a className="mt-2 inline-block text-xs text-ds-gold hover:text-amber-200" href={`${base}/deals/${d.id}`}>
                Open deal →
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
