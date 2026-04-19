import type { PlatformRole } from "@prisma/client";

import { canComment, canEditTasksAndDocs, canManageDealRoom } from "@/modules/deal-room/deal-room-access";
import { canReviewDocumentRequirements } from "@/modules/deal-room/deal-room-document-workflow.service";
import type { DealRoom } from "@/modules/deal-room/deal-room.types";

export function getImmoDealRoomAbilities(args: {
  userId: string;
  userRole: PlatformRole;
  room: DealRoom;
}): { canManage: boolean; canEdit: boolean; canComment: boolean; canReviewDocs: boolean } {
  return {
    canManage: canManageDealRoom(args),
    canEdit: canEditTasksAndDocs(args),
    canComment: canComment(args),
    canReviewDocs: canReviewDocumentRequirements(args.userRole),
  };
}

export function contextLinkForRoom(room: DealRoom): { href: string; label: string } {
  switch (room.entityType) {
    case "listing":
      return { href: `/listings/${encodeURIComponent(room.entityId)}`, label: "Listing" };
    case "lead":
      return { href: `/dashboard/leads/${encodeURIComponent(room.entityId)}`, label: "Lead" };
    case "broker":
      return { href: "/dashboard/broker", label: "Broker workspace" };
    case "booking":
      return { href: "/dashboard/bnhub", label: "BNHUB" };
    case "property":
      return { href: `/listings/${encodeURIComponent(room.entityId)}`, label: "Property" };
  }
}
