import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { MortgageDealsAdminClient } from "./mortgage-deals-admin-client";

export const dynamic = "force-dynamic";

export default async function AdminMortgageDealsPage() {
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/admin/mortgage-deals");
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/");

  const deals = await prisma.mortgageDeal.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      expert: { select: { id: true, name: true, email: true } },
      lead: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          pipelineStatus: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/admin" className="text-sm text-emerald-400 hover:underline">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Mortgage deals &amp; commission</h1>
        <p className="mt-2 text-sm text-slate-400">
          Verify expert-reported closes and adjust platform vs expert shares when needed.
        </p>
        <MortgageDealsAdminClient initialDeals={deals} />
      </div>
    </main>
  );
}
