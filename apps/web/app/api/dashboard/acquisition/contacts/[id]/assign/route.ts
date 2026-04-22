import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { assignAcquisitionOwner } from "@/modules/acquisition/acquisition.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  const body = (await req.json()) as { adminUserId?: string | null };
  const contact = await assignAcquisitionOwner(id, body.adminUserId ?? null);
  if (!contact) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, contact });
}
