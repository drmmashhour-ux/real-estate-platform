import { DocumentEventType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { requireDocumentUser } from "@/modules/documents/services/api-helpers";
import {
  canDownloadDocument,
  type UserForDocuments,
} from "@/modules/documents/services/document-permissions";
import { logDocumentEvent } from "@/modules/documents/services/log-document-event";
import { readDocumentFileFromStorage } from "@/modules/documents/services/storage-adapter";
import { sanitizeFileNameForStorage } from "@/modules/documents/services/sanitize-filename";

export const dynamic = "force-dynamic";

/**
 * GET /api/documents/files/:id/download — stream file bytes (auth + permission).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireDocumentUser(request);
  if (user instanceof NextResponse) return user;
  const { id } = await context.params;

  const file = await prisma.documentFile.findUnique({
    where: { id },
    include: {
      accessGrants: { select: { userId: true } },
    },
  });
  if (!file || file.status === "DELETED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (file.status === "UPLOADING" || file.status === "FAILED") {
    return NextResponse.json({ error: "File not available" }, { status: 409 });
  }

  const u: UserForDocuments = { id: user.userId, role: user.role };
  if (!(await canDownloadDocument(u, file))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buf = await readDocumentFileFromStorage(file.storageKey);

  await logDocumentEvent({
    type: DocumentEventType.FILE_DOWNLOADED,
    actorId: user.userId,
    documentFileId: file.id,
    message: file.fileName,
  });

  void trackDemoEvent(DemoEvents.DOCUMENT_DOWNLOADED, { documentId: file.id }, user.userId);

  const safe = sanitizeFileNameForStorage(file.originalName || file.fileName);
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${safe}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
