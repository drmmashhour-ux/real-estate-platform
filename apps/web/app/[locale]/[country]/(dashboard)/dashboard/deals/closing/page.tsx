import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  initiated: "Initiated",
  offer_submitted: "Offer submitted",
  accepted: "Accepted",
  inspection: "Inspection",
  financing: "Financing",
  closing_scheduled: "Closing scheduled",
  closed: "Closed",
  cancelled: "Cancelled",
};

/** Residential / transactional closing deals (buyer–seller–broker), distinct from investment pipeline. */
export default async function ClosingDealsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const { locale, country } = await params;
  const prefix = `/${locale}/${country}`;

  const deals = await prisma.deal.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
    },
    include: {
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
      broker: { select: { name: true } },
      _count: { select: { milestones: true, documents: true, payments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href={`${prefix}/dashboard/deals`} className="text-sm text-amber-400 hover:text-amber-300">
          ← Investment pipeline
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Closing deals</h1>
        <p className="mt-1 text-slate-400">
          Track milestones, documents, and payments for residential transaction deals.
        </p>

        {deals.length === 0 ?
          <p className="mt-8 text-slate-500">No closing deals yet.</p>
        : <ul className="mt-6 space-y-3">
            {deals.map((d) => (
              <li key={d.id}>
                <Link
                  href={`${prefix}/dashboard/deals/${d.id}`}
                  className="block rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 hover:border-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-slate-200">
                      {d.buyer.name ?? d.buyer.email} → {d.seller.name ?? d.seller.email}
                    </span>
                    <span className="text-sm text-slate-400">
                      ${(d.priceCents / 100).toLocaleString()} · {STATUS_LABELS[d.status] ?? d.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {d._count.milestones} milestones · {d._count.documents} docs · {d._count.payments} payments
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        }
      </div>
    </main>
  );
}
