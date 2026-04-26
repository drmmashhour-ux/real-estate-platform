import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export default async function AdminAmbassadorPayoutsPage() {
  const payouts = await prisma.ambassadorPayout.findMany({ orderBy: { createdAt: "desc" }, take: 50 }).catch(() => []);
  const ambassadors = await prisma.ambassador.findMany({ include: { user: { select: { email: true } }, commissions: true } }).catch(() => []);
  return (
    <main className="p-6 text-white">
      <h1 className="text-2xl font-bold">Ambassador payouts</h1>
      <div className="mt-6 space-y-4">
        {ambassadors.map((a) => {
          const unpaid = a.commissions.reduce((s, c) => s + c.amount, 0);
          const payout = payouts.find((p) => p.ambassadorId === a.id);
          return (
            <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium">{a.user.email}</p>
              <p className="text-sm text-slate-400">Unpaid commissions: ${unpaid.toFixed(2)}</p>
              <p className="text-sm text-slate-400">Pending payout: ${payout?.amount.toFixed(2) ?? "0.00"} · {payout?.status ?? "none"}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
