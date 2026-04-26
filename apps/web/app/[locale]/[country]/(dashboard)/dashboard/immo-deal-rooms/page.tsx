import Link from "next/link";
import { redirect } from "next/navigation";
import { ImmoDealRoomsListClient } from "@/components/immo-deal-room/ImmoDealRoomsListClient";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { roleCanUseImmoDealRooms } from "@/modules/deal-room/deal-room-access";
import { listDealRoomsVisibleToUser } from "@/modules/deal-room/deal-room.service";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export default async function ImmoContactDealRoomsPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || !roleCanUseImmoDealRooms(user.role)) {
    redirect("/dashboard");
  }

  const rooms = listDealRoomsVisibleToUser({ userId, userRole: user.role });

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 px-4 py-8 text-slate-100">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">ImmoContact</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Collaboration deal rooms</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          File-backed, auditable workspace for notes, tasks, meeting links, and document rows. This is separate from
          pipeline <Link href="/dashboard/deal-rooms">deal rooms (CRM)</Link> and from formal closings. V1 is
          internal/broker/operator–first — see docs.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Persistence: JSON under <code className="rounded bg-black/40 px-1 py-0.5">apps/web/data/deal-rooms.json</code>
          unless <code className="rounded bg-black/40 px-1 py-0.5">DEAL_ROOMS_JSON_PATH</code> is set.
        </p>
      </header>

      <ImmoDealRoomsListClient rooms={rooms} />
    </div>
  );
}
