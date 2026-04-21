import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { ensureRetrofitAccess, getRetrofitPlansForListing } from "@/modules/esg/esg-retrofit-planner.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { listingId } = await context.params;
  if (!listingId?.trim()) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const ok = await ensureRetrofitAccess(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const plans = await getRetrofitPlansForListing(listingId);
    return NextResponse.json({ listingId, plans, plannerVersion: plans[0]?.planVersion ?? null });
  } catch {
    return NextResponse.json({ error: "Unable to load retrofit plans" }, { status: 500 });
  }
}
