import { requireUser } from "@/modules/security/access-guard.service";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/compliance/consents — list current user consents
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const consents = await prisma.lecipmRegulatoryConsent.findMany({
      where: { userId: auth.userId },
    });

    return NextResponse.json({ consents });
  } catch (error) {
    console.error("[compliance:api] list consents failed", error);
    return NextResponse.json({ error: "Failed to fetch consents" }, { status: 500 });
  }
}

/**
 * POST /api/compliance/consents — record a new consent
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { type, granted } = await req.json();
    if (!type) {
      return NextResponse.json({ error: "Consent type is required" }, { status: 400 });
    }

    const { recordConsent } = await import("@/modules/compliance/compliance.service");
    const result = await recordConsent(auth.userId, type, granted);

    return NextResponse.json({ ok: true, consent: result });
  } catch (error) {
    console.error("[compliance:api] record consent failed", error);
    return NextResponse.json({ error: "Failed to record consent" }, { status: 500 });
  }
}
