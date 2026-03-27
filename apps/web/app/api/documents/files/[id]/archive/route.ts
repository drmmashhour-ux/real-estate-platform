import { DocumentEventType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireDocumentUser } from "@/modules/documents/services/api-helpers";
import {
  canManageDocument,
  type UserForDocuments,
} from "@/modules/documents/services/document-permissions";
import { logDocumentEvent } from "@/modules/documents/services/log-document-event";
import { serializeDocumentFile } from "@/modules/documents/services/serialize-file";

export const dynamic = "force-dynamic";

/**
 * POST /api/documents/files/:id/archive
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireDocumentUser(request);
  if (user instanceof NextResponse) return user;
  const { id } = await context.params;

  const file = await prisma.documentFile.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const u: UserForDocuments = { id: user.userId, role: user.role };
  if (!(await canManageDocument(u, file))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.documentFile.update({
    where: { id },
    data: { status: "ARCHIVED" },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      accessGrants: { select: { userId: true } },
    },
  });

  await logDocumentEvent({
    type: DocumentEventType.FILE_ARCHIVED,
    actorId: user.userId,
    documentFileId: id,
    message: file.fileName,
  });

  return NextResponse.json({ file: serializeDocumentFile(updated) });
}
