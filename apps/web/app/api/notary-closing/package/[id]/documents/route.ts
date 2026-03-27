import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPackageDocuments } from "@/lib/notary-closing";

/**
 * GET /api/notary-closing/package/:id/documents (id = packageId)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: packageId } = await context.params;
    const documents = await getPackageDocuments(packageId);
    return Response.json({ documents });
  } catch (e) {
    return Response.json({ error: "Failed to load package documents" }, { status: 500 });
  }
}
