import Link from "next/link";
import { notFound } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import {
  dealExecutionFlags,
  dealTransactionFlags,
  lecipmPaymentsNegotiationFlags,
  productionPipelineFlags,
} from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { canMutateExecution, findDealForParticipant } from "@/lib/deals/execution-access";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DealExecutionWorkspace } from "@/components/deals/DealExecutionWorkspace";
import { DealTimeline } from "@/components/deal-timeline/DealTimeline";

export const dynamic = "force-dynamic";

export default async function DealExecutionPage({ params }: { params: Promise<{ id: string; locale: string; country: string }> }) {
  const userId = await getGuestId();
  if (!userId) notFound();
  const { id } = await params;

  const deal = await findDealForParticipant(id, userId);
  if (!deal) notFound();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, name: true, email: true, twoFactorEmailEnabled: true },
  });
  if (!user) notFound();

  const canMutate = canMutateExecution(userId, user.role, deal);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href={`/dashboard/deals/${id}`} className="text-sm text-amber-400 hover:text-amber-300">
          ← Back to deal
        </Link>
        <h1 className="mt-6 font-serif text-3xl tracking-tight text-amber-50">Deal execution &amp; documents</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          OACIQ-aligned assistance layer. Draft outputs are marked; broker review is required before any export implies
          readiness for third parties.
        </p>

        <DealExecutionWorkspace
          dealId={id}
          canMutate={canMutate}
          copilotEnabled={dealExecutionFlags.dealExecutionCopilotV1}
          showSignaturePanels={dealTransactionFlags.signatureSystemV1}
          showRealProviderSend={dealTransactionFlags.signatureSystemV1 && productionPipelineFlags.signatureRealProvidersV1}
          showNotaryPanels={productionPipelineFlags.notarySystemV1}
          showClosingPanels={productionPipelineFlags.closingPipelineV1}
          showPaymentsHub={lecipmPaymentsNegotiationFlags.trustWorkflowV1}
          showNegotiationHub={lecipmPaymentsNegotiationFlags.negotiationCopilotV1}
          includeDealLedger={lecipmPaymentsNegotiationFlags.dealLedgerV1}
          showDealScoring={dealTransactionFlags.dealExecutionV1}
          showBrokerApprovalStatus={dealTransactionFlags.dealExecutionV1}
          dealScoringRefresh={
            canMutate && dealTransactionFlags.dealExecutionV1 && (user.role === PlatformRole.BROKER || user.role === PlatformRole.ADMIN)
          }
          quickSign={
            canMutate &&
            dealTransactionFlags.dealExecutionV1 &&
            (user.role === PlatformRole.BROKER || user.role === PlatformRole.ADMIN) ?
              {
                displayName: user.name?.trim() || user.email,
                email: user.email,
              }
            : null
          }
        />

        {dealTransactionFlags.dealExecutionV1 ? (
          <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h2 className="text-lg font-medium text-zinc-100">Transaction timeline</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Platform coordination events — not a substitute for official registry or OACIQ records.
            </p>
            <div className="mt-4">
              <DealTimeline dealId={id} />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
