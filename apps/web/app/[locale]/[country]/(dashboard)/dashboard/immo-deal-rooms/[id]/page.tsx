import { notFound, redirect } from "next/navigation";
import { ImmoDealRoomDetailClient } from "@/components/immo-deal-room/ImmoDealRoomDetailClient";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { getImmoDealRoomAbilities } from "@/lib/immo-deal-room/room-abilities";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { roleCanUseImmoDealRooms } from "@/modules/deal-room/deal-room-access";
import { assertCanViewRoom, getDealRoom, getDealRoomBundle } from "@/modules/deal-room/deal-room.service";

export const dynamic = "force-dynamic";

export default async function ImmoDealRoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || !roleCanUseImmoDealRooms(user.role)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const room = getDealRoom(id);
  if (!room || !assertCanViewRoom({ userId, userRole: user.role, room })) {
    notFound();
  }

  const bundle = getDealRoomBundle(id);
  if (!bundle) notFound();

  const abilities = getImmoDealRoomAbilities({ userId, userRole: user.role, room });

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 text-slate-100">
      <ImmoDealRoomDetailClient
        roomId={id}
        initial={JSON.parse(JSON.stringify(bundle))}
        abilities={abilities}
      />
    </div>
  );
}
