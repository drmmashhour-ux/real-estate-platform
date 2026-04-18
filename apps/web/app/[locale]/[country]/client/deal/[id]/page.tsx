import { notFound, redirect } from "next/navigation";
import { dealTransactionFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { findDealForParticipant } from "@/lib/deals/execution-access";
import { ClientDealSummary } from "@/components/client-deal/ClientDealSummary";
import { ClientOaciqProgressHint } from "@/components/client-deal/ClientOaciqProgressHint";

export const dynamic = "force-dynamic";

export default async function ClientDealPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const { locale, country, id } = await params;
  const base = `/${locale}/${country}`;

  if (!dealTransactionFlags.clientDealViewV1) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-zinc-400">
        Client deal view is disabled. Enable <code className="text-amber-400">FEATURE_CLIENT_DEAL_VIEW_V1</code>.
      </main>
    );
  }

  const userId = await getGuestId();
  if (!userId) {
    redirect(`${base}/auth/login?next=${encodeURIComponent(`${base}/client/deal/${id}`)}`);
  }

  const deal = await findDealForParticipant(id, userId);
  if (!deal) notFound();

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-xl">
        <h1 className="font-serif text-2xl text-zinc-50">Deal overview</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Track progress and next steps. Your broker remains responsible for official OACIQ execution and signing
          workflows.
        </p>
        <div className="mt-8">
          <ClientDealSummary dealId={id} />
          <ClientOaciqProgressHint />
        </div>
      </div>
    </main>
  );
}
