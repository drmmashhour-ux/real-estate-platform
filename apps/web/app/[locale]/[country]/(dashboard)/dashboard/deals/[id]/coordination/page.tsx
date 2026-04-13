import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { coordinationFlags } from "@/lib/deals/coordination-feature-flags";
import { CoordinationWorkspace } from "@/components/coordination/CoordinationWorkspace";

export const dynamic = "force-dynamic";

export default async function DealCoordinationPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) notFound();
  const { id: dealId } = await params;

  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
    },
    select: { id: true, dealCode: true, status: true },
  });
  if (!deal) notFound();

  const flags = await coordinationFlags();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <Link href={`/dashboard/deals/${dealId}`} className="text-sm text-amber-400 hover:text-amber-300">
          ← Deal
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Coordination hub</h1>
        <p className="mt-1 text-sm text-slate-400">
          Deal {deal.dealCode ?? deal.id.slice(0, 8)} · {deal.status}
        </p>
        <div className="mt-8">
          <CoordinationWorkspace dealId={dealId} flags={flags} />
        </div>
      </div>
    </main>
  );
}
