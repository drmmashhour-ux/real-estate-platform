import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

export default async function AdminOffersPage() {
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/admin/offers");
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/dashboard");

  const offers = await prisma.offerDocument.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      type: true,
      status: true,
      createdAt: true,
      offerPriceCents: true,
      contractId: true,
    },
  });

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/admin" className="text-sm hover:underline" style={{ color: GOLD }}>
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">Offer documents</h1>
        <p className="mt-1 text-sm text-slate-400">Purchase and rental offers (draft templates).</p>

        <ul className="mt-8 space-y-2">
          {offers.length === 0 ? (
            <li className="text-slate-500">No offers yet.</li>
          ) : (
            offers.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{o.type}</p>
                  <p className="text-xs text-slate-500">
                    {o.status} · {new Date(o.createdAt).toLocaleString()}
                    {o.offerPriceCents != null ? ` · ${(o.offerPriceCents / 100).toFixed(2)} CAD` : ""}
                  </p>
                </div>
                {o.contractId ? (
                  <Link href={`/contracts/${o.contractId}`} className="text-sm font-semibold" style={{ color: GOLD }}>
                    View contract
                  </Link>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>
    </main>
  );
}
