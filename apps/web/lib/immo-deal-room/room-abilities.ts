import type { PlatformRole } from "@prisma/client";

import { canComment, canEditTasksAndDocs, canManageDealRoom } from "@/modules/deal-room/deal-room-access";
import { canReviewDocumentRequirements } from "@/modules/deal-room/deal-room-document-workflow.service";
import type { DealRoom } from "@/modules/deal-room/deal-room.types";

export { contextLinkForRoom } from "./room-abilities-shared";

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
