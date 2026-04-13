import { prisma } from "@/lib/db";
import { assertDealRoomAccess } from "./access";
import { computeDealRoomInsights } from "./compute-insights";
import { getDealRoomById, loadThreadPreview, loadVisitsForDealRoom } from "./get-deal-room";

export async function loadDealRoomPageData(
  dealRoomId: string,
  userId: string,
  role: import("@prisma/client").PlatformRole
) {
  const access = await assertDealRoomAccess(dealRoomId, userId, role);
  if (!access.ok) {
    return { ok: false as const, status: access.status };
  }
  const room = await getDealRoomById(dealRoomId);
  if (!room) {
    return { ok: false as const, status: 404 as const };
  }

  const [threadPreview, visitsBundle, draftLinks] = await Promise.all([
    loadThreadPreview(room.threadId),
    loadVisitsForDealRoom({ leadId: room.leadId, listingId: room.listingId }),
    prisma.dealRoomDocument.findMany({
      where: { dealRoomId, documentRefType: "legal_form_draft" },
      select: { id: true },
    }),
  ]);

  const insights = computeDealRoomInsights({
    room: {
      stage: room.stage,
      updatedAt: room.updatedAt,
      nextFollowUpAt: room.nextFollowUpAt,
      lead: room.lead,
    },
    tasks: room.tasks,
    documents: room.documents,
    hasLegalDraft: draftLinks.length > 0,
  });

  const aiSummary =
    room.summary ??
    (room.lead
      ? `Lead ${room.lead.name} — score ${room.lead.score}. Stage ${room.stage.replace(/_/g, " ")}.`
      : `Deal room — ${room.stage.replace(/_/g, " ")}.`);

  return {
    ok: true as const,
    data: {
      room,
      threadPreview,
      visits: visitsBundle,
      insights,
      aiSummary,
      recommendedNextAction: room.nextAction ?? room.lead?.nextBestAction ?? null,
    },
  };
}
