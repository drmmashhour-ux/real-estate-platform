import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { createProspect, listProspects } from "@/modules/growth/broker-prospect.service";

export const dynamic = "force-dynamic";

const PostZ = z.object({
  name: z.string().min(1).max(200),
  agency: z.string().max(200).optional().nullable(),
  phone: z.string().max(80).optional().nullable(),
  email: z.string().email(),
  source: z.enum(["manual", "instagram", "referral"]).optional(),
  notes: z.string().max(20_000).optional().nullable(),
});

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const prospects = await listProspects();
  return NextResponse.json({ prospects });
}

export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const json = await req.json().catch(() => ({}));
  const parsed = PostZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const row = await createProspect(parsed.data);
  return NextResponse.json({ prospect: row });
}
