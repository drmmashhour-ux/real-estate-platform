import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { dealAutopilotFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { requireBrokerDealAccess } from "@/lib/broker/residential-access";
import { prisma } from "@repo/db";
import { loadDealForAutopilot } from "@/modules/deal-autopilot/deal-autopilot.service";
import { runDealAutopilotEngine } from "@/modules/deal-autopilot/deal-autopilot.engine";
import { DealAutopilotPanel } from "@/components/deal-autopilot/DealAutopilotPanel";

export const dynamic = "force-dynamic";

export default async function DealAutopilotPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const { locale, country, id } = await params;
  const base = `/${locale}/${country}/broker/residential`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${base}/deals/${id}/autopilot`)}`);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    redirect(`${base}/deals`);
  }

  if (!dealAutopilotFlags.smartDealAutopilotV1) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-ds-text-secondary">
        Smart Deal Autopilot is disabled. Set <code className="text-ds-gold">FEATURE_SMART_DEAL_AUTOPILOT_V1=1</code>.
      </main>
    );
  }

  const dealAccess = await requireBrokerDealAccess(userId, id, user.role === PlatformRole.ADMIN);
  if (!dealAccess) notFound();

  const deal = await loadDealForAutopilot(id);
  if (!deal) notFound();
  const snapshot = runDealAutopilotEngine(deal);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href={`${base}/deals/${id}`} className="text-ds-gold hover:text-amber-200">
          ← Deal
        </Link>
        <Link href={`${base}/deals/${id}/negotiation`} className="text-ds-gold hover:text-amber-200">
          Negotiation assist →
        </Link>
      </div>
      <h1 className="font-serif text-2xl text-ds-text">Smart Deal Autopilot</h1>
      <DealAutopilotPanel snapshot={snapshot} />
    </div>
  );
}
