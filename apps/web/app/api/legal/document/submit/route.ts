import { NextResponse } from "next/server";
import { legalHubFlags } from "@/config/feature-flags";
import { requireUser } from "@/lib/auth/require-user";
import { submitLegalDocument } from "@/modules/legal/legal-document.service";

export const dynamic = "force-dynamic";

/** POST JSON `{ documentId }` — marks an uploaded draft as submitted for operator review (no automation). */
export async function POST(req: Request) {
  if (!legalHubFlags.legalHubV1 || !legalHubFlags.legalUploadV1) {
    return NextResponse.json({ error: "Legal upload is disabled" }, { status: 403 });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const documentId =
    typeof body === "object" &&
    body !== null &&
    "documentId" in body &&
    typeof (body as { documentId?: unknown }).documentId === "string"
      ? (body as { documentId: string }).documentId.trim()
      : "";

  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }

  const result = await submitLegalDocument({
    userId: auth.user.id,
    documentId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ document: result.document });
}
