import { NextRequest, NextResponse } from "next/server";
import { LecipmLegalBoundaryEntityType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { convertTransactionToBrokerAssisted } from "@/modules/legal-boundary/broker-conversion.service";

export const dynamic = "force-dynamic";

function parseEntityType(raw: unknown): LecipmLegalBoundaryEntityType | null {
  if (raw === "LISTING" || raw === "DEAL" || raw === "BOOKING") return raw;
  return null;
}

/** POST /api/legal-boundary/convert — FSBO → broker-assisted (pins default broker from env). */
export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const entityType = parseEntityType(body?.entityType);
  const entityId = typeof body?.entityId === "string" ? body.entityId.trim() : "";
  if (!entityType || !entityId) {
    return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 });
  }

  const result = await convertTransactionToBrokerAssisted({ entityType, entityId, actorUserId: userId });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, context: result.context });
}
