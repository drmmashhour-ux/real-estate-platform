import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPackageByTransactionId } from "@/lib/notary-closing";

/**
 * GET /api/notary-closing/package/transaction/:id (id = transactionId)
 * Returns the latest closing package for the given transaction.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: transactionId } = await context.params;
    const pkg = await getPackageByTransactionId(transactionId);
    if (!pkg) return Response.json({ error: "No closing package found for this transaction" }, { status: 404 });
    return Response.json(pkg);
  } catch (e) {
    return Response.json({ error: "Failed to load closing package" }, { status: 500 });
  }
}
