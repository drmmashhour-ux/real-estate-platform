import { readFile } from "fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { resolveBrokerSession } from "@/lib/compliance/broker-session";
import { getSignedUrl } from "@/lib/storage/get-signed-url";
import { SUPABASE_STORAGE_BUCKETS } from "@/lib/supabase/buckets";

export const dynamic = "force-dynamic";

/** GET — secure PDF for the authenticated broker (`id` = BrokerInsurance row). */
export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  const gate = await resolveBrokerSession(userId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const id = req.nextUrl.searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const row = await prisma.brokerInsurance.findFirst({
    where: { id, brokerId: gate.brokerId },
    select: { documentStorageKey: true },
  });
  const key = row?.documentStorageKey;
  if (!key) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (key.startsWith("local:")) {
    const rel = key.slice("local:".length);
    const diskPath = path.join(process.cwd(), "private", "uploads", rel);
    try {
      const buf = await readFile(diskPath);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'inline; filename="professional-liability.pdf"',
          "Cache-Control": "private, no-store",
        },
      });
    } catch {
      return NextResponse.json({ error: "File not available" }, { status: 404 });
    }
  }

  const signed = await getSignedUrl(SUPABASE_STORAGE_BUCKETS.documents, key, 120);
  if (!signed) {
    return NextResponse.json({ error: "Could not create download link" }, { status: 503 });
  }

  return NextResponse.redirect(signed);
}
