import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { generateClosingPackage } from "@/lib/notary-closing";

/**
 * POST /api/notary-closing/generate-package
 * Body: { transactionId: string }
 * Generates a full closing package for the transaction (offer, property sheet, buyer/seller info, broker details, transaction summary, payment summary, ownership verification, broker authorization).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const transactionId = body.transactionId;
    if (!transactionId || typeof transactionId !== "string") {
      return Response.json({ error: "transactionId required" }, { status: 400 });
    }

    const pkg = await generateClosingPackage(transactionId, userId);
    return Response.json(pkg);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to generate closing package";
    return Response.json({ error: message }, { status: 400 });
  }
}
