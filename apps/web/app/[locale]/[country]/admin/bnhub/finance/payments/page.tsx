import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminBnhubFinancePaymentsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/bnhub/login");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");

  const rows = await prisma.bnhubReservationPayment.findMany({
    orderBy: { updatedAt: "desc" },
    take: 80,
    include: {
      booking: { select: { confirmationCode: true } },
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/bnhub/finance" className="text-sm text-emerald-400">
          ← Hub
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Marketplace payments</h1>
        <ul className="mt-6 space-y-2 font-mono text-xs">
          {rows.map((r) => (
            <li key={r.id} className="rounded border border-slate-800 bg-slate-900/40 p-3">
              {r.id.slice(0, 8)}… · booking {r.bookingId.slice(0, 8)}… · {r.paymentStatus} ·{" "}
              {(r.amountCapturedCents / 100).toFixed(2)} {r.currency}
              {r.booking.confirmationCode ? ` · ${r.booking.confirmationCode}` : ""}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
