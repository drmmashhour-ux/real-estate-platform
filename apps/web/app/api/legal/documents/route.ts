import { NextResponse } from "next/server";
import { getUserRole } from "@/lib/auth/session";
import { createOrUpdateDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";

export const dynamic = "force-dynamic";

/** POST: create a new legal document version (admin only). */
export async function POST(req: Request) {
  const role = await getUserRole();
  if (role !== "admin") {
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
