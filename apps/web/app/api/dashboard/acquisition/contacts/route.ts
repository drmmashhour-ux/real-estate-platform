import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { createAcquisitionContact } from "@/modules/acquisition/acquisition.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json()) as {
    type?: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
    source?: string;
    assignedAdminId?: string | null;
  };

  if (!body.name?.trim() || !body.type) {
    return NextResponse.json({ error: "name_and_type_required" }, { status: 400 });
  }

  const allowed = new Set(["BROKER", "HOST", "RESIDENCE", "USER"]);
  if (!allowed.has(body.type)) return NextResponse.json({ error: "invalid_type" }, { status: 400 });

  try {
    const contact = await createAcquisitionContact({
      type: body.type as "BROKER" | "HOST" | "RESIDENCE" | "USER",
      name: body.name,
      email: body.email,
      phone: body.phone,
      source: (body.source as "manual" | "referral" | "event") ?? "manual",
      assignedAdminId: body.assignedAdminId ?? undefined,
    });
    return NextResponse.json({ ok: true, contact });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "create_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
