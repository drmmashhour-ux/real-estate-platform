import { NextResponse } from "next/server";
import { getUserRole } from "@/lib/auth/session";
import { setActiveVersion } from "@/lib/legal/documents";

export const dynamic = "force-dynamic";

/** POST: set a document version as active (admin only). */
export async function POST(req: Request) {
  const role = await getUserRole();
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { documentId } = body as { documentId?: string };
    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }
    const ok = await setActiveVersion(documentId);
    if (!ok) {
      return NextResponse.json({ error: "Document not found or update failed" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.warn("[legal] set-active failed:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
