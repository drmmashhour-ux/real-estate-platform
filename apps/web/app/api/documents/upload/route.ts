import { DocumentEventType, type DocumentCategory, type DocumentVisibility } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { requireDocumentUser } from "@/modules/documents/services/api-helpers";
import {
  DOCUMENT_ALLOWED_MIME_TYPES,
  DOCUMENT_MAX_BYTES,
} from "@/modules/documents/services/constants";
import { parseFolderContextFromParams } from "@/modules/documents/services/parse-context";
import { getOrCreateFolderForContext } from "@/modules/documents/services/create-folder";
import {
  canAccessDocumentContext,
  canAccessFolder,
  type UserForDocuments,
} from "@/modules/documents/services/document-permissions";
import { logDocumentEvent } from "@/modules/documents/services/log-document-event";
import { notifyDocumentUploaded } from "@/modules/documents/services/document-notifications";
import { sanitizeFileNameForStorage } from "@/modules/documents/services/sanitize-filename";
import { uploadDocumentFile, getStorageProviderName } from "@/modules/documents/services/storage-adapter";
import { serializeDocumentFile } from "@/modules/documents/services/serialize-file";
import type { ContextKind } from "@/modules/messaging/services/messaging-permissions";
import { scanBufferBeforeStorage } from "@/lib/security/malware-scan";

export const dynamic = "force-dynamic";

const CATEGORY_SET = new Set<string>([
  "IDENTITY",
  "FINANCIAL",
  "CONTRACT",
  "DISCLOSURE",
  "PROPERTY",
  "APPOINTMENT",
  "MESSAGE_ATTACHMENT",
  "OTHER",
]);

const VISIBILITY_SET = new Set<string>([
  "PRIVATE_INTERNAL",
  "SHARED_PARTICIPANTS",
  "BROKER_ONLY",
  "CLIENT_VISIBLE",
  "ADMIN_ONLY",
]);

function normalizeMime(m: string): string {
  const x = m.toLowerCase().trim();
  if (x === "image/jpg") return "image/jpeg";
  return x;
}

function parseTags(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);
}

/**
 * POST /api/documents/upload — multipart form: file, optional folderId, context, category, visibility, ...
 */
export async function POST(request: NextRequest) {
  const auth = await requireDocumentUser(request);
  if (auth instanceof NextResponse) return auth;
  const { userId, role } = auth;

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const fileEntry = form.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  const file = fileEntry;

  if (file.size > DOCUMENT_MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const mime = normalizeMime(file.type || "application/octet-stream");
  if (!DOCUMENT_ALLOWED_MIME_TYPES.has(mime)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const folderId = (form.get("folderId") as string | null)?.trim() || null;
  const contextType = (form.get("contextType") as string | null)?.trim() || null;
  const contextId = (form.get("contextId") as string | null)?.trim() || null;

  const categoryRaw = (form.get("category") as string | null)?.trim() || "OTHER";
  const visibilityRaw = (form.get("visibility") as string | null)?.trim() || "PRIVATE_INTERNAL";
  const description = (form.get("description") as string | null)?.trim() || null;
  const tags = parseTags((form.get("tags") as string | null) ?? null);

  if (!CATEGORY_SET.has(categoryRaw)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!VISIBILITY_SET.has(visibilityRaw)) {
    return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
  }
  const category = categoryRaw as DocumentCategory;
  const visibility = visibilityRaw as DocumentVisibility;

  const u: UserForDocuments = { id: userId, role };

  if (folderId) {
    const folder = await prisma.documentFolder.findUnique({ where: { id: folderId } });
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
    if (!(await canAccessFolder(u, folder))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return finishUpload(folder);
  }
  if (contextType && contextId) {
    const ctx = parseFolderContextFromParams(contextType, contextId);
    if (!ctx) {
      return NextResponse.json({ error: "Invalid context" }, { status: 400 });
    }
    const kind =
      ctx.kind === "conversation" ? "conversation" : (ctx.kind as ContextKind);
    if (!(await canAccessDocumentContext(u, kind, ctx.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const folder = await getOrCreateFolderForContext(ctx, userId);
    return finishUpload(folder);
  }
  return NextResponse.json(
    { error: "folderId or (contextType + contextId) required" },
    { status: 400 }
  );

  async function finishUpload(
    folder: NonNullable<Awaited<ReturnType<typeof prisma.documentFolder.findUnique>>>
  ) {
    const rawName = (file.name || "file").replace(/[/\\]/g, "");
    const originalName = sanitizeFileNameForStorage(rawName);
    const buffer = Buffer.from(await file.arrayBuffer());

    const scan = await scanBufferBeforeStorage({
      bytes: buffer,
      mimeType: mime,
      context: "workspace_document",
    });
    if (!scan.ok) {
      return NextResponse.json(
        { error: scan.userMessage },
        { status: scan.status ?? 422 }
      );
    }

    const uploaded = await uploadDocumentFile({
      buffer,
      originalName,
      userId,
    });

    const created = await prisma.documentFile.create({
      data: {
        folderId: folder.id,
        uploadedById: userId,
        fileName: originalName,
        originalName,
        mimeType: mime,
        sizeBytes: uploaded.sizeBytes,
        storageKey: uploaded.storageKey,
        storageProvider: getStorageProviderName(),
        checksum: uploaded.checksum,
        status: "AVAILABLE",
        visibility,
        category,
        listingId: folder.listingId,
        brokerClientId: folder.brokerClientId,
        offerId: folder.offerId,
        contractId: folder.contractId,
        appointmentId: folder.appointmentId,
        conversationId: folder.conversationId,
        description: description ?? undefined,
        tags,
      },
      include: {
        uploadedBy: { select: { name: true, email: true } },
        accessGrants: { select: { userId: true } },
      },
    });

    await logDocumentEvent({
      type: DocumentEventType.FILE_UPLOADED,
      actorId: userId,
      documentFileId: created.id,
      folderId: folder.id,
      message: originalName,
    });

    notifyDocumentUploaded({ documentFileId: created.id, uploadedById: userId });

    void trackDemoEvent(
      DemoEvents.DOCUMENT_UPLOADED,
      { category: created.category, contextType: contextType ?? "folder" },
      userId
    );

    return NextResponse.json({ file: serializeDocumentFile(created) });
  }
}
