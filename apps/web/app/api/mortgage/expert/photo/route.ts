import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@repo/db";
import { requireMortgageExpertWithTerms } from "@/modules/mortgage/services/expert-guard";
import { scanBufferBeforeStorage } from "@/lib/security/malware-scan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 2_500_000;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function POST(req: Request) {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;
  const { userId, expert } = session;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field required" }, { status: 400 });
  }
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED.has(mime)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images allowed" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 2.5 MB)" }, { status: 400 });
  }

  const scan = await scanBufferBeforeStorage({
    bytes: buf,
    mimeType: mime,
    context: "mortgage_expert_photo",
  });
  if (!scan.ok) {
    return NextResponse.json({ error: scan.userMessage }, { status: scan.status ?? 422 });
  }

  const ext = extFromMime(mime);
  const relative = `/uploads/mortgage-experts/${expert.id}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "mortgage-experts");
  const fsPath = path.join(process.cwd(), "public", relative.replace(/^\//, ""));

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(fsPath, buf);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not save file" }, { status: 500 });
  }

  const updated = await prisma.mortgageExpert.update({
    where: { id: expert.id },
    data: { photo: relative },
  });

  return NextResponse.json({ ok: true, photo: updated.photo });
}
