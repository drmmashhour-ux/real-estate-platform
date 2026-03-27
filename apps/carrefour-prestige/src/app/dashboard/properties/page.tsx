import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import Link from "next/link";

export default async function DashboardPropertiesPage() {
  const user = await getCurrentUser();
  const list = await prisma.property.findMany({
    where: { ownerId: user?.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light text-white">Your listings</h1>
        <Link
          href="/dashboard/properties/new"
          className="rounded-full bg-[#d4af37] px-4 py-2 text-xs font-semibold text-[#030712]"
        >
          New listing
        </Link>
      </div>
      <ul className="mt-6 space-y-2 text-sm">
        {list.map((p) => (
          <li key={p.id}>
            <Link href={`/properties/${p.id}`} className="text-emerald-100 hover:text-[#d4af37]">
              {p.title} · {p.status}
            </Link>
          </li>
        ))}
        {list.length === 0 && <li className="text-emerald-200/50">No properties yet.</li>}
      </ul>
    </div>
  );
}
