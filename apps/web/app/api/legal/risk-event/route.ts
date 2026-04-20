import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const ENTITY_TYPES = new Set(["LISTING", "SELLER", "BROKER", "TRANSACTION"]);

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const entityType = typeof body.entityType === "string" ? body.entityType.toUpperCase() : "";
  const entityId = typeof body.entityId === "string" ? body.entityId.trim() : "";
  const riskType = typeof body.riskType === "string" ? body.riskType.trim() : "GENERAL";
  const score = typeof body.score === "number" && Number.isFinite(body.score) ? body.score : NaN;
  const flagsRaw = body.flags;
  const explanation =
    typeof body.explanation === "string" ? body.explanation.trim().slice(0, 8000) : "";

  if (!ENTITY_TYPES.has(entityType) || !entityId) {
    return NextResponse.json({ error: "Invalid entityType or entityId" }, { status: 400 });
  }
  if (Number.isNaN(score) || score < 0 || score > 1000) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }
  if (!explanation) {
    return NextResponse.json({ error: "explanation required" }, { status: 400 });
  }

  const flags =
    Array.isArray(flagsRaw) && flagsRaw.every((f) => typeof f === "string") ? flagsRaw : [];

  try {
    const created = await prisma.legalRiskEvent.create({
      data: {
        entityType,
        entityId,
        riskType,
        score,
        flags,
        explanation: `${explanation}\n(recordedByUser:${userId})`,
      },
    });
    return NextResponse.json({ id: created.id, ok: true });
  } catch (e) {
    console.error("POST /api/legal/risk-event", e);
    return NextResponse.json({ error: "Persist failed" }, { status: 500 });
  }
}
