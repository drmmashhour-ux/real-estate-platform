import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { recordManualPattern } from "@/modules/ai-memory/pattern-extraction";

export const dynamic = "force-dynamic";

function brokerGate(role: PlatformRole): boolean {
  return role === PlatformRole.BROKER || role === PlatformRole.ADMIN;
}

/**
 * GET /api/ai-memory/patterns?formKey= — broker/admin; not public.
 */
export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (!brokerGate(auth.user.role)) {
    return NextResponse.json({ error: "Broker or admin required" }, { status: 403 });
  }

  const formKey = req.nextUrl.searchParams.get("formKey")?.trim() || null;
  const patterns = await prisma.aiCorrectionPattern.findMany({
    where: formKey ? { OR: [{ formKey }, { formKey: null }] } : {},
    orderBy: [{ frequency: "desc" }, { updatedAt: "desc" }],
    take: 100,
    select: {
      id: true,
      formKey: true,
      findingKey: true,
      frequency: true,
      originalText: true,
      correctedText: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ patterns });
}

/**
 * POST /api/ai-memory/patterns — record a broker correction snippet (increments pattern frequency).
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (!brokerGate(auth.user.role)) {
    return NextResponse.json({ error: "Broker or admin required" }, { status: 403 });
  }

  let body: {
    findingKey?: string;
    originalText?: string;
    correctedText?: string;
    formKey?: string | null;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const findingKey = typeof body.findingKey === "string" ? body.findingKey.trim() : "";
  const originalText = typeof body.originalText === "string" ? body.originalText : "";
  const correctedText = typeof body.correctedText === "string" ? body.correctedText : "";
  const formKey = typeof body.formKey === "string" ? body.formKey.trim() : null;

  if (!findingKey || originalText.length < 12 || correctedText.length < 12) {
    return NextResponse.json({ error: "findingKey, originalText, correctedText required" }, { status: 400 });
  }

  const result = await recordManualPattern({
    formKey,
    findingKey,
    originalText,
    correctedText,
  });

  return NextResponse.json(result);
}
