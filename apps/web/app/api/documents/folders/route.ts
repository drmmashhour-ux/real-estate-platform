import { NextRequest, NextResponse } from "next/server";
import { requireDocumentUser } from "@/modules/documents/services/api-helpers";
import { parseFolderContextFromParams } from "@/modules/documents/services/parse-context";
import { getOrCreateFolderForContext } from "@/modules/documents/services/create-folder";
import {
  canAccessDocumentContext,
  type UserForDocuments,
} from "@/modules/documents/services/document-permissions";
import type { ContextKind } from "@/modules/messaging/services/messaging-permissions";

export const dynamic = "force-dynamic";

/**
 * POST /api/documents/folders — create or return existing folder for a workflow context.
 */
export async function POST(request: NextRequest) {
  const user = await requireDocumentUser(request);
  if (user instanceof NextResponse) return user;

  const body = (await request.json().catch(() => null)) as {
    contextType?: string;
    contextId?: string;
  } | null;
  if (!body?.contextType || !body.contextId) {
    return NextResponse.json({ error: "contextType and contextId required" }, { status: 400 });
  }

  const ctx = parseFolderContextFromParams(body.contextType, body.contextId);
  if (!ctx) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 });
  }

  const u: UserForDocuments = { id: user.userId, role: user.role };
  const kind =
    ctx.kind === "conversation" ? "conversation" : (ctx.kind as ContextKind);
  const id = ctx.id;
  if (!(await canAccessDocumentContext(u, kind, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const folder = await getOrCreateFolderForContext(ctx, user.userId);
  return NextResponse.json({
    folder: {
      id: folder.id,
      name: folder.name,
      type: folder.type,
      listingId: folder.listingId,
      brokerClientId: folder.brokerClientId,
      offerId: folder.offerId,
      contractId: folder.contractId,
      appointmentId: folder.appointmentId,
      conversationId: folder.conversationId,
      updatedAt: folder.updatedAt.toISOString(),
    },
  });
}
