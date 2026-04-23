import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { logBehaviorSignal } from "@/lib/suggestions/signals";

export const dynamic = "force-dynamic";

/**
 * POST /api/suggestions/signal — record a behavior signal (listing view, deal view, etc.).
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json().catch(() => ({}))) as {
    ownerType?: string;
    signalType?: string;
    referenceType?: string | null;
    referenceId?: string | null;
    metadata?: Prisma.InputJsonValue | null;
  };

  if (!body.signalType || typeof body.signalType !== "string") {
    return NextResponse.json({ error: "signalType required" }, { status: 400 });
  }

  const ownerType =
    typeof body.ownerType === "string" && body.ownerType.length > 0 ? body.ownerType : "solo_broker";

  const row = await logBehaviorSignal({
    ownerType,
    ownerId: auth.id,
    signalType: body.signalType,
    referenceType: body.referenceType,
    referenceId: body.referenceId,
    metadata: body.metadata ?? null,
  });

  return NextResponse.json({ success: true, signal: row });
}
