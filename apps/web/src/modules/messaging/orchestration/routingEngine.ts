import { prisma } from "@/lib/db";
import { logGrowthAiOrchestrationAction } from "@/src/modules/messaging/orchestration/actionLogger";
import { assignmentAdminFallbackUserId } from "@/src/modules/messaging/orchestration/orchestrationEnv";
import type { RouteType } from "@/src/modules/messaging/orchestration/leadScoring";

export type AssigneeSelection = {
  brokerId?: string;
  hostId?: string;
  adminId?: string;
};

function sortBrokerAccess<T extends { role: string; brokerId: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const rank = (r: string) => (r === "owner" ? 0 : r === "collaborator" ? 1 : 2);
    return rank(a.role) - rank(b.role);
  });
}

export async function selectAssignee(params: {
  routeType: RouteType;
  city?: string | null;
  propertyType?: string | null;
  listingId?: string | null;
}): Promise<AssigneeSelection> {
  const adminFallback = assignmentAdminFallbackUserId();
  const { routeType, city, propertyType, listingId } = params;

  if (routeType === "support" || routeType === "broker_recruitment" || routeType === "host_recruitment") {
    return adminFallback ? { adminId: adminFallback } : {};
  }

  if (listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        ownerId: true,
        brokerAccesses: { select: { brokerId: true, role: true } },
      },
    });
    if (listing) {
      if (routeType === "buyer" && listing.brokerAccesses.length > 0) {
        const pick = sortBrokerAccess(listing.brokerAccesses)[0];
        return { brokerId: pick.brokerId };
      }
      if (routeType === "booking" && listing.ownerId) {
        return { hostId: listing.ownerId };
      }
      if (routeType === "buyer" && listing.ownerId) {
        return adminFallback ? { adminId: adminFallback } : {};
      }
    }
  }

  const rules = await prisma.growthAiAssignmentRule.findMany({
    where: {
      routeType,
      isActive: true,
      OR: [{ city: null }, ...(city ? [{ city }] : [])],
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    take: 12,
  });

  const match = rules.find((r) => {
    if (r.propertyType && propertyType && r.propertyType !== propertyType) return false;
    return true;
  });

  if (match?.brokerId) return { brokerId: match.brokerId };
  if (match?.hostId) return { hostId: match.hostId };

  return adminFallback ? { adminId: adminFallback } : {};
}

export async function assignLead(params: {
  orchestrationId: string;
  conversationId: string;
  selection: AssigneeSelection;
  source: string;
}): Promise<void> {
  const { orchestrationId, conversationId, selection, source } = params;
  const now = new Date();

  const assignedBrokerId = selection.brokerId ?? null;
  const assignedHostId = selection.hostId ?? null;
  const assignedAdminId = selection.adminId ?? null;

  const primaryAssignee =
    assignedBrokerId ?? assignedHostId ?? assignedAdminId ?? null;

  await prisma.growthAiLeadOrchestration.update({
    where: { id: orchestrationId },
    data: {
      assignedBrokerId,
      assignedHostId,
      assignedAdminId,
      assignmentStatus: primaryAssignee ? "assigned" : "unassigned",
      assignedAt: primaryAssignee ? now : null,
      lastActionAt: now,
    },
  });

  if (primaryAssignee) {
    await prisma.growthAiConversation.update({
      where: { id: conversationId },
      data: { assignedToId: primaryAssignee },
    });
  }

  await logGrowthAiOrchestrationAction({
    orchestrationId,
    conversationId,
    actionType: "assign_lead",
    resultStatus: "ok",
    actionPayload: { source, ...selection },
  });
}
