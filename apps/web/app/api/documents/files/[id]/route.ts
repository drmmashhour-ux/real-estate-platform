import { DocumentEventType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireDocumentUser } from "@/modules/documents/services/api-helpers";
import {
  canAccessFolder,
  canManageDocument,
  canViewDocument,
  type UserForDocuments,
} from "@/modules/documents/services/document-permissions";
import { logDocumentEvent } from "@/modules/documents/services/log-document-event";
import { serializeDocumentFile } from "@/modules/documents/services/serialize-file";
import { notifyDocumentViewed } from "@/modules/documents/services/document-notifications";

export const dynamic = "force-dynamic";

const fileInclude = {
  uploadedBy: { select: { name: true, email: true } },
  accessGrants: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
} as const;

async function loadFile(id: string) {
  return prisma.documentFile.findUnique({
    where: { id },
    include: fileInclude,
  });
}

/**
 * GET /api/documents/files/:id — metadata (no storage key).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireDocumentUser(request);
  if (user instanceof NextResponse) return user;
  const { id } = await context.params;

  const file = await loadFile(id);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const u: UserForDocuments = { id: user.userId, role: user.role };
  if (!(await canViewDocument(u, file))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await logDocumentEvent({
    type: DocumentEventType.FILE_VIEWED,
    actorId: user.userId,
    documentFileId: file.id,
    message: file.fileName,
  });
  notifyDocumentViewed({ documentFileId: file.id, userId: user.userId });

  return NextResponse.json({
    file: {
      ...serializeDocumentFile(file),
      accessGrants: file.accessGrants.map((g) => ({
        userId: g.userId,
        access: g.access,
        user: g.user,
      })),
    },
  });
}

/**
 * PATCH /api/documents/files/:id — rename, description, tags, category, visibility, optional folder move.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireDocumentUser(request);
  if (user instanceof NextResponse) return user;
  const { id } = await context.params;

  const file = await prisma.documentFile.findUnique({
    where: { id },
    include: { accessGrants: { select: { userId: true } } },
  });
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const u: UserForDocuments = { id: user.userId, role: user.role };
  if (!(await canManageDocument(u, file))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    fileName?: string;
    description?: string | null;
    tags?: string[];
    category?: string;
    visibility?: string;
    folderId?: string | null;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let nextFolderId = file.folderId;
  let listingId = file.listingId;
  let brokerClientId = file.brokerClientId;
  let offerId = file.offerId;
  let contractId = file.contractId;
  let appointmentId = file.appointmentId;
  let conversationId = file.conversationId;

  if (body.folderId !== undefined && body.folderId !== file.folderId) {
    if (body.folderId === null) {
      return NextResponse.json({ error: "folderId cannot be null" }, { status: 400 });
    }
    const folder = await prisma.documentFolder.findUnique({ where: { id: body.folderId } });
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
    if (!(await canAccessFolder(u, folder))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    nextFolderId = folder.id;
    listingId = folder.listingId;
    brokerClientId = folder.brokerClientId;
    offerId = folder.offerId;
    contractId = folder.contractId;
    appointmentId = folder.appointmentId;
    conversationId = folder.conversationId;
  }

  const data: Parameters<typeof prisma.documentFile.update>[0]["data"] = {};
  let renamed = false;
  if (body.fileName !== undefined) {
    const name = body.fileName.trim();
    if (!name) {
      return NextResponse.json({ error: "fileName empty" }, { status: 400 });
    }
    if (name !== file.fileName) renamed = true;
    data.fileName = name;
  }
  if (body.description !== undefined) data.description = body.description;
  if (body.tags !== undefined) data.tags = body.tags.slice(0, 40);
  if (body.category !== undefined) data.category = body.category as typeof file.category;
  if (body.visibility !== undefined) data.visibility = body.visibility as typeof file.visibility;
  if (body.folderId !== undefined) {
    data.folderId = nextFolderId;
    data.listingId = listingId;
    data.brokerClientId = brokerClientId;
    data.offerId = offerId;
    data.contractId = contractId;
    data.appointmentId = appointmentId;
    data.conversationId = conversationId;
  }

  const updated = await prisma.documentFile.update({
    where: { id },
    data,
    include: fileInclude,
  });

  if (renamed) {
    await logDocumentEvent({
      type: DocumentEventType.FILE_RENAMED,
      actorId: user.userId,
      documentFileId: id,
      message: updated.fileName,
    });
  }
  if (body.folderId !== undefined && body.folderId !== file.folderId) {
    await logDocumentEvent({
      type: DocumentEventType.FILE_MOVED,
      actorId: user.userId,
      documentFileId: id,
      folderId: nextFolderId ?? undefined,
      metadata: { fromFolderId: file.folderId },
    });
  }

  return NextResponse.json({
    file: {
      ...serializeDocumentFile(updated),
      accessGrants: updated.accessGrants.map((g) => ({
        userId: g.userId,
        access: g.access,
        user: g.user,
      })),
    },
  });
}

/**
 * DELETE /api/documents/files/:id — soft delete.
 */
export async function DELETE(
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

  await prisma.documentFile.update({
    where: { id },
    data: { status: "DELETED" },
  });

  await logDocumentEvent({
    type: DocumentEventType.FILE_DELETED,
    actorId: user.userId,
    documentFileId: id,
    message: file.fileName,
  });

  return NextResponse.json({ ok: true });
}
