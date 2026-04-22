import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { addAcquisitionNote } from "@/modules/acquisition/acquisition.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  const body = (await req.json()) as { body?: string };
  if (!body.body?.trim()) return NextResponse.json({ error: "body_required" }, { status: 400 });

  const contact = await addAcquisitionNote(id, body.body, auth.userId ?? null);
  if (!contact) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, contact });
}
