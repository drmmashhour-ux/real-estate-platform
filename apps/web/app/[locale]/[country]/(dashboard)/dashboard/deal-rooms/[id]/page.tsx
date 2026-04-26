import { notFound, redirect } from "next/navigation";
import { DealRoomDetailClient } from "@/components/deal-rooms/DealRoomDetailClient";
import { loadDealRoomPageData } from "@/lib/deals/load-deal-room-page";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAuthenticatedUser } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set(["BROKER", "ADMIN", "MORTGAGE_BROKER"]);

export default async function DealRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || !BROKER_LIKE.has(user.role)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const payload = await loadDealRoomPageData(id, userId, user.role);
  if (!payload.ok) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 text-slate-100">
      <DealRoomDetailClient dealRoomId={id} initial={JSON.parse(JSON.stringify(payload.data))} />
    </div>
  );
}
