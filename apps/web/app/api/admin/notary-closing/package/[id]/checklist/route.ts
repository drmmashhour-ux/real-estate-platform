import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { CLOSING_DOCUMENT_TYPES } from "@/lib/notary-closing/types";

/**
 * GET /api/admin/notary-closing/package/:id/checklist (id = packageId)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { id: packageId } = await context.params;
    const docs = await prisma.closingPackageDocument.findMany({
      where: { packageId },
      select: { documentType: true, documentId: true },
    });
    const present = new Set(docs.map((d) => d.documentType));
    const checklist = CLOSING_DOCUMENT_TYPES.map((type) => ({
      documentType: type,
      present: present.has(type),
      documentId: docs.find((d) => d.documentType === type)?.documentId ?? null,
    }));
    return Response.json({ packageId, checklist });
  } catch (e) {
    return Response.json({ error: "Failed to load checklist" }, { status: 500 });
  }
}
