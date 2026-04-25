import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { generateExecutiveReport } from "@/modules/executive-reporting/report-generator.service";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await getGuestId();
  if (!userId) return { error: NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 }) };
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!u) return { error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  if (u.role !== PlatformRole.ADMIN) {
    return { error: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }) };
  }
  return { userId };
}

/** GET ?id= or ?periodKey= — latest by period if periodKey */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();
    if (id) {
      const row = await prisma.executiveReport.findUnique({ where: { id } });
      if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
      return NextResponse.json({ ok: true, report: row }, { status: 200 });
    }
    const periodKey = searchParams.get("periodKey")?.trim();
    if (periodKey) {
      const row = await prisma.executiveReport.findFirst({
        where: { periodKey },
        orderBy: { generatedAt: "desc" },
      });
      return NextResponse.json({ ok: true, report: row }, { status: 200 });
    }
    const rows = await prisma.executiveReport.findMany({
      orderBy: { generatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        periodKey: true,
        generatedAt: true,
        status: true,
        summaryText: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ ok: true, reports: rows }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 200 });
  }
}

/** POST { periodKey } */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  try {
    const body = (await req.json().catch(() => null)) as { periodKey?: string } | null;
    const periodKey = body?.periodKey?.trim();
    if (!periodKey) {
      return NextResponse.json({ ok: false, error: "periodKey_required" }, { status: 400 });
    }
    const result = await generateExecutiveReport(periodKey);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error, reportId: result.reportId }, { status: 200 });
    }
    return NextResponse.json(
      { ok: true, reportId: result.reportId, view: result.view },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 200 });
  }
}
