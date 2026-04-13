import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { contentMachineFilePath } from "@/lib/content-machine/storage";

export const dynamic = "force-dynamic";

/** Serve rendered JPEG vertical card from disk */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ contentId: string }> }
) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { contentId } = await ctx.params;
  const safe = contentId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }

  const p = contentMachineFilePath(safe, "jpg");
  try {
    const buf = await fs.readFile(p);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
