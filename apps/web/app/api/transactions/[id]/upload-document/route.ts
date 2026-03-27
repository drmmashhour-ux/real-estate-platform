import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { uploadTransactionDocument } from "@/lib/transactions/documents";
import { prisma } from "@/lib/db";
import { DOCUMENT_TYPES } from "@/lib/transactions/constants";

/**
 * POST /api/transactions/:id/upload-document
 * Body: document_type, file_url
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const documentType = body.document_type as string;
    const fileUrl = body.file_url as string;

    if (!id || !documentType || !fileUrl) {
      return Response.json(
        { error: "document_type and file_url are required" },
        { status: 400 }
      );
    }
    if (!DOCUMENT_TYPES.includes(documentType as "purchase_agreement" | "broker_agreement" | "inspection_conditions" | "disclosure" | "amendments")) {
      return Response.json(
        { error: "document_type must be one of: purchase_agreement, broker_agreement, inspection_conditions, disclosure, amendments" },
        { status: 400 }
      );
    }

    const tx = await prisma.realEstateTransaction.findUnique({
      where: { id },
      select: { buyerId: true, sellerId: true, brokerId: true },
    });
    if (!tx) return Response.json({ error: "Transaction not found" }, { status: 404 });
    const isParty = [tx.buyerId, tx.sellerId, tx.brokerId].filter(Boolean).includes(userId);
    if (!isParty) return Response.json({ error: "Access denied" }, { status: 403 });

    const result = await uploadTransactionDocument({
      transactionId: id,
      documentType,
      fileUrl,
    });

    return Response.json({
      document_id: result.documentId,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
