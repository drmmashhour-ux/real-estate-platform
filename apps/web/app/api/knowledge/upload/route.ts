import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { uploadKnowledgeDocument } from "@/src/modules/knowledge/ingestion/uploadKnowledgeDocument";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const type = String(body.type ?? "law") as "law" | "drafting" | "internal";
  const fileUrl = String(body.fileUrl ?? "").trim();
  const rawText = typeof body.rawText === "string" ? body.rawText : undefined;
  if (!title || !fileUrl) return NextResponse.json({ error: "title and fileUrl required" }, { status: 400 });
  const { document, chunkCount } = await uploadKnowledgeDocument({ title, type, fileUrl, rawText });
  return NextResponse.json({ document, chunkCount });
}
