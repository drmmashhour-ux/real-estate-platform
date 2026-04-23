import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { dealAutopilotFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { requireBrokerDealAccess } from "@/lib/broker/residential-access";
import { prisma } from "@repo/db";
import { runNegotiationAutopilotAssist } from "@/modules/negotiation-autopilot/negotiation-autopilot.service";
import { generateCpDeltaHints } from "@/modules/negotiation-autopilot/cp-delta-generator.service";
import { NegotiationAutopilotPanel } from "@/components/negotiation-autopilot/NegotiationAutopilotPanel";
import { PPtoCPDiffCard } from "@/components/negotiation-autopilot/PPtoCPDiffCard";

export const dynamic = "force-dynamic";

export default async function NegotiationAutopilotPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const { locale, country, id } = await params;
  const base = `/${locale}/${country}/broker/residential`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${base}/deals/${id}/negotiation`)}`);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    redirect(`${base}/deals`);
  }

  if (!dealAutopilotFlags.negotiationAutopilotAssistV1 || !dealAutopilotFlags.ppCpScenarioBuilderV1) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-ds-text-secondary">
        Negotiation Autopilot Assist is disabled. Enable{" "}
        <code className="text-ds-gold">FEATURE_NEGOTIATION_AUTOPILOT_ASSIST_V1</code> and{" "}
        <code className="text-ds-gold">FEATURE_PP_CP_SCENARIO_BUILDER_V1</code>.
      </main>
    );
  }

  const dealAccess = await requireBrokerDealAccess(userId, id, user.role === PlatformRole.ADMIN);
  if (!dealAccess) notFound();

  const result = await runNegotiationAutopilotAssist(id);

  const docs = await prisma.dealDocument.findMany({
    where: { dealId: id },
    select: { templateKey: true, structuredData: true },
    take: 40,
  });
  const ppDoc = docs.find((d) => d.templateKey?.toUpperCase().includes("PP"));
  const cpDoc = docs.find((d) => d.templateKey?.toUpperCase().includes("CP"));
  const delta = generateCpDeltaHints({
    ppStructured: ppDoc?.structuredData as Record<string, unknown> | undefined,
    cpStructured: cpDoc?.structuredData as Record<string, unknown> | undefined,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href={`${base}/deals/${id}`} className="text-ds-gold hover:text-amber-200">
          ← Deal
        </Link>
        <Link href={`${base}/deals/${id}/autopilot`} className="text-ds-gold hover:text-amber-200">
          Deal autopilot →
        </Link>
      </div>
      <h1 className="font-serif text-2xl text-ds-text">Negotiation Autopilot Assist</h1>
      <PPtoCPDiffCard changedKeys={delta.changedKeys} notes={delta.notes} />
      <NegotiationAutopilotPanel result={result} />
    </div>
  );
}
