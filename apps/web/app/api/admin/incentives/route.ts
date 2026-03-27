import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdminSession();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const rows = await prisma.incentiveProgramConfig.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
  return NextResponse.json({ incentives: rows });
}

export async function POST(request: NextRequest) {
  const gate = await requireAdminSession();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const title = String(body.title ?? "");
  const description = String(body.description ?? "");
  const jurisdiction = String(body.jurisdiction ?? "quebec");
  const active = Boolean(body.active ?? true);
  const externalLink = body.externalLink != null ? String(body.externalLink) : null;
  const notes = body.notes != null ? String(body.notes) : null;
  const sortOrder = Number(body.sortOrder ?? 0);

  if (!title || !description) {
    return NextResponse.json({ error: "title and description required" }, { status: 400 });
  }

  const row = await prisma.incentiveProgramConfig.create({
    data: {
      title,
      description,
      jurisdiction,
      active,
      externalLink,
      notes,
      sortOrder,
    },
  });

  return NextResponse.json({ incentive: row });
}
