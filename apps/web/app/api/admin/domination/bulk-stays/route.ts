import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { bulkCreateDraftStaysFromCsv } from "@/lib/admin/bulk-stay-csv";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  hostUserId: z.string().min(8).max(64),
  csvText: z.string().min(1).max(2_000_000),
});

/**
 * POST /api/admin/domination/bulk-stays — create DRAFT BNHUB stays from CSV for a host (admin only).
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await bulkCreateDraftStaysFromCsv(parsed.data.hostUserId.trim(), parsed.data.csvText);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Import failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
