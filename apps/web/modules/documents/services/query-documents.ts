import type {
  DocumentCategory,
  DocumentVisibility,
  PlatformRole,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  canViewDocument,
  type UserForDocuments,
} from "@/modules/documents/services/document-permissions";
import { serializeDocumentFile } from "@/modules/documents/services/serialize-file";

export type DocumentSearchFilters = {
  q?: string;
  category?: DocumentCategory;
  visibility?: DocumentVisibility;
  contextType?: "listing" | "client" | "offer" | "contract" | "appointment" | "conversation";
  from?: string;
  to?: string;
  uploaderName?: string;
};

export async function queryDocumentsForUser(
  userId: string,
  role: PlatformRole,
  filters: DocumentSearchFilters
) {
  const user: UserForDocuments = { id: userId, role };

  const where: Prisma.DocumentFileWhereInput = {
    status: { not: "DELETED" },
  };

  if (filters.category) where.category = filters.category;
  if (filters.visibility) where.visibility = filters.visibility;

  if (filters.contextType) {
    const k = filters.contextType;
    if (k === "listing") where.listingId = { not: null };
    else if (k === "client") where.brokerClientId = { not: null };
    else if (k === "offer") where.offerId = { not: null };
    else if (k === "contract") where.contractId = { not: null };
    else if (k === "appointment") where.appointmentId = { not: null };
    else if (k === "conversation") where.conversationId = { not: null };
  }

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { fileName: { contains: q, mode: "insensitive" } },
      { originalName: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { tags: { has: q } },
    ];
  }

  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }

  const files = await prisma.documentFile.findMany({
    where,
    take: 400,
    orderBy: { updatedAt: "desc" },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      accessGrants: { select: { userId: true } },
    },
  });

  const out: ReturnType<typeof serializeDocumentFile>[] = [];
  const uname = filters.uploaderName?.trim().toLowerCase();
  for (const f of files) {
    if (uname && f.uploadedBy) {
      const n = (f.uploadedBy.name || "").toLowerCase();
      const e = (f.uploadedBy.email || "").toLowerCase();
      if (!n.includes(uname) && !e.includes(uname)) continue;
    }
    if (await canViewDocument(user, f)) {
      out.push(serializeDocumentFile(f));
    }
  }
  return out;
}
