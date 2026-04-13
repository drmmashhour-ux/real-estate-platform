import Link from "next/link";
import { redirect } from "next/navigation";
import { DealRoomsListClient } from "@/components/deal-rooms/DealRoomsListClient";
import { NewDealRoomForm } from "@/components/deal-rooms/NewDealRoomForm";
import { prisma } from "@/lib/db";
import { listDealRooms } from "@/lib/deals/list-deal-rooms";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set(["BROKER", "ADMIN", "MORTGAGE_BROKER"]);

export default async function DealRoomsPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || !BROKER_LIKE.has(user.role)) {
    redirect("/dashboard");
  }

  const scope =
    user.role === "ADMIN"
      ? ({ mode: "admin" as const } as const)
      : ({ mode: "broker" as const, brokerUserId: userId } as const);

  const rooms = await listDealRooms(scope, { archived: false }, { take: 300 });

  const staleCutoff = new Date();
  staleCutoff.setHours(staleCutoff.getHours() - 72);

  const adminStats =
    user.role === "ADMIN"
      ? await Promise.all([
          prisma.dealRoom.count({ where: { isArchived: false } }),
          prisma.dealRoom.count({
            where: {
              isArchived: false,
              updatedAt: { lt: staleCutoff },
              stage: { notIn: ["closed", "lost"] },
            },
          }),
          prisma.dealRoomDocument.count({
            where: { status: { in: ["requested", "review_required"] } },
          }),
          prisma.dealRoomPayment.count({ where: { status: "pending" } }),
        ])
      : null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-8 text-slate-100">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Transactions</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Deal rooms</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Central workspace for listings, leads, tasks, visits, documents, and payment status. This does not replace
            formal sale <Link href="/dashboard/deals">closing deals</Link> — it coordinates the broker workflow.
          </p>
        </div>
        <Link href="/dashboard/crm" className="text-sm text-amber-400 hover:text-amber-300">
          ← Inquiry CRM
        </Link>
      </header>

      {adminStats ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm">
            <p className="text-xs text-slate-500">Active rooms</p>
            <p className="text-lg font-semibold text-white">{adminStats[0]}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm">
            <p className="text-xs text-slate-500">Quiet 3+ days (not closed)</p>
            <p className="text-lg font-semibold text-amber-200">{adminStats[1]}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm">
            <p className="text-xs text-slate-500">Documents awaiting</p>
            <p className="text-lg font-semibold text-slate-100">{adminStats[2]}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm">
            <p className="text-xs text-slate-500">Payments pending</p>
            <p className="text-lg font-semibold text-slate-100">{adminStats[3]}</p>
          </div>
        </section>
      ) : null}

      <NewDealRoomForm />

      <DealRoomsListClient initialRooms={JSON.parse(JSON.stringify(rooms))} userRole={user.role} />
    </div>
  );
}
