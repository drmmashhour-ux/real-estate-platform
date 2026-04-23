import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { setChecklistItemVerification } from "@/services/compliance/coownershipCompliance.service";
import type { ComplianceVerificationLevel } from "@prisma/client";

export const dynamic = "force-dynamic";

const LEVELS = new Set<ComplianceVerificationLevel>(["DECLARED", "DOCUMENTED", "VERIFIED"]);

/** POST /api/compliance/:listingId/verify/:key — update verification level */
export async function POST(req: Request, ctx: { params: Promise<{ listingId: string; key: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId, key } = await ctx.params;
  const decodedKey = decodeURIComponent(key);

  const ok = await canAccessCrmListingCompliance(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { level?: ComplianceVerificationLevel } = {};
  try {
    body = (await req.json()) as { level?: ComplianceVerificationLevel };
  } catch {
    body = {};
  }

  const level = body.level ?? "DOCUMENTED";
  if (!LEVELS.has(level)) {
    return NextResponse.json({ error: "Invalid verification level" }, { status: 400 });
  }

  try {
    const item = await setChecklistItemVerification(listingId, decodedKey, level, userId);
    return NextResponse.json({ item });
  } catch (e) {
    console.error("[api][compliance][verify]", e);
    return NextResponse.json({ error: "Failed to update verification" }, { status: 500 });
  }
}
