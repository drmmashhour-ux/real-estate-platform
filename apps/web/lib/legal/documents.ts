/**
 * Legal document storage and retrieval. Safe fallbacks when DB missing or empty.
 */
import { prisma } from "@/lib/db";
import type { LegalDocumentType } from "./constants";

export type LegalDocumentRecord = {
  id: string;
  type: string;
  version: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
};

export async function getActiveDocument(
  type: LegalDocumentType | string
): Promise<LegalDocumentRecord | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  try {
    const doc = await prisma.legalDocument.findFirst({
      where: { type, isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return doc;
  } catch (e) {
    console.warn("[legal] getActiveDocument failed:", e);
    return null;
  }
}

export async function getDocumentByVersion(
  type: string,
  version: string
): Promise<LegalDocumentRecord | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  try {
    const doc = await prisma.legalDocument.findFirst({
      where: { type, version },
    });
    return doc;
  } catch (e) {
    console.warn("[legal] getDocumentByVersion failed:", e);
    return null;
  }
}

export async function getAllActiveDocuments(): Promise<LegalDocumentRecord[]> {
  if (!process.env.DATABASE_URL) {
    return [];
  }
  try {
    const docs = await prisma.legalDocument.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { createdAt: "desc" }],
    });
    const byType = new Map<string, LegalDocumentRecord>();
    for (const d of docs) {
      if (!byType.has(d.type)) byType.set(d.type, d);
    }
    return Array.from(byType.values());
  } catch (e) {
    console.warn("[legal] getAllActiveDocuments failed:", e);
    return [];
  }
}

export async function createOrUpdateDocument(data: {
  type: string;
  version: string;
  content: string;
  setActive?: boolean;
}): Promise<LegalDocumentRecord | null> {
  try {
    if (data.setActive) {
      await prisma.legalDocument.updateMany({
        where: { type: data.type },
        data: { isActive: false },
      });
    }
    const doc = await prisma.legalDocument.create({
      data: {
        type: data.type,
        version: data.version,
        content: data.content,
        isActive: data.setActive !== false,
      },
    });
    return doc;
  } catch (e) {
    console.warn("[legal] createOrUpdateDocument failed:", e);
    return null;
  }
}

export async function getAcceptanceStats(): Promise<
  { documentType: string; version: string; count: number }[]
> {
  try {
    const raw = await prisma.userAgreement.groupBy({
      by: ["documentType", "version"],
      _count: { id: true },
    });
    return raw.map((r) => ({
      documentType: r.documentType,
      version: r.version,
      count: r._count.id,
    }));
  } catch (e) {
    console.warn("[legal] getAcceptanceStats failed:", e);
    return [];
  }
}

/** Set one document as active for its type; all others of same type become inactive. */
export async function setActiveVersion(documentId: string): Promise<boolean> {
  try {
    const doc = await prisma.legalDocument.findUnique({ where: { id: documentId }, select: { type: true } });
    if (!doc) return false;
    await prisma.legalDocument.updateMany({
      where: { type: doc.type },
      data: { isActive: false },
    });
    await prisma.legalDocument.update({
      where: { id: documentId },
      data: { isActive: true },
    });
    return true;
  } catch (e) {
    console.warn("[legal] setActiveVersion failed:", e);
    return false;
  }
}

/** List all documents for a type (for admin), newest first. */
export async function getDocumentsByType(type: string): Promise<LegalDocumentRecord[]> {
  try {
    const docs = await prisma.legalDocument.findMany({
      where: { type },
      orderBy: { createdAt: "desc" },
    });
    return docs;
  } catch (e) {
    console.warn("[legal] getDocumentsByType failed:", e);
    return [];
  }
}
