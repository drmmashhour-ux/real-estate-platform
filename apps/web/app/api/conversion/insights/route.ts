import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { getConversionInsights } from "@/modules/conversion-engine/application/getConversionInsights";
import { buildUrgencySignal } from "@/modules/conversion-engine/application/urgencyEngineService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getGuestId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const insights = await getConversionInsights(prisma, userId);
  const url = new URL(req.url);
  const listingId = url.searchParams.get("listingId");
  const urgency = listingId ? await buildUrgencySignal(prisma, listingId).catch(() => null) : null;
  return NextResponse.json({ ...insights, urgency });
}
