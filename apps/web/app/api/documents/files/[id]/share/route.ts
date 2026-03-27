import { DocumentEventType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { requireDocumentUser } from "@/modules/documents/services/api-helpers";
import {
  canShareDocument,
  type UserForDocuments,
} from "@/modules/documents/services/document-permissions";
import { logDocumentEvent } from "@/modules/documents/services/log-document-event";
import { notifyDocumentShared } from "@/modules/documents/services/document-notifications";
import { onDocumentShared } from "@/modules/notifications/services/workflow-notification-triggers";
import { serializeDocumentFile } from "@/modules/documents/services/serialize-file";

export const dynamic = "force-dynamic";

const VISIBILITY_SET = new Set<string>([
  "PRIVATE_INTERNAL",
  "SHARED_PARTICIPANTS",
  "BROKER_ONLY",
  "CLIENT_VISIBLE",
  "ADMIN_ONLY",
]);

/**
 * POST /api/documents/files/:id/share — update visibility (managers).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireDocumentUser(request);
  if (user instanceof NextResponse) return user;
  const { id } = await context.params;

  const file = await prisma.documentFile.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      accessGrants: { select: { userId: true } },
    },
  });
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const u: UserForDocuments = { id: user.userId, role: user.role };
  if (!(await canShareDocument(u, file))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    visibility?: string;
  } | null;
  if (!body?.visibility || !VISIBILITY_SET.has(body.visibility)) {
    return NextResponse.json({ error: "visibility required" }, { status: 400 });
  }

  const updated = await prisma.documentFile.update({
    where: { id },
    data: { visibility: body.visibility as typeof file.visibility },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      accessGrants: { select: { userId: true } },
    },
  });

  await logDocumentEvent({
    type: DocumentEventType.FILE_SHARED,
    actorId: user.userId,
    documentFileId: id,
    message: body.visibility,
  });

  notifyDocumentShared({ documentFileId: id, visibility: body.visibility });

  const sharedVis = new Set(["SHARED_PARTICIPANTS", "CLIENT_VISIBLE"]);
  if (sharedVis.has(body.visibility)) {
    const title = `Document: ${updated.originalName}`;
    for (const g of updated.accessGrants) {
      if (g.userId && g.userId !== user.userId) {
        void onDocumentShared({
          recipientUserId: g.userId,
          documentFileId: id,
          title,
        });
      }
    }
  }

  void trackDemoEvent(
    DemoEvents.DOCUMENT_SHARED,
    { documentId: id, visibility: body.visibility },
    user.userId
  );

  return NextResponse.json({ file: serializeDocumentFile(updated) });
}
