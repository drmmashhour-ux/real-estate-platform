import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");
  const products = await prisma.bnhubTravelProduct.findMany({ take: 40, orderBy: { updatedAt: "desc" } });
  return (
    <HubLayout title="BNHUB travel products" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-4 text-white">
        <Link href="/admin/bnhub/services" className="text-sm text-amber-400">
          ← Services
        </Link>
        <h1 className="text-xl font-bold">Super-app inventory (architecture)</h1>
        <p className="text-sm text-zinc-500">Placeholder rows until partner connectors go live.</p>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
          {products.length === 0 ? (
            <li className="p-4 text-sm text-zinc-500">No products yet.</li>
          ) : (
            products.map((p) => (
              <li key={p.id} className="p-4 text-sm">
                {p.title} <span className="text-zinc-500">({p.productType})</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </HubLayout>
  );
}
