import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { CSV_IMPORT_DEFAULT_PERMISSION, parseGrowthCsv } from "@/lib/growth/csv-import";
import { bulkCreateFromCsv } from "@/lib/growth/lead-service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  csvText: z.string().min(1).max(2_000_000),
  permissionStatus: z.enum(["granted_by_source", "requested", "granted"]).optional(),
});

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

  const { rows, errors } = parseGrowthCsv(parsed.data.csvText);
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, created: 0, errors: errors.length ? errors : ["No valid rows"] }, { status: 400 });
  }

  const perm = parsed.data.permissionStatus ?? CSV_IMPORT_DEFAULT_PERMISSION;
  const { created } = await bulkCreateFromCsv(rows, perm);

  return NextResponse.json({ ok: true, created, parseErrors: errors });
}
