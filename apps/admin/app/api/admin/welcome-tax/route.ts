import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdminSession();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const rows = await prisma.welcomeTaxMunicipalityConfig.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ configs: rows });
}

export async function POST(request: NextRequest) {
  const gate = await requireAdminSession();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const slug = String(body.slug ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const name = String(body.name ?? "");
  const bracketsJson = body.bracketsJson;
  const rebateRulesJson = body.rebateRulesJson ?? null;
  const active = Boolean(body.active ?? true);
  const notes = body.notes != null ? String(body.notes) : null;

  if (!slug || !name || bracketsJson == null) {
    return NextResponse.json({ error: "slug, name, bracketsJson required" }, { status: 400 });
  }

  const row = await prisma.welcomeTaxMunicipalityConfig.create({
    data: {
      slug,
      name,
      bracketsJson: bracketsJson as object,
      ...(rebateRulesJson != null ? { rebateRulesJson: rebateRulesJson as object } : {}),
      active,
      notes,
    },
  });

  return NextResponse.json({ config: row });
}
