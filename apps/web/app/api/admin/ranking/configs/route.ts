import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { seedDefaultRankingConfigs } from "@/src/modules/ranking/seedRankingConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const rows = await prisma.rankingConfig.findMany({ orderBy: { configKey: "asc" } });
  return NextResponse.json({ configs: rows });
}

export async function POST() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  await seedDefaultRankingConfigs();
  const rows = await prisma.rankingConfig.findMany({ orderBy: { configKey: "asc" } });
  return NextResponse.json({ ok: true, configs: rows });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const configKey = typeof o.configKey === "string" ? o.configKey : "";
  const weightsJson = o.weightsJson;
  const isActive = typeof o.isActive === "boolean" ? o.isActive : undefined;
  if (!configKey) return NextResponse.json({ error: "configKey required" }, { status: 400 });
  if (weightsJson != null && (typeof weightsJson !== "object" || weightsJson === null)) {
    return NextResponse.json({ error: "weightsJson must be object" }, { status: 400 });
  }
  const updated = await prisma.rankingConfig.update({
    where: { configKey },
    data: {
      ...(weightsJson != null ? { weightsJson: weightsJson as object } : {}),
      ...(isActive != null ? { isActive } : {}),
    },
  });
  return NextResponse.json({ config: updated });
}
