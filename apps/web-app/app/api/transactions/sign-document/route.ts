import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { signDocument } from "@/lib/transactions/documents";
import type { SignerRole } from "@/lib/transactions/documents";

/**
 * POST /api/transactions/sign-document
 * Body: document_id, signer_role (buyer|seller|broker)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const documentId = body.document_id as string;
    const signerRole = body.signer_role as string;

    if (!documentId || !signerRole) {
      return Response.json(
        { error: "document_id and signer_role (buyer|seller|broker) are required" },
        { status: 400 }
      );
    }
    const roles: SignerRole[] = ["buyer", "seller", "broker"];
    if (!roles.includes(signerRole as SignerRole)) {
      return Response.json({ error: "signer_role must be buyer, seller, or broker" }, { status: 400 });
    }

    const result = await signDocument({
      documentId,
      signerId: userId,
      signerRole: signerRole as SignerRole,
    });

    return Response.json({
      all_signed: result.allSigned,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Sign failed" },
      { status: 500 }
    );
  }
}
