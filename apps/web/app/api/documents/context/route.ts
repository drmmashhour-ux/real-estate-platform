import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireDocumentUser } from "@/modules/documents/services/api-helpers";
import { parseFolderContextFromParams } from "@/modules/documents/services/parse-context";
import { getOrCreateFolderForContext } from "@/modules/documents/services/create-folder";
import {
  canAccessDocumentContext,
  canViewDocument,
  type UserForDocuments,
} from "@/modules/documents/services/document-permissions";
import { serializeDocumentFile } from "@/modules/documents/services/serialize-file";
import type { ContextKind } from "@/modules/messaging/services/messaging-permissions";

export const dynamic = "force-dynamic";

/**
 * GET /api/documents/context?type=offer&id=...
 */
export async function GET(request: NextRequest) {
  const user = await requireDocumentUser(request);
  if (user instanceof NextResponse) return user;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const ctx = parseFolderContextFromParams(type, id);
  if (!ctx) {
    return NextResponse.json({ error: "type and id query params required" }, { status: 400 });
  }

  const u: UserForDocuments = { id: user.userId, role: user.role };
  const kind =
    ctx.kind === "conversation" ? "conversation" : (ctx.kind as ContextKind);
  if (!(await canAccessDocumentContext(u, kind, ctx.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const folder = await getOrCreateFolderForContext(ctx, user.userId);

  const filesRaw = await prisma.documentFile.findMany({
    where: { folderId: folder.id, status: { not: "DELETED" } },
    orderBy: { updatedAt: "desc" },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      accessGrants: { select: { userId: true } },
    },
  });

  const files = [];
  for (const f of filesRaw) {
    if (await canViewDocument(u, f)) {
      files.push(serializeDocumentFile(f));
    }
  }

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
    files,
  });
}
