import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function OffersPage() {
  const user = await getCurrentUser();
  const offers = await prisma.offer.findMany({
    where: { buyerId: user?.id },
    include: { property: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="text-2xl font-light text-white">Your offers</h1>
      <ul className="mt-6 space-y-3 text-sm">
        {offers.map((o) => (
          <li
            key={o.id}
            className="rounded-xl border border-emerald-900/50 bg-[#0c1a14] px-4 py-3"
          >
            <span className="text-[#d4af37]">{o.status}</span> ·{" "}
            {o.property.title} — ${Number(o.amount).toLocaleString()}
          </li>
        ))}
        {offers.length === 0 && (
          <li className="text-emerald-200/50">No offers yet — browse listings and submit one.</li>
        )}
      </ul>
    </div>
  );
}
