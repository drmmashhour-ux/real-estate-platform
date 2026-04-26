import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { redirect } from "next/navigation";

export default async function AdminBnhubFinanceRefundsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/bnhub/login");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");

  const rows = await prisma.bnhubMarketplaceRefund.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/bnhub/finance" className="text-sm text-emerald-400">
          ← Hub
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Refunds</h1>
        <ul className="mt-6 space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="rounded border border-slate-800 bg-slate-900/40 p-3">
              {r.refundStatus} · {(r.amountCents / 100).toFixed(2)} {r.currency} · {r.reasonCode}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
