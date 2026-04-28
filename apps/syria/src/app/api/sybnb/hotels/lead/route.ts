import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sybnbHotelLeadCreateSchema } from "@/lib/sybnb/sybnb-hotel-lead-schema";

export const runtime = "nodejs";

/** ORDER SYBNB-52 — Admin: list hotel CRM leads (newest first). */
export async function GET(): Promise<Response> {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const rows = await prisma.sybnbHotelLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({
    ok: true,
    leads: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}

/** ORDER SYBNB-52 — Admin: create lead (first contact). */
export async function POST(req: Request): Promise<Response> {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = sybnbHotelLeadCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation", details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, phone, city, notes, status } = parsed.data;

  const row = await prisma.sybnbHotelLead.create({
    data: {
      name,
      phone,
      city,
      notes: notes?.length ? notes : undefined,
      ...(status ? { status } : {}),
    },
  });

  return NextResponse.json({
    ok: true,
    lead: {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  });
}
