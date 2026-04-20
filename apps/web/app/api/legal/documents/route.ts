import { NextResponse } from "next/server";
import { legalHubFlags } from "@/config/feature-flags";
import { getSession } from "@/lib/auth/get-session";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { createOrUpdateDocument } from "@/lib/legal/documents";
import { getLegalDocumentsByUser } from "@/modules/legal/legal-document.service";

export const dynamic = "force-dynamic";

/** GET: list current user's Legal Hub submission documents (Phase 2). Query `workflowType` optional. */
export async function GET(req: Request) {
  if (!legalHubFlags.legalHubV1 || !legalHubFlags.legalUploadV1) {
    return NextResponse.json({ error: "Legal hub uploads are disabled" }, { status: 403 });
  }

  const { user } = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const workflowType = new URL(req.url).searchParams.get("workflowType")?.trim() || undefined;

  const documents = await getLegalDocumentsByUser({
    userId: user.id,
    workflowType: workflowType ?? null,
  });

  return NextResponse.json({ documents });
}

/** POST: create a new legal document version (admin-only CMS rows). */
export async function POST(req: Request) {
  const role = await getUserRole();
  if (!isHubAdminRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { type, version, content, setActive } = body as {
      type?: string;
      version?: string;
      content?: string;
      setActive?: boolean;
    };
    if (!type || !version || content === undefined) {
      return NextResponse.json(
        { error: "Missing type, version, or content" },
        { status: 400 }
      );
    }
    const allowed = Object.values(LEGAL_DOCUMENT_TYPES) as string[];
    if (!allowed.includes(type)) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }
    const doc = await createOrUpdateDocument({
      type,
      version: String(version).trim(),
      content: String(content),
      setActive: Boolean(setActive),
    });
    if (!doc) {
      return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
    }
    return NextResponse.json(doc);
  } catch (e) {
    console.warn("[legal] POST documents failed:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
